import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JsonDbService } from '../../infra/database/json-db.service';
import { RedisService } from '../../infra/redis/redis.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Monitoreo y Salud del Sistema')
@Controller('health')
export class HealthController {
  constructor(
    private readonly db: JsonDbService,
    private readonly redis: RedisService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Verificar estado de salud del sistema bancario (Liveness / Readiness probe)',
    description: 'Comprueba la base de datos JSON autónoma, conectividad Redis y métricas de memoria.',
  })
  @ApiResponse({ status: 200, description: 'Estado general del sistema' })
  async check() {
    const redisConnected = await this.redis.ping();
    const memoryUsage = process.memoryUsage();

    return {
      status: 'healthy',
      service: 'NovaBank Core Banking Engine',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'production',
      components: {
        database: {
          status: 'up',
          engine: 'NovaBank Self-Contained JSON Store (Serverless Optimized)',
          records: {
            users: this.db.users.length,
            accounts: this.db.accounts.length,
            transactions: this.db.transactions.length,
            journalEntries: this.db.journalEntries.length,
            cards: this.db.cards.length,
            exchangeRates: this.db.exchangeRates.length,
          },
        },
        redis: {
          status: redisConnected ? 'up' : 'fallback-memory',
          engine: 'Redis 7 / In-Memory Resilient Fallback',
        },
        memory: {
          rssMb: Math.round(memoryUsage.rss / 1024 / 1024),
          heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          heapTotalMb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        },
      },
    };
  }
}
