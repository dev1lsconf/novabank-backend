import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  UnprocessableEntityException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { RedisService } from '../../infra/redis/redis.service';
import { LedgerService } from '../ledger/ledger.service';
import { AuditService } from '../audit/audit.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { MoneyUtil } from '../../common/utils/money.util';
import { TransactionType, EntryType, AccountStatus, Role } from '@prisma/client';

@Injectable()
export class TransfersService {
  private readonly logger = new Logger(TransfersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly ledgerService: LedgerService,
    private readonly auditService: AuditService,
  ) {}

  async transfer(
    dto: CreateTransferDto,
    currentUserId: string,
    currentUserRole: string,
    idempotencyKey?: string,
  ) {
    const amountCents = MoneyUtil.decimalToCents(dto.amount);
    if (amountCents <= 0n) {
      throw new BadRequestException('El importe debe ser mayor a cero.');
    }

    // 1. Control de Idempotencia en Redis & DB
    if (idempotencyKey) {
      const cachedResponse = await this.redis.get(`idempotency:tx:${idempotencyKey}`);
      if (cachedResponse) {
        this.logger.log(`⚡ Idempotency Cache HIT para clave: ${idempotencyKey}`);
        return JSON.parse(cachedResponse);
      }

      // Bloquear clave temporalmente para evitar peticiones duplicadas en vuelo
      const lockAcquired = await this.redis.setnx(
        `idempotency:lock:${idempotencyKey}`,
        'PROCESSING',
        60,
      );
      if (!lockAcquired) {
        throw new ConflictException(
          'Una transacción idéntica con esta Idempotency-Key está siendo procesada en este momento.',
        );
      }
    }

    try {
      // 2. Transacción Atómica con Aislamiento y Bloqueo Pesimista
      const result = await this.prisma.$transaction(async (tx) => {
        // A. Buscar cuenta de origen
        const fromAccount = await tx.account.findUnique({
          where: { id: dto.fromAccountId },
        });

        if (!fromAccount) {
          throw new NotFoundException('La cuenta de origen no existe.');
        }

        // Validar titularidad
        if (
          currentUserRole !== Role.ADMIN &&
          currentUserRole !== Role.CAJERO &&
          fromAccount.userId !== currentUserId
        ) {
          throw new ForbiddenException('No tiene autorización sobre la cuenta de origen.');
        }

        if (fromAccount.status !== AccountStatus.ACTIVE) {
          throw new UnprocessableEntityException(
            `La cuenta de origen no está activa (Estado: ${fromAccount.status}).`,
          );
        }

        // B. Buscar cuenta de destino (por UUID o por IBAN)
        const isDestinationUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          dto.destination,
        );

        const toAccount = isDestinationUuid
          ? await tx.account.findUnique({ where: { id: dto.destination } })
          : await tx.account.findUnique({ where: { accountNumber: dto.destination.replace(/\s+/g, '') } });

        if (!toAccount) {
          throw new NotFoundException('La cuenta de destino no existe o el IBAN es incorrecto.');
        }

        if (toAccount.id === fromAccount.id) {
          throw new BadRequestException('La cuenta de origen y destino no pueden ser la misma.');
        }

        if (toAccount.status !== AccountStatus.ACTIVE) {
          throw new UnprocessableEntityException(
            `La cuenta de destino no está activa (Estado: ${toAccount.status}).`,
          );
        }

        // C. Bloqueo Pesimista ordenado por ID lexicográfico (Evita Deadlocks)
        const [firstId, secondId] = [fromAccount.id, toAccount.id].sort();
        await tx.$queryRawUnsafe(
          `SELECT id, balance_cents FROM accounts WHERE id IN ($1, $2) ORDER BY id FOR UPDATE`,
          firstId,
          secondId,
        );

        // Re-leer saldo bloqueado actualizado
        const lockedFrom = await tx.account.findUniqueOrThrow({ where: { id: fromAccount.id } });
        if (lockedFrom.balanceCents < amountCents) {
          throw new UnprocessableEntityException(
            `Saldo insuficiente. Saldo disponible: ${MoneyUtil.formatCurrency(lockedFrom.balanceCents)}, Requerido: ${MoneyUtil.formatCurrency(amountCents)}.`,
          );
        }

        // D. Actualizar saldos en base de datos
        const updatedFrom = await tx.account.update({
          where: { id: fromAccount.id },
          data: { balanceCents: { decrement: amountCents } },
        });

        const updatedTo = await tx.account.update({
          where: { id: toAccount.id },
          data: { balanceCents: { increment: amountCents } },
        });

        // E. Registrar Asiento en Libro Mayor (Double-Entry General Ledger)
        const transactionRecord = await this.ledgerService.recordJournalEntries(tx, {
          type: TransactionType.TRANSFER,
          amountCents,
          currency: fromAccount.currency,
          description: dto.description || 'Transferencia entre cuentas',
          idempotencyKey,
          createdBy: currentUserId,
          postings: [
            {
              accountId: fromAccount.id,
              entryType: EntryType.DEBIT,
              amountCents,
            },
            {
              accountId: toAccount.id,
              entryType: EntryType.CREDIT,
              amountCents,
            },
          ],
        });

        return {
          referenceCode: transactionRecord.referenceCode,
          status: 'COMPLETED',
          amount: dto.amount,
          currency: fromAccount.currency,
          description: transactionRecord.description,
          createdAt: transactionRecord.createdAt,
          originAccount: {
            id: updatedFrom.id,
            accountNumber: updatedFrom.accountNumber,
            newBalance: MoneyUtil.centsToDecimal(updatedFrom.balanceCents),
          },
          destinationAccount: {
            id: updatedTo.id,
            accountNumber: updatedTo.accountNumber,
          },
        };
      });

      // 3. Guardar en Caché de Idempotencia por 24 horas
      if (idempotencyKey) {
        await this.redis.set(
          `idempotency:tx:${idempotencyKey}`,
          JSON.stringify(result),
          86400, // 24 horas
        );
        await this.redis.del(`idempotency:lock:${idempotencyKey}`);
      }

      // 4. Auditoría
      await this.auditService.log({
        userId: currentUserId,
        action: 'TRANSFER_COMPLETED',
        resource: 'Transaction',
        resourceId: result.referenceCode,
        metadata: {
          from: dto.fromAccountId,
          to: dto.destination,
          amount: dto.amount,
          idempotencyKey,
        },
      });

      return result;
    } catch (error) {
      if (idempotencyKey) {
        await this.redis.del(`idempotency:lock:${idempotencyKey}`);
      }
      throw error;
    }
  }
}
