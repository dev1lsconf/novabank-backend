import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { QueryAuditDto } from './dto/query-audit.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Auditoría y Cumplimiento')
@ApiBearerAuth('JWT-Auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  @Roles(Role.AUDITOR, Role.ADMIN, Role.GERENTE)
  @ApiOperation({
    summary: 'Consultar pista de auditoría bancaria (Audit Trail)',
    description: 'Permite a los auditores y administradores consultar eventos inmutables del sistema.',
  })
  @ApiResponse({ status: 200, description: 'Lista paginada de registros de auditoría' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado (Requiere rol AUDITOR, ADMIN o GERENTE)' })
  async getLogs(@Query() query: QueryAuditDto) {
    return this.auditService.findAll(query);
  }
}
