import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { JsonDbService } from '../../infra/database/json-db.service';
import { AuditService } from '../audit/audit.service';
import { LedgerService } from '../ledger/ledger.service';
import { CreateAccountDto, ChangeAccountStatusDto } from './dto/create-account.dto';
import { IbanUtil } from '../../common/utils/iban.util';
import { Role } from '../../common/enums/role.enum';
import { AccountStatus } from '../../common/enums/account-type.enum';

@Injectable()
export class AccountsService {
  constructor(
    private readonly db: JsonDbService,
    private readonly auditService: AuditService,
    private readonly ledgerService: LedgerService,
  ) {}

  async create(dto: CreateAccountDto, currentUserId: string, currentUserRole: string) {
    const targetUserId = dto.userId && currentUserRole === Role.ADMIN ? dto.userId : currentUserId;

    // Generar IBAN bancario único y válido
    let iban = IbanUtil.generateSpanishIban();
    let exists = await this.db.findAccountByNumber(iban);
    while (exists) {
      iban = IbanUtil.generateSpanishIban();
      exists = await this.db.findAccountByNumber(iban);
    }

    const account = await this.db.createAccount({
      userId: targetUserId,
      accountNumber: iban,
      accountType: dto.accountType,
      currency: dto.currency || 'EUR',
      balanceCents: 0,
      lockedBalanceCents: 0,
      status: AccountStatus.ACTIVE,
    });

    await this.auditService.log({
      userId: currentUserId,
      action: 'ACCOUNT_OPENED',
      resource: 'Account',
      resourceId: account.id,
      metadata: { accountNumber: account.accountNumber, type: account.accountType },
    });

    return account;
  }

  async findAllForUser(userId: string, currentRole: string) {
    const accounts =
      currentRole === Role.ADMIN || currentRole === Role.AUDITOR
        ? await this.db.findAllAccounts()
        : await this.db.findAccountsByUserId(userId);

    return accounts.map((a) => {
      const user = this.db.users.find((u) => u.id === a.userId);
      const cards = this.db.cards
        .filter((c) => c.accountId === a.id)
        .map((c) => ({
          id: c.id,
          maskedPan: c.maskedPan,
          cardType: c.cardType,
          status: c.status,
        }));

      return {
        ...a,
        user: user
          ? {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
            }
          : null,
        cards,
      };
    });
  }

  async findOne(id: string, currentUserId: string, currentRole: string) {
    const account = await this.db.findAccountById(id);

    if (!account) {
      throw new NotFoundException('Cuenta bancaria no encontrada.');
    }

    if (
      currentRole !== Role.ADMIN &&
      currentRole !== Role.AUDITOR &&
      currentRole !== Role.GERENTE &&
      currentRole !== Role.CAJERO &&
      account.userId !== currentUserId
    ) {
      throw new ForbiddenException('No tiene permisos para consultar esta cuenta bancaria.');
    }

    const user = this.db.users.find((u) => u.id === account.userId);
    const cards = await this.db.findCardsByAccountId(account.id);

    return {
      ...account,
      user: user
        ? { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName }
        : null,
      cards,
    };
  }

  async getStatement(id: string, currentUserId: string, currentRole: string, page = 1, limit = 50) {
    await this.findOne(id, currentUserId, currentRole);
    return this.ledgerService.getAccountStatement(id, page, limit);
  }

  async changeStatus(id: string, dto: ChangeAccountStatusDto, currentUserId: string) {
    const account = await this.db.findAccountById(id);
    if (!account) {
      throw new NotFoundException('Cuenta bancaria no encontrada.');
    }

    const updated = await this.db.updateAccount(id, { status: dto.status });

    await this.auditService.log({
      userId: currentUserId,
      action: `ACCOUNT_STATUS_CHANGED_${dto.status}`,
      resource: 'Account',
      resourceId: id,
      metadata: { previousStatus: account.status, newStatus: dto.status },
    });

    return updated;
  }
}
