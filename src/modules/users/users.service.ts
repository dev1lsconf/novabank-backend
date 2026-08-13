import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UpdateUserDto, ChangeUserStatusDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [total, users] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          nationalId: true,
          role: true,
          status: true,
          createdAt: true,
          _count: {
            select: { accounts: true },
          },
        },
      }),
    ]);

    return {
      data: users,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        nationalId: true,
        role: true,
        status: true,
        createdAt: true,
        accounts: {
          select: {
            id: true,
            accountNumber: true,
            accountType: true,
            currency: true,
            balanceCents: true,
            status: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    return user;
  }

  async update(id: string, dto: UpdateUserDto, currentUserId: string) {
    await this.findOne(id);

    const updated = await this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        nationalId: true,
        role: true,
        status: true,
      },
    });

    await this.auditService.log({
      userId: currentUserId,
      action: 'USER_PROFILE_UPDATED',
      resource: 'User',
      resourceId: id,
      metadata: dto,
    });

    return updated;
  }

  async changeStatus(id: string, dto: ChangeUserStatusDto, currentUserId: string) {
    await this.findOne(id);

    const updated = await this.prisma.user.update({
      where: { id },
      data: { status: dto.status },
      select: {
        id: true,
        email: true,
        status: true,
      },
    });

    await this.auditService.log({
      userId: currentUserId,
      action: `USER_STATUS_CHANGED_${dto.status}`,
      resource: 'User',
      resourceId: id,
      metadata: { newStatus: dto.status },
    });

    return updated;
  }
}
