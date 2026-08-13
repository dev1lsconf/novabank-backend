import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { RedisService } from '../../infra/redis/redis.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Monitoreo y Salud del Sistema')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Verificar estado de salud del sistema bancario (Liveness / Readiness probe)',
    description: 'Comprueba la conectividad con la base de datos PostgreSQL, servidor Redis y métricas de memoria.',
  })
  @ApiResponse({ status: 200, description: 'Estado general del sistema' })
  async check() {
    let dbStatus = 'down';
    let dbLatencyMs = 0;
    try {
      const start = Date.now();
      await this.prisma.$queryRawUnsafe('SELECT 1');
      dbLatencyMs = Date.now() - start;
      dbStatus = 'up';
    } catch {
      dbStatus = 'down';
    }

    const redisConnected = await this.redis.ping();
    const memoryUsage = process.memoryUsage();

    return {
      status: dbStatus === 'up' ? 'healthy' : 'degraded',
      service: 'NovaBank Core Banking Engine',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      components: {
        database: {
          status: dbStatus,
          engine: 'PostgreSQL 16',
          latencyMs: dbLatencyMs,
        },
        redis: {
          status: redisConnected ? 'up' : 'fallback-memory',
          engine: 'Redis 7 / Memory-Fallback',
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
