import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { JsonDbService } from '../../infra/database/json-db.service';
import { EntryType } from '../../common/enums/entry-type.enum';
import { TransactionType } from '../../common/enums/transaction-type.enum';

export interface LedgerPosting {
  accountId: string;
  entryType: EntryType;
  amountCents: number;
}

export interface CreateLedgerTransactionParams {
  type: TransactionType;
  amountCents: number;
  currency: string;
  description: string;
  idempotencyKey?: string;
  createdBy?: string;
  postings: LedgerPosting[];
}

@Injectable()
export class LedgerService {
  private readonly logger = new Logger(LedgerService.name);

  constructor(private readonly db: JsonDbService) {}

  /**
   * Valida la regla de oro de la partida doble:
   * La suma total de los importes al Débito DEBE ser exactamente igual a la suma total de los importes al Crédito.
   */
  validateDoubleEntryBalance(postings: LedgerPosting[]): void {
    if (!postings || postings.length < 2) {
      throw new BadRequestException('Un asiento contable de partida doble requiere al menos dos cuentas (débito y crédito).');
    }

    let totalDebit = 0;
    let totalCredit = 0;

    for (const p of postings) {
      if (p.amountCents <= 0) {
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
   * Ejecuta el registro atómico de una transacción y sus asientos de diario.
   */
  async recordJournalEntries(params: CreateLedgerTransactionParams) {
    this.validateDoubleEntryBalance(params.postings);

    // 1. Generar código de referencia único TX-YYYYMMDD-XXXXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const referenceCode = `TX-${dateStr}-${randomHex}`;

    // 2. Crear cabecera de la transacción
    const transaction = await this.db.createTransaction({
      referenceCode,
      type: params.type,
      status: 'COMPLETED',
      amountCents: params.amountCents,
      currency: params.currency,
      description: params.description,
      idempotencyKey: params.idempotencyKey || null,
      createdBy: params.createdBy || null,
    });

    // 3. Crear los asientos contables inmutables para cada cuenta involucrada
    for (const posting of params.postings) {
      const account = await this.db.findAccountById(posting.accountId);

      if (!account) {
        throw new BadRequestException(`Cuenta bancaria no encontrada: ${posting.accountId}`);
      }

      await this.db.createJournalEntry({
        transactionId: transaction.id,
        accountId: posting.accountId,
        entryType: posting.entryType,
        amountCents: posting.amountCents,
        balanceAfterCents: account.balanceCents,
      });
    }

    return transaction;
  }

  /**
   * Obtiene el extracto de cuenta con todos sus asientos contables cronológicos
   */
  async getAccountStatement(accountId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const { data, total } = await this.db.findJournalEntriesByAccountId(accountId, skip, limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
