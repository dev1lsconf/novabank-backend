import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JsonDbService } from '../../infra/database/json-db.service';
import { LedgerService } from '../ledger/ledger.service';
import { AuditService } from '../audit/audit.service';
import { DepositDto, WithdrawDto } from './dto/deposit.dto';
import { MoneyUtil } from '../../common/utils/money.util';
import { TransactionType } from '../../common/enums/transaction-type.enum';
import { EntryType } from '../../common/enums/entry-type.enum';
import { AccountStatus, AccountType } from '../../common/enums/account-type.enum';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class OperationsService {
  private readonly logger = new Logger(OperationsService.name);

  constructor(
    private readonly db: JsonDbService,
    private readonly ledgerService: LedgerService,
    private readonly auditService: AuditService,
  ) {}

  private async getOrCreateVaultAccount() {
    let vault = this.db.accounts.find((a) => a.accountType === AccountType.INTERNAL_BANK);

    if (!vault) {
      const admin = this.db.users.find((u) => u.role === Role.ADMIN) || this.db.users[0];
      vault = await this.db.createAccount({
        userId: admin.id,
        accountNumber: 'ES9121000418450200051332',
        accountType: AccountType.INTERNAL_BANK,
        currency: 'EUR',
        balanceCents: 100000000000,
        lockedBalanceCents: 0,
        status: AccountStatus.ACTIVE,
      });
    }

    return vault;
  }

  async deposit(dto: DepositDto, cashierId: string) {
    const amountCents = Number(MoneyUtil.decimalToCents(dto.amount));

    const account = await this.db.findAccountById(dto.accountId);
    if (!account) {
      throw new NotFoundException('La cuenta de destino no existe.');
    }
    if (account.status !== AccountStatus.ACTIVE) {
      throw new UnprocessableEntityException('La cuenta de destino no está activa.');
    }

    const vault = await this.getOrCreateVaultAccount();

    // Incrementar saldo de la cuenta del cliente
    account.balanceCents += amountCents;
    account.updatedAt = new Date().toISOString();

    // Registrar Asiento en Libro Mayor (Partida Doble)
    const txRecord = await this.ledgerService.recordJournalEntries({
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

    await this.auditService.log({
      userId: cashierId,
      action: 'CASH_DEPOSIT_COMPLETED',
      resource: 'Account',
      resourceId: dto.accountId,
      metadata: { amount: dto.amount },
    });

    return {
      referenceCode: txRecord.referenceCode,
      status: 'COMPLETED',
      amount: dto.amount,
      currency: account.currency,
      account: {
        id: account.id,
        accountNumber: account.accountNumber,
        newBalance: MoneyUtil.centsToDecimal(account.balanceCents),
      },
    };
  }

  async withdraw(dto: WithdrawDto, currentUserId: string, currentUserRole: string) {
    const amountCents = Number(MoneyUtil.decimalToCents(dto.amount));

    const account = await this.db.findAccountById(dto.accountId);
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

    if (account.balanceCents < amountCents) {
      throw new UnprocessableEntityException(
        `Saldo insuficiente para realizar el retiro. Disponible: ${MoneyUtil.formatCurrency(account.balanceCents)}.`,
      );
    }

    const vault = await this.getOrCreateVaultAccount();

    // Decrementar saldo
    account.balanceCents -= amountCents;
    account.updatedAt = new Date().toISOString();

    // Asiento Libro Mayor: Débito (Cuenta Cliente) y Crédito (Bóveda / Efectivo)
    const txRecord = await this.ledgerService.recordJournalEntries({
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

    await this.auditService.log({
      userId: currentUserId,
      action: 'CASH_WITHDRAWAL_COMPLETED',
      resource: 'Account',
      resourceId: dto.accountId,
      metadata: { amount: dto.amount },
    });

    return {
      referenceCode: txRecord.referenceCode,
      status: 'COMPLETED',
      amount: dto.amount,
      currency: account.currency,
      account: {
        id: account.id,
        accountNumber: account.accountNumber,
        newBalance: MoneyUtil.centsToDecimal(account.balanceCents),
      },
    };
  }
}
