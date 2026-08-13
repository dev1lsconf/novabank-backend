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
    try {
      this.client = new Redis(redisUrl || 'redis://localhost:6379', {
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => {
          if (times > 3) {
            this.logger.warn('⚠️ No se pudo conectar a Redis tras 3 intentos. Activando modo Fallback en memoria.');
            return null; // Detener reintentos continuos
          }
          return Math.min(times * 100, 1000);
        },
        enableReadyCheck: false,
        lazyConnect: true,
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.logger.log(' Conectado exitosamente a Redis.');
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
        // Registro discreto para no inundar la consola si no hay Redis local levantado
        this.logger.debug(`Redis aviso: ${err.message}`);
      });

      await this.client.connect().catch((err) => {
        this.logger.warn(`⚠️ Servidor Redis no disponible (${err.message}). Utilizando almacenamiento en memoria efímero.`);
      });
    } catch (error) {
      this.logger.warn(`⚠️ Error al inicializar cliente Redis: ${(error as Error).message}`);
    }
  }

  async onModuleDestroy() {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.logger.log('🔌 Desconectado de Redis.');
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
    return false;
  }

  async get(key: string): Promise<string | null> {
    if (this.client && this.isConnected) {
      try {
        return await this.client.get(key);
      } catch (err) {
        this.logger.warn(`Error leyendo de Redis key ${key}: ${(err as Error).message}`);
      }
    }

    // Fallback en memoria
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
      } catch (err) {
        this.logger.warn(`Error guardando en Redis key ${key}: ${(err as Error).message}`);
      }
    }

    // Fallback en memoria
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.memoryFallback.set(key, { value, expiresAt });
  }

  async setnx(key: string, value: string, ttlSeconds: number): Promise<boolean> {
    if (this.client && this.isConnected) {
      try {
        const result = await this.client.set(key, value, 'EX', ttlSeconds, 'NX');
        return result === 'OK';
      } catch (err) {
        this.logger.warn(`Error SETNX en Redis key ${key}: ${(err as Error).message}`);
      }
    }

    // Fallback en memoria
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
      } catch (err) {
        this.logger.warn(`Error borrando en Redis key ${key}: ${(err as Error).message}`);
      }
    }

    this.memoryFallback.delete(key);
  }
}
