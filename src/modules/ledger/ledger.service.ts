import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { EntryType, TransactionType, TransactionStatus, Prisma } from '@prisma/client';

export interface LedgerPosting {
  accountId: string;
  entryType: EntryType;
  amountCents: bigint;
}

export interface CreateLedgerTransactionParams {
  type: TransactionType;
  amountCents: bigint;
  currency: string;
  description: string;
  idempotencyKey?: string;
  createdBy?: string;
  postings: LedgerPosting[];
}

@Injectable()
export class LedgerService {
  private readonly logger = new Logger(LedgerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Valida la regla de oro de la partida doble:
   * La suma total de los importes al Débito DEBE ser exactamente igual a la suma total de los importes al Crédito.
   */
  validateDoubleEntryBalance(postings: LedgerPosting[]): void {
    if (!postings || postings.length < 2) {
      throw new BadRequestException('Un asiento contable de partida doble requiere al menos dos cuentas (débito y crédito).');
    }

    let totalDebit = 0n;
    let totalCredit = 0n;

    for (const p of postings) {
      if (p.amountCents <= 0n) {
        throw new BadRequestException(`El importe del asiento debe ser estrictamente positivo. Recibido: ${p.amountCents}`);
      }

      if (p.entryType === EntryType.DEBIT) {
        totalDebit += p.amountCents;
      } else if (p.entryType === EntryType.CREDIT) {
        totalCredit += p.amountCents;
      }
    }

    if (totalDebit !== totalCredit) {
      throw new BadRequestException(
        `Descuadre contable detectado: Total Débitos (${totalDebit}) != Total Créditos (${totalCredit}). Asiento rechazado por integridad financiera.`,
      );
    }
  }

  /**
   * Ejecuta el registro atómico de una transacción y sus asientos de diario dentro de una transacción Prisma activa.
   */
  async recordJournalEntries(
    tx: Prisma.TransactionClient,
    params: CreateLedgerTransactionParams,
  ) {
    this.validateDoubleEntryBalance(params.postings);

    // 1. Generar código de referencia único TX-YYYYMMDD-XXXXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const referenceCode = `TX-${dateStr}-${randomHex}`;

    // 2. Crear cabecera de la transacción
    const transaction = await tx.transaction.create({
      data: {
        referenceCode,
        type: params.type,
        status: TransactionStatus.COMPLETED,
        amountCents: params.amountCents,
        currency: params.currency,
        description: params.description,
        idempotencyKey: params.idempotencyKey,
        createdBy: params.createdBy,
      },
    });

    // 3. Crear los asientos contables inmutables para cada cuenta involucrada
    for (const posting of params.postings) {
      const account = await tx.account.findUnique({
        where: { id: posting.accountId },
        select: { id: true, balanceCents: true },
      });

      if (!account) {
        throw new BadRequestException(`Cuenta bancaria no encontrada: ${posting.accountId}`);
      }

      await tx.journalEntry.create({
        data: {
          transactionId: transaction.id,
          accountId: posting.accountId,
          entryType: posting.entryType,
          amountCents: posting.amountCents,
          balanceAfterCents: account.balanceCents,
        },
      });
    }

    return transaction;
  }

  /**
   * Obtiene el extracto de cuenta con todos sus asientos contables cronológicos
   */
  async getAccountStatement(accountId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [total, entries] = await Promise.all([
      this.prisma.journalEntry.count({ where: { accountId } }),
      this.prisma.journalEntry.findMany({
        where: { accountId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          transaction: true,
        },
      }),
    ]);

    return {
      data: entries,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
