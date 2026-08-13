import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';
import { AuditService } from '../audit/audit.service';
import { DepositDto, WithdrawDto } from './dto/deposit.dto';
import { MoneyUtil } from '../../common/utils/money.util';
import { AccountStatus, AccountType, EntryType, Role, TransactionType } from '@prisma/client';

@Injectable()
export class OperationsService {
  private readonly logger = new Logger(OperationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerService: LedgerService,
    private readonly auditService: AuditService,
  ) {}

  private async getOrCreateVaultAccount(tx: any) {
    let vault = await tx.account.findFirst({
      where: { accountType: AccountType.INTERNAL_BANK },
    });

    if (!vault) {
      const admin = await tx.user.findFirst({ where: { role: Role.ADMIN } });
      vault = await tx.account.create({
        data: {
          userId: admin?.id || (await tx.user.findFirstOrThrow()).id,
          accountNumber: 'ES9121000418450200051332',
          accountType: AccountType.INTERNAL_BANK,
          currency: 'EUR',
          balanceCents: BigInt(100000000000),
        },
      });
    }

    return vault;
  }

  async deposit(dto: DepositDto, cashierId: string) {
    const amountCents = MoneyUtil.decimalToCents(dto.amount);

    const result = await this.prisma.$transaction(async (tx) => {
      const account = await tx.account.findUnique({ where: { id: dto.accountId } });
      if (!account) {
        throw new NotFoundException('La cuenta de destino no existe.');
      }
      if (account.status !== AccountStatus.ACTIVE) {
        throw new UnprocessableEntityException('La cuenta de destino no está activa.');
      }

      const vault = await this.getOrCreateVaultAccount(tx);

      // Incrementar saldo de la cuenta del cliente
      const updatedAccount = await tx.account.update({
        where: { id: account.id },
        data: { balanceCents: { increment: amountCents } },
      });

      // Registrar Asiento en Libro Mayor (Partida Doble)
      const txRecord = await this.ledgerService.recordJournalEntries(tx, {
        type: TransactionType.DEPOSIT,
        amountCents,
        currency: account.currency,
        description: dto.description || 'Depósito en efectivo',
        createdBy: cashierId,
        postings: [
          { accountId: vault.id, entryType: EntryType.DEBIT, amountCents },
          { accountId: account.id, entryType: EntryType.CREDIT, amountCents },
        ],
      });

      return {
        referenceCode: txRecord.referenceCode,
        status: 'COMPLETED',
        amount: dto.amount,
        currency: account.currency,
        account: {
          id: updatedAccount.id,
          accountNumber: updatedAccount.accountNumber,
          newBalance: MoneyUtil.centsToDecimal(updatedAccount.balanceCents),
        },
      };
    });

    await this.auditService.log({
      userId: cashierId,
      action: 'CASH_DEPOSIT_COMPLETED',
      resource: 'Account',
      resourceId: dto.accountId,
      metadata: { amount: dto.amount },
    });

    return result;
  }

  async withdraw(dto: WithdrawDto, currentUserId: string, currentUserRole: string) {
    const amountCents = MoneyUtil.decimalToCents(dto.amount);

    const result = await this.prisma.$transaction(async (tx) => {
      const account = await tx.account.findUnique({ where: { id: dto.accountId } });
      if (!account) {
        throw new NotFoundException('La cuenta bancaria no existe.');
      }

      if (
        currentUserRole !== Role.ADMIN &&
        currentUserRole !== Role.CAJERO &&
        account.userId !== currentUserId
      ) {
        throw new ForbiddenException('No tiene autorización para retirar fondos de esta cuenta.');
      }

      if (account.status !== AccountStatus.ACTIVE) {
        throw new UnprocessableEntityException('La cuenta no está activa.');
      }

      // Bloqueo Pesimista FOR UPDATE
      await tx.$queryRawUnsafe(`SELECT id, balance_cents FROM accounts WHERE id = $1 FOR UPDATE`, account.id);

      const lockedAccount = await tx.account.findUniqueOrThrow({ where: { id: account.id } });
      if (lockedAccount.balanceCents < amountCents) {
        throw new UnprocessableEntityException(
          `Saldo insuficiente para realizar el retiro. Disponible: ${MoneyUtil.formatCurrency(lockedAccount.balanceCents)}.`,
        );
      }

      const vault = await this.getOrCreateVaultAccount(tx);

      // Decrementar saldo
      const updatedAccount = await tx.account.update({
        where: { id: account.id },
        data: { balanceCents: { decrement: amountCents } },
      });

      // Asiento Libro Mayor: Débito (Cuenta Cliente) y Crédito (Bóveda / Efectivo)
      const txRecord = await this.ledgerService.recordJournalEntries(tx, {
        type: TransactionType.WITHDRAWAL,
        amountCents,
        currency: account.currency,
        description: dto.description || 'Retiro de efectivo',
        createdBy: currentUserId,
        postings: [
          { accountId: account.id, entryType: EntryType.DEBIT, amountCents },
          { accountId: vault.id, entryType: EntryType.CREDIT, amountCents },
        ],
      });

      return {
        referenceCode: txRecord.referenceCode,
        status: 'COMPLETED',
        amount: dto.amount,
        currency: account.currency,
        account: {
          id: updatedAccount.id,
          accountNumber: updatedAccount.accountNumber,
          newBalance: MoneyUtil.centsToDecimal(updatedAccount.balanceCents),
        },
      };
    });

    await this.auditService.log({
      userId: currentUserId,
      action: 'CASH_WITHDRAWAL_COMPLETED',
      resource: 'Account',
      resourceId: dto.accountId,
      metadata: { amount: dto.amount },
    });

    return result;
  }
}
