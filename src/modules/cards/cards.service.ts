import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { JsonDbService } from '../../infra/database/json-db.service';
import { AuditService } from '../audit/audit.service';
import { CreateCardDto, UpdateCardLimitDto } from './dto/create-card.dto';
import { Role } from '../../common/enums/role.enum';
import { CardStatus } from '../../common/enums/entry-type.enum';

@Injectable()
export class CardsService {
  constructor(
    private readonly db: JsonDbService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateCardDto, currentUserId: string, currentUserRole: string) {
    const account = await this.db.findAccountById(dto.accountId);

    if (!account) {
      throw new NotFoundException('La cuenta bancaria no existe.');
    }

    if (currentUserRole !== Role.ADMIN && account.userId !== currentUserId) {
      throw new ForbiddenException('No tiene permisos para emitir tarjetas sobre esta cuenta.');
    }

    // Generar PAN de 16 dígitos (Prefijo Visa: 4532)
    const random12 = Math.floor(100000000000 + Math.random() * 900000000000).toString();
    const pan = `4532${random12}`;
    const maskedPan = `4532 **** **** ${pan.slice(-4)}`;
    const panHash = await bcrypt.hash(pan, 8);

    // Fecha de caducidad a 4 años
    const expirationDate = new Date();
    expirationDate.setFullYear(expirationDate.getFullYear() + 4);

    const limitCents = (dto.dailyLimitEur || 1000) * 100;

    const card = await this.db.createCard({
      accountId: account.id,
      maskedPan,
      panHash,
      cardType: dto.cardType,
      expirationDate: expirationDate.toISOString(),
      status: CardStatus.ACTIVE,
      dailyLimitCents: limitCents,
    });

    await this.auditService.log({
      userId: currentUserId,
      action: 'CARD_ISSUED',
      resource: 'Card',
      resourceId: card.id,
      metadata: { accountId: account.id, cardType: card.cardType, maskedPan },
    });

    return {
      id: card.id,
      accountId: card.accountId,
      maskedPan: card.maskedPan,
      cardType: card.cardType,
      expirationDate: card.expirationDate,
      status: card.status,
      dailyLimitEur: card.dailyLimitCents / 100,
      createdAt: card.createdAt,
    };
  }

  async findAllForUser(userId: string, currentUserRole: string) {
    const userAccounts = await this.db.findAccountsByUserId(userId);
    const userAccountIds = new Set(userAccounts.map((a) => a.id));

    const cards =
      currentUserRole === Role.ADMIN || currentUserRole === Role.AUDITOR
        ? await this.db.findAllCards()
        : this.db.cards.filter((c) => userAccountIds.has(c.accountId));

    return cards.map((c) => {
      const account = this.db.accounts.find((a) => a.id === c.accountId);
      return {
        id: c.id,
        accountId: c.accountId,
        accountNumber: account?.accountNumber || 'Desconocido',
        maskedPan: c.maskedPan,
        cardType: c.cardType,
        expirationDate: c.expirationDate,
        status: c.status,
        dailyLimitEur: c.dailyLimitCents / 100,
        createdAt: c.createdAt,
      };
    });
  }

  async toggleFreeze(id: string, currentUserId: string, currentUserRole: string) {
    const card = await this.db.findCardById(id);

    if (!card) {
      throw new NotFoundException('Tarjeta no encontrada.');
    }

    const account = await this.db.findAccountById(card.accountId);

    if (
      currentUserRole !== Role.ADMIN &&
      currentUserRole !== Role.GERENTE &&
      account?.userId !== currentUserId
    ) {
      throw new ForbiddenException('No tiene permisos para modificar el estado de esta tarjeta.');
    }

    if (card.status === CardStatus.EXPIRED) {
      throw new UnprocessableEntityException('No se puede reactivar una tarjeta caducada.');
    }

    const newStatus = card.status === CardStatus.ACTIVE ? CardStatus.BLOCKED : CardStatus.ACTIVE;

    const updated = await this.db.updateCard(id, { status: newStatus });

    await this.auditService.log({
      userId: currentUserId,
      action: `CARD_${newStatus === CardStatus.BLOCKED ? 'FROZEN' : 'UNFROZEN'}`,
      resource: 'Card',
      resourceId: card.id,
      metadata: { previousStatus: card.status, newStatus },
    });

    return {
      id: updated!.id,
      maskedPan: updated!.maskedPan,
      status: updated!.status,
      message:
        newStatus === CardStatus.BLOCKED
          ? 'Tarjeta bloqueada preventivamente con éxito.'
          : 'Tarjeta desbloqueada y lista para operar.',
    };
  }

  async updateLimit(id: string, dto: UpdateCardLimitDto, currentUserId: string, currentUserRole: string) {
    const card = await this.db.findCardById(id);

    if (!card) {
      throw new NotFoundException('Tarjeta no encontrada.');
    }

    const account = await this.db.findAccountById(card.accountId);

    if (
      currentUserRole !== Role.ADMIN &&
      currentUserRole !== Role.GERENTE &&
      account?.userId !== currentUserId
    ) {
      throw new ForbiddenException('No tiene permisos para modificar límites de esta tarjeta.');
    }

    const updated = await this.db.updateCard(id, { dailyLimitCents: dto.dailyLimitEur * 100 });

    await this.auditService.log({
      userId: currentUserId,
      action: 'CARD_LIMIT_UPDATED',
      resource: 'Card',
      resourceId: card.id,
      metadata: { newLimitEur: dto.dailyLimitEur },
    });

    return {
      id: updated!.id,
      maskedPan: updated!.maskedPan,
      dailyLimitEur: updated!.dailyLimitCents / 100,
    };
  }
}
