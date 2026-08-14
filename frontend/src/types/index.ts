export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  role: 'CLIENTE' | 'CAJERO' | 'GERENTE' | 'AUDITOR' | 'ADMIN';
  status: 'ACTIVO' | 'INACTIVO' | 'BLOQUEADO';
  createdAt: string;
  updatedAt: string;
}

export interface Account {
  id: string;
  userId: string;
  accountNumber: string;
  accountType: 'AHORRO' | 'CORRIENTE' | 'PLAZO_FIJO' | 'INVERSION';
  currency: string;
  balanceCents: number;
  lockedBalanceCents: number;
  status: 'ACTIVA' | 'INACTIVA' | 'BLOQUEADA' | 'CERRADA';
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  referenceCode: string;
  type: 'DEPOSITO' | 'RETIRO' | 'TRANSFERENCIA_ENVIADA' | 'TRANSFERENCIA_RECIBIDA' | 'PAGO_TARJETA' | 'COMPRA_FOREX' | 'VENTA_FOREX';
  status: 'PENDIENTE' | 'COMPLETADA' | 'FALLIDA' | 'CANCELADA' | 'REVERTIDA';
  amountCents: number;
  currency: string;
  description: string;
  idempotencyKey?: string | null;
  createdBy?: string | null;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  transactionId: string;
  accountId: string;
  entryType: 'DEBIT' | 'CREDIT';
  amountCents: number;
  balanceAfterCents: number;
  createdAt: string;
}

export interface Card {
  id: string;
  accountId: string;
  maskedPan: string;
  panHash: string;
  cardType: 'DEBITO' | 'CREDITO' | 'PREPAGO';
  expirationDate: string;
  status: 'ACTIVA' | 'BLOQUEADA' | 'VENCIDA' | 'CANCELADA';
  dailyLimitCents: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExchangeRate {
  id: string;
  baseCurrency: string;
  targetCurrency: string;
  rate: number;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
  user?: Pick<User, 'id' | 'email' | 'firstName' | 'lastName' | 'role'> | null;
}

export interface HealthCheck {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  checks: {
    database: { status: string; latency?: number };
    redis: { status: string; latency?: number };
    memory: { used: number; total: number };
  };
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  nationalId: string;
}

export interface CreateAccountRequest {
  accountType: 'AHORRO' | 'CORRIENTE' | 'PLAZO_FIJO' | 'INVERSION';
  currency?: string;
}

export interface CreateTransferRequest {
  fromAccountId: string;
  toAccountNumber: string;
  amountCents: number;
  currency: string;
  description?: string;
  idempotencyKey: string;
}

export interface CreateCardRequest {
  accountId: string;
  cardType: 'DEBITO' | 'CREDITO' | 'PREPAGO';
  dailyLimitCents?: number;
}

export interface DepositRequest {
  accountId: string;
  amountCents: number;
  currency: string;
  description?: string;
  idempotencyKey: string;
}

export interface ConvertCurrencyRequest {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
}
