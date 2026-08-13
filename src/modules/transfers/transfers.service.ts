import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  UnprocessableEntityException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JsonDbService } from '../../infra/database/json-db.service';
import { RedisService } from '../../infra/redis/redis.service';
import { LedgerService } from '../ledger/ledger.service';
import { AuditService } from '../audit/audit.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { MoneyUtil } from '../../common/utils/money.util';
import { TransactionType } from '../../common/enums/transaction-type.enum';
import { EntryType } from '../../common/enums/entry-type.enum';
import { AccountStatus } from '../../common/enums/account-type.enum';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class TransfersService {
  private readonly logger = new Logger(TransfersService.name);

  constructor(
    private readonly db: JsonDbService,
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
    const amountCents = Number(MoneyUtil.decimalToCents(dto.amount));
    if (amountCents <= 0) {
      throw new BadRequestException('El importe debe ser mayor a cero.');
    }

    // 1. Control de Idempotencia en Redis
    if (idempotencyKey) {
      const cachedResponse = await this.redis.get(`idempotency:tx:${idempotencyKey}`);
      if (cachedResponse) {
        this.logger.log(`⚡ Idempotency Cache HIT para clave: ${idempotencyKey}`);
        return JSON.parse(cachedResponse);
      }

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
      // 2. Ejecutar Transferencia Atómica sobre JsonDbService
      const fromAccount = await this.db.findAccountById(dto.fromAccountId);
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

      // Buscar cuenta de destino (por UUID o por IBAN)
      const isDestinationUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        dto.destination,
      );

      const toAccount = isDestinationUuid
        ? await this.db.findAccountById(dto.destination)
        : await this.db.findAccountByNumber(dto.destination);

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

      // Validar saldo
      if (fromAccount.balanceCents < amountCents) {
        throw new UnprocessableEntityException(
          `Saldo insuficiente. Saldo disponible: ${MoneyUtil.formatCurrency(fromAccount.balanceCents)}, Requerido: ${MoneyUtil.formatCurrency(amountCents)}.`,
        );
      }

      // Actualizar saldos
      fromAccount.balanceCents -= amountCents;
      toAccount.balanceCents += amountCents;
      fromAccount.updatedAt = new Date().toISOString();
      toAccount.updatedAt = new Date().toISOString();

      // Registrar Asiento en Libro Mayor (Double-Entry General Ledger)
      const transactionRecord = await this.ledgerService.recordJournalEntries({
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

      const result = {
        referenceCode: transactionRecord.referenceCode,
        status: 'COMPLETED',
        amount: dto.amount,
        currency: fromAccount.currency,
        description: transactionRecord.description,
        createdAt: transactionRecord.createdAt,
        originAccount: {
          id: fromAccount.id,
          accountNumber: fromAccount.accountNumber,
          newBalance: MoneyUtil.centsToDecimal(fromAccount.balanceCents),
        },
        destinationAccount: {
          id: toAccount.id,
          accountNumber: toAccount.accountNumber,
        },
      };

      // 3. Guardar en Caché de Idempotencia por 24 horas
      if (idempotencyKey) {
        await this.redis.set(
          `idempotency:tx:${idempotencyKey}`,
          JSON.stringify(result),
          86400,
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
