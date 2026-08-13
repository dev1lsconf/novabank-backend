import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const IdempotencyKey = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    const key = request.headers['idempotency-key'] || request.headers['x-idempotency-key'];
    return Array.isArray(key) ? key[0] : key;
  },
);
