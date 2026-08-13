import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CardsService } from './cards.service';
import { CreateCardDto, UpdateCardLimitDto } from './dto/create-card.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Tarjetas Bancarias')
@ApiBearerAuth('JWT-Auth')
@UseGuards(JwtAuthGuard)
@Controller('cards')
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Post()
  @ApiOperation({
    summary: 'Emitir nueva tarjeta de débito o crédito',
    description: 'Genera un número de tarjeta con PAN enmascarado y hash criptográfico seguro.',
  })
  @ApiResponse({ status: 201, description: 'Tarjeta emitida exitosamente' })
  async create(
    @Body() dto: CreateCardDto,
    @CurrentUser('id') currentUserId: string,
    @CurrentUser('role') currentUserRole: string,
  ) {
    return this.cardsService.create(dto, currentUserId, currentUserRole);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar tarjetas bancarias del usuario',
  })
  async findAll(
    @CurrentUser('id') currentUserId: string,
    @CurrentUser('role') currentUserRole: string,
  ) {
    return this.cardsService.findAllForUser(currentUserId, currentUserRole);
  }

  @Patch(':id/toggle-freeze')
  @ApiOperation({
    summary: 'Bloquear / Desbloquear preventivamente una tarjeta',
    description: 'Permite al cliente congelar al instante su tarjeta en caso de extravío.',
  })
  async toggleFreeze(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') currentUserId: string,
    @CurrentUser('role') currentUserRole: string,
  ) {
    return this.cardsService.toggleFreeze(id, currentUserId, currentUserRole);
  }

  @Patch(':id/limit')
  @ApiOperation({
    summary: 'Actualizar límite de gasto diario de la tarjeta',
  })
  async updateLimit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCardLimitDto,
    @CurrentUser('id') currentUserId: string,
    @CurrentUser('role') currentUserRole: string,
  ) {
    return this.cardsService.updateLimit(id, dto, currentUserId, currentUserRole);
  }
}
