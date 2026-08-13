import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ForexService } from './forex.service';
import { ConvertCurrencyDto } from './dto/convert-currency.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Mercado de Divisas (Forex)')
@Controller('forex')
export class ForexController {
  constructor(private readonly forexService: ForexService) {}

  @Public()
  @Get('rates')
  @ApiOperation({
    summary: 'Consultar tipos de cambio en tiempo real (Cacheados en Redis)',
    description: 'Retorna las cotizaciones de divisas oficiales (EUR, USD, GBP, MXN, COP).',
  })
  @ApiResponse({ status: 200, description: 'Tipos de cambio oficiales' })
  async getRates() {
    return this.forexService.getAllRates();
  }

  @Public()
  @Post('convert')
  @ApiOperation({
    summary: 'Calcular conversión entre divisas',
    description: 'Calcula el importe exacto resultante de aplicar el tipo de cambio oficial.',
  })
  @ApiResponse({ status: 200, description: 'Cálculo de conversión completado' })
  @ApiResponse({ status: 404, description: 'Par de divisas no disponible' })
  async convert(@Body() dto: ConvertCurrencyDto) {
    return this.forexService.convert(dto);
  }
}
