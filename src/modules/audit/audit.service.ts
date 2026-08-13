import { Injectable, Logger } from '@nestjs/common';
import { JsonDbService } from '../../infra/database/json-db.service';
import { QueryAuditDto } from './dto/query-audit.dto';

export interface CreateAuditLogParams {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly db: JsonDbService) {}

  async log(params: CreateAuditLogParams) {
    try {
      return await this.db.createAuditLog({
        userId: params.userId,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        metadata: params.metadata || {},
      });
    } catch (error) {
      this.logger.error(`Error guardando log de auditoría: ${(error as Error).message}`);
    }
  }

  async findAll(query: QueryAuditDto) {
    const { action, resource, userId, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const { data, total } = await this.db.findAuditLogs(
      { action, resource, userId },
      skip,
      limit,
    );

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
