import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private isConnected = false;
  private memoryFallback = new Map<string, { value: string; expiresAt?: number }>();

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const redisUrl = this.configService.get<string>('redis.url');
    const isProduction = process.env.NODE_ENV === 'production';

    // En producción / serverless, solo intentar conectar si hay una URL remota configurada (ej. Upstash / Redis Cloud)
    const isRemoteRedis = redisUrl && !redisUrl.includes('localhost') && !redisUrl.includes('127.0.0.1');

    if (!isRemoteRedis && isProduction) {
      this.logger.log('ℹ️ Entorno Serverless sin Redis remoto configurado: Utilizando caché en memoria de alta velocidad.');
      return;
    }

    if (!redisUrl && !isProduction) {
      this.logger.log('ℹ️ No se especificó REDIS_URL: Utilizando caché en memoria.');
      return;
    }

    try {
      this.client = new Redis(redisUrl || 'redis://localhost:6379', {
        maxRetriesPerRequest: 1,
        connectTimeout: 2000,
        retryStrategy: () => null, // No reintentar en bucle para no bloquear serverless
        enableReadyCheck: false,
        lazyConnect: true,
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.logger.log(' Conectado exitosamente a Redis.');
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
        this.logger.debug(`Redis offline: ${err.message}`);
      });

      await this.client.connect().catch((err) => {
        this.logger.warn(`⚠️ Redis no disponible (${err.message}). Modo caché en memoria activo.`);
        this.client = null;
      });
    } catch {
      this.client = null;
    }
  }

  async onModuleDestroy() {
    if (this.client && this.isConnected) {
      try {
        await this.client.quit();
      } catch {
        // Ignorar en shutdown
      }
    }
  }

  async ping(): Promise<boolean> {
    if (this.client && this.isConnected) {
      try {
        const res = await this.client.ping();
        return res === 'PONG';
      } catch {
        return false;
      }
    }
    return true; // En modo memoria responde OK
  }

  async get(key: string): Promise<string | null> {
    if (this.client && this.isConnected) {
      try {
        return await this.client.get(key);
      } catch {
        // Fallback a memoria si falla Redis
      }
    }

    const item = this.memoryFallback.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.memoryFallback.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.client && this.isConnected) {
      try {
        if (ttlSeconds) {
          await this.client.set(key, value, 'EX', ttlSeconds);
        } else {
          await this.client.set(key, value);
        }
        return;
      } catch {
        // Fallback a memoria
      }
    }

    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.memoryFallback.set(key, { value, expiresAt });
  }

  async setnx(key: string, value: string, ttlSeconds: number): Promise<boolean> {
    if (this.client && this.isConnected) {
      try {
        const result = await this.client.set(key, value, 'EX', ttlSeconds, 'NX');
        return result === 'OK';
      } catch {
        // Fallback a memoria
      }
    }

    const existing = this.memoryFallback.get(key);
    if (existing && (!existing.expiresAt || Date.now() < existing.expiresAt)) {
      return false;
    }
    this.memoryFallback.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
    return true;
  }

  async del(key: string): Promise<void> {
    if (this.client && this.isConnected) {
      try {
        await this.client.del(key);
        return;
      } catch {
        // Fallback a memoria
      }
    }

    this.memoryFallback.delete(key);
  }
}
