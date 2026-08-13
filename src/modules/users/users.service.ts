import { Injectable, NotFoundException } from '@nestjs/common';
import { JsonDbService } from '../../infra/database/json-db.service';
import { AuditService } from '../audit/audit.service';
import { UpdateUserDto, ChangeUserStatusDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly db: JsonDbService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const { data, total } = await this.db.findAllUsers(skip, limit);

    const formatted = data.map((u) => {
      const accountsCount = this.db.accounts.filter((a) => a.userId === u.id).length;
      return {
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        nationalId: u.nationalId,
        role: u.role,
        status: u.status,
        createdAt: u.createdAt,
        _count: { accounts: accountsCount },
      };
    });

    return {
      data: formatted,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const user = await this.db.findUserById(id);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    const accounts = await this.db.findAccountsByUserId(id);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      nationalId: user.nationalId,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      accounts: accounts.map((a) => ({
        id: a.id,
        accountNumber: a.accountNumber,
        accountType: a.accountType,
        currency: a.currency,
        balanceCents: a.balanceCents,
        status: a.status,
      })),
    };
  }

  async update(id: string, dto: UpdateUserDto, currentUserId: string) {
    await this.findOne(id);

    const updated = await this.db.updateUser(id, dto);

    await this.auditService.log({
      userId: currentUserId,
      action: 'USER_PROFILE_UPDATED',
      resource: 'User',
      resourceId: id,
      metadata: dto,
    });

    return {
      id: updated!.id,
      email: updated!.email,
      firstName: updated!.firstName,
      lastName: updated!.lastName,
      nationalId: updated!.nationalId,
      role: updated!.role,
      status: updated!.status,
    };
  }

  async changeStatus(id: string, dto: ChangeUserStatusDto, currentUserId: string) {
    await this.findOne(id);

    const updated = await this.db.updateUser(id, { status: dto.status });

    await this.auditService.log({
      userId: currentUserId,
      action: `USER_STATUS_CHANGED_${dto.status}`,
      resource: 'User',
      resourceId: id,
      metadata: { newStatus: dto.status },
    });

    return {
      id: updated!.id,
      email: updated!.email,
      status: updated!.status,
    };
  }
}
