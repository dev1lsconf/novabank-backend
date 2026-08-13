import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OperationsService } from './operations.service';
import { DepositDto, WithdrawDto } from './dto/deposit.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Operaciones en Ventanilla y Cajero')
@ApiBearerAuth('JWT-Auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('operations')
export class OperationsController {
  constructor(private readonly operationsService: OperationsService) {}

  @Post('deposit')
  @Roles(Role.CAJERO, Role.ADMIN)
  @ApiOperation({
    summary: 'Ingresar efectivo en cuenta (Rol Cajero / Admin)',
    description: 'Registra un ingreso en efectivo generando automáticamente los asientos contables en el Libro Mayor.',
  })
  @ApiResponse({ status: 201, description: 'Depósito registrado exitosamente' })
  @ApiResponse({ status: 403, description: 'Acceso denegado (Requiere rol CAJERO o ADMIN)' })
  async deposit(@Body() dto: DepositDto, @CurrentUser('id') cashierId: string) {
    return this.operationsService.deposit(dto, cashierId);
  }

  @Post('withdraw')
  @ApiOperation({
    summary: 'Retirar efectivo de cuenta',
    description: 'Procesa un retiro de efectivo con verificación atómica de saldo y bloqueo pesimista.',
  })
  @ApiResponse({ status: 201, description: 'Retiro procesado exitosamente' })
  @ApiResponse({ status: 422, description: 'Saldo insuficiente en la cuenta' })
  async withdraw(
    @Body() dto: WithdrawDto,
    @CurrentUser('id') currentUserId: string,
    @CurrentUser('role') currentUserRole: string,
  ) {
    return this.operationsService.withdraw(dto, currentUserId, currentUserRole);
  }
}
