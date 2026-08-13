import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { LedgerService } from '../ledger/ledger.service';
import { CreateAccountDto, ChangeAccountStatusDto } from './dto/create-account.dto';
import { IbanUtil } from '../../common/utils/iban.util';
import { AccountStatus, Role } from '@prisma/client';

@Injectable()
export class AccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly ledgerService: LedgerService,
  ) {}

  async create(dto: CreateAccountDto, currentUserId: string, currentUserRole: string) {
    const targetUserId = dto.userId && currentUserRole === Role.ADMIN ? dto.userId : currentUserId;

    // Generar IBAN bancario único y válido
    let iban = IbanUtil.generateSpanishIban();
    let exists = await this.prisma.account.findUnique({ where: { accountNumber: iban } });
    while (exists) {
      iban = IbanUtil.generateSpanishIban();
      exists = await this.prisma.account.findUnique({ where: { accountNumber: iban } });
    }

    const account = await this.prisma.account.create({
      data: {
        userId: targetUserId,
        accountNumber: iban,
        accountType: dto.accountType,
        currency: dto.currency || 'EUR',
        balanceCents: BigInt(0),
        lockedBalanceCents: BigInt(0),
        status: AccountStatus.ACTIVE,
      },
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
    const accounts = await this.prisma.account.findMany({
      where: currentRole === Role.ADMIN || currentRole === Role.AUDITOR ? {} : { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        cards: {
          select: {
            id: true,
            maskedPan: true,
            cardType: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return accounts;
  }

  async findOne(id: string, currentUserId: string, currentRole: string) {
    const account = await this.prisma.account.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        cards: true,
      },
    });

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

    return account;
  }

  async getStatement(id: string, currentUserId: string, currentRole: string, page = 1, limit = 50) {
    await this.findOne(id, currentUserId, currentRole);
    return this.ledgerService.getAccountStatement(id, page, limit);
  }

  async changeStatus(id: string, dto: ChangeAccountStatusDto, currentUserId: string) {
    const account = await this.prisma.account.findUnique({ where: { id } });
    if (!account) {
      throw new NotFoundException('Cuenta bancaria no encontrada.');
    }

    const updated = await this.prisma.account.update({
      where: { id },
      data: { status: dto.status },
    });

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
