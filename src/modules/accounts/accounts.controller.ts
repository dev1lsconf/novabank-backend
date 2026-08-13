import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { CreateAccountDto, ChangeAccountStatusDto } from './dto/create-account.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Cuentas Bancarias')
@ApiBearerAuth('JWT-Auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  @ApiOperation({
    summary: 'Abrir una nueva cuenta bancaria',
    description: 'Genera una cuenta con su código IBAN oficial según el estándar ISO 7064.',
  })
  @ApiResponse({ status: 201, description: 'Cuenta bancaria creada exitosamente' })
  async create(
    @Body() dto: CreateAccountDto,
    @CurrentUser('id') currentUserId: string,
    @CurrentUser('role') currentUserRole: string,
  ) {
    return this.accountsService.create(dto, currentUserId, currentUserRole);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar cuentas bancarias del usuario',
    description: 'Devuelve todas las cuentas asociadas al usuario autenticado (o todas para Administradores y Auditores).',
  })
  async findAll(
    @CurrentUser('id') currentUserId: string,
    @CurrentUser('role') currentUserRole: string,
  ) {
    return this.accountsService.findAllForUser(currentUserId, currentUserRole);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Consultar detalle y saldo de una cuenta bancaria',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') currentUserId: string,
    @CurrentUser('role') currentUserRole: string,
  ) {
    return this.accountsService.findOne(id, currentUserId, currentUserRole);
  }

  @Get(':id/statement')
  @ApiOperation({
    summary: 'Obtener extracto bancario con asientos contables cronológicos',
    description: 'Retorna el historial completo de movimientos Débito / Crédito con snapshot de saldo tras cada operación.',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  async getStatement(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') currentUserId: string,
    @CurrentUser('role') currentUserRole: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.accountsService.getStatement(id, currentUserId, currentUserRole, +page, +limit);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.GERENTE)
  @ApiOperation({
    summary: 'Congelar, activar o cerrar cuenta bancaria (Admin/Gerente)',
  })
  async changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeAccountStatusDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    return this.accountsService.changeStatus(id, dto, currentUserId);
  }
}
