import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { JsonDbService } from '../../infra/database/json-db.service';
import { RedisService } from '../../infra/redis/redis.service';
import { ConvertCurrencyDto } from './dto/convert-currency.dto';

@Injectable()
export class ForexService {
  private readonly logger = new Logger(ForexService.name);
  private readonly CACHE_KEY = 'forex:rates:all';
  private readonly CACHE_TTL = 3600; // 1 hora

  constructor(
    private readonly db: JsonDbService,
    private readonly redis: RedisService,
  ) {}

  async getAllRates() {
    // 1. Intentar obtener desde la caché de Redis (Cache-Aside)
    const cached = await this.redis.get(this.CACHE_KEY);
    if (cached) {
      this.logger.log('⚡ Forex Cache HIT: Tipos de cambio servidos desde Redis');
      return JSON.parse(cached);
    }

    // 2. Cache MISS: Consultar base de datos JSON
    this.logger.log('🔄 Forex Cache MISS: Consultando base de datos JSON...');
    const rates = await this.db.findAllExchangeRates();

    const formatted = rates.map((r) => ({
      pair: `${r.baseCurrency}/${r.targetCurrency}`,
      baseCurrency: r.baseCurrency,
      targetCurrency: r.targetCurrency,
      rate: Number(r.rate),
      updatedAt: r.updatedAt,
    }));

    // 3. Guardar en Redis con TTL
    await this.redis.set(this.CACHE_KEY, JSON.stringify(formatted), this.CACHE_TTL);

    return formatted;
  }

  async convert(dto: ConvertCurrencyDto) {
    const from = dto.from.toUpperCase();
    const to = dto.to.toUpperCase();

    if (from === to) {
      return {
        from,
        to,
        amount: dto.amount,
        rate: 1,
        convertedAmount: dto.amount,
        timestamp: new Date().toISOString(),
      };
    }

    const rateRecord = await this.db.findExchangeRate(from, to);

    if (!rateRecord) {
      throw new NotFoundException(
        `No se dispone de cotización directa para el par de divisas ${from}/${to}.`,
      );
    }

    const rate = Number(rateRecord.rate);
    const convertedAmount = Math.round(dto.amount * rate * 100) / 100;

    return {
      from,
      to,
      amount: dto.amount,
      rate,
      convertedAmount,
      timestamp: new Date().toISOString(),
    };
  }
}
