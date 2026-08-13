import { Controller, Post, Body, UseGuards, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { TransfersService } from './transfers.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Transferencias Bancarias')
@ApiBearerAuth('JWT-Auth')
@UseGuards(JwtAuthGuard)
@Controller('transfers')
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Post()
  @ApiOperation({
    summary: 'Ejecutar transferencia bancaria atómica (Protegida contra condiciones de carrera)',
    description:
      'Transfiere fondos entre cuentas bancarias utilizando transacciones ACID con bloqueo a nivel de fila y protección de idempotencia.',
  })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: false,
    description: 'Clave única UUID para asegurar que no se dupliquen transferencias en reintentos de red.',
    example: 'd9b2d63d-a233-4f25-9b2f-871c5a92a101',
  })
  @ApiResponse({ status: 201, description: 'Transferencia procesada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos de la petición inválidos' })
  @ApiResponse({ status: 409, description: 'Conflicto: Petición idéntica en vuelo con la misma Idempotency-Key' })
  @ApiResponse({ status: 422, description: 'Saldo insuficiente o cuenta de origen inactiva' })
  async transfer(
    @Body() dto: CreateTransferDto,
    @CurrentUser('id') currentUserId: string,
    @CurrentUser('role') currentUserRole: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.transfersService.transfer(dto, currentUserId, currentUserRole, idempotencyKey);
  }
}
