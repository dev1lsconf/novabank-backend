import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { initialBankData } from '../../data/initial-bank-data';

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccountRecord {
  id: string;
  userId: string;
  accountNumber: string;
  accountType: string;
  currency: string;
  balanceCents: number;
  lockedBalanceCents: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionRecord {
  id: string;
  referenceCode: string;
  type: string;
  status: string;
  amountCents: number;
  currency: string;
  description: string;
  idempotencyKey?: string | null;
  createdBy?: string | null;
  createdAt: string;
}

export interface JournalEntryRecord {
  id: string;
  transactionId: string;
  accountId: string;
  entryType: 'DEBIT' | 'CREDIT';
  amountCents: number;
  balanceAfterCents: number;
  createdAt: string;
}

export interface CardRecord {
  id: string;
  accountId: string;
  maskedPan: string;
  panHash: string;
  cardType: string;
  expirationDate: string;
  status: string;
  dailyLimitCents: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExchangeRateRecord {
  id: string;
  baseCurrency: string;
  targetCurrency: string;
  rate: number;
  updatedAt: string;
}

export interface AuditLogRecord {
  id: string;
  userId?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: any;
  createdAt: string;
}

@Injectable()
export class JsonDbService implements OnModuleInit {
  private readonly logger = new Logger(JsonDbService.name);

  public users: UserRecord[] = [];
  public accounts: AccountRecord[] = [];
  public transactions: TransactionRecord[] = [];
  public journalEntries: JournalEntryRecord[] = [];
  public cards: CardRecord[] = [];
  public exchangeRates: ExchangeRateRecord[] = [];
  public auditLogs: AuditLogRecord[] = [];

  onModuleInit() {
    this.resetData();
    this.logger.log('✅ Base de datos JSON en memoria cargada con éxito (Modo Serverless & Local Autónomo).');
  }

  public resetData() {
    this.users = JSON.parse(JSON.stringify(initialBankData.users || []));
    this.accounts = JSON.parse(JSON.stringify(initialBankData.accounts || []));
    this.transactions = JSON.parse(JSON.stringify(initialBankData.transactions || []));
    this.journalEntries = JSON.parse(JSON.stringify(initialBankData.journalEntries || []));
    this.cards = JSON.parse(JSON.stringify(initialBankData.cards || []));
    this.exchangeRates = JSON.parse(JSON.stringify(initialBankData.exchangeRates || []));
    this.auditLogs = JSON.parse(JSON.stringify(initialBankData.auditLogs || []));
  }

  // ==========================================
  // USUARIOS
  // ==========================================
  async findUserById(id: string): Promise<UserRecord | undefined> {
    return this.users.find((u) => u.id === id);
  }

  async findUserByEmail(email: string): Promise<UserRecord | undefined> {
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  async findUserByNationalId(nationalId: string): Promise<UserRecord | undefined> {
    return this.users.find((u) => u.nationalId.toLowerCase() === nationalId.toLowerCase());
  }

  async createUser(data: Omit<UserRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserRecord> {
    const now = new Date().toISOString();
    const newUser: UserRecord = {
      id: uuidv4(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    this.users.push(newUser);
    return newUser;
  }

  async updateUser(id: string, data: Partial<UserRecord>): Promise<UserRecord | undefined> {
    const user = this.users.find((u) => u.id === id);
    if (!user) return undefined;
    Object.assign(user, data, { updatedAt: new Date().toISOString() });
    return user;
  }

  async findAllUsers(skip = 0, take = 20): Promise<{ data: UserRecord[]; total: number }> {
    const total = this.users.length;
    const data = this.users.slice(skip, skip + take);
    return { data, total };
  }

  // ==========================================
  // CUENTAS
  // ==========================================
  async findAccountById(id: string): Promise<AccountRecord | undefined> {
    return this.accounts.find((a) => a.id === id);
  }

  async findAccountByNumber(accountNumber: string): Promise<AccountRecord | undefined> {
    const clean = accountNumber.replace(/\s+/g, '').toUpperCase();
    return this.accounts.find((a) => a.accountNumber.replace(/\s+/g, '').toUpperCase() === clean);
  }

  async findAccountsByUserId(userId: string): Promise<AccountRecord[]> {
    return this.accounts.filter((a) => a.userId === userId);
  }

  async findAllAccounts(): Promise<AccountRecord[]> {
    return [...this.accounts];
  }

  async createAccount(data: Omit<AccountRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<AccountRecord> {
    const now = new Date().toISOString();
    const newAccount: AccountRecord = {
      id: uuidv4(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    this.accounts.push(newAccount);
    return newAccount;
  }

  async updateAccount(id: string, data: Partial<AccountRecord>): Promise<AccountRecord | undefined> {
    const account = this.accounts.find((a) => a.id === id);
    if (!account) return undefined;
    Object.assign(account, data, { updatedAt: new Date().toISOString() });
    return account;
  }

  // ==========================================
  // TRANSACCIONES & LIBRO MAYOR
  // ==========================================
  async createTransaction(
    data: Omit<TransactionRecord, 'id' | 'createdAt'>,
  ): Promise<TransactionRecord> {
    const newTx: TransactionRecord = {
      id: uuidv4(),
      ...data,
      createdAt: new Date().toISOString(),
    };
    this.transactions.unshift(newTx);
    return newTx;
  }

  async createJournalEntry(
    data: Omit<JournalEntryRecord, 'id' | 'createdAt'>,
  ): Promise<JournalEntryRecord> {
    const newEntry: JournalEntryRecord = {
      id: uuidv4(),
      ...data,
      createdAt: new Date().toISOString(),
    };
    this.journalEntries.unshift(newEntry);
    return newEntry;
  }

  async findJournalEntriesByAccountId(
    accountId: string,
    skip = 0,
    take = 50,
  ): Promise<{ data: any[]; total: number }> {
    const entries = this.journalEntries.filter((e) => e.accountId === accountId);
    const total = entries.length;
    const paginated = entries.slice(skip, skip + take).map((e) => {
      const tx = this.transactions.find((t) => t.id === e.transactionId);
      return {
        ...e,
        transaction: tx || null,
      };
    });
    return { data: paginated, total };
  }

  // ==========================================
  // TARJETAS
  // ==========================================
  async createCard(data: Omit<CardRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<CardRecord> {
    const now = new Date().toISOString();
    const newCard: CardRecord = {
      id: uuidv4(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    this.cards.unshift(newCard);
    return newCard;
  }

  async findCardById(id: string): Promise<CardRecord | undefined> {
    return this.cards.find((c) => c.id === id);
  }

  async findCardsByAccountId(accountId: string): Promise<CardRecord[]> {
    return this.cards.filter((c) => c.accountId === accountId);
  }

  async findAllCards(): Promise<CardRecord[]> {
    return [...this.cards];
  }

  async updateCard(id: string, data: Partial<CardRecord>): Promise<CardRecord | undefined> {
    const card = this.cards.find((c) => c.id === id);
    if (!card) return undefined;
    Object.assign(card, data, { updatedAt: new Date().toISOString() });
    return card;
  }

  // ==========================================
  // FOREX
  // ==========================================
  async findAllExchangeRates(): Promise<ExchangeRateRecord[]> {
    return [...this.exchangeRates];
  }

  async findExchangeRate(base: string, target: string): Promise<ExchangeRateRecord | undefined> {
    return this.exchangeRates.find(
      (r) => r.baseCurrency === base.toUpperCase() && r.targetCurrency === target.toUpperCase(),
    );
  }

  // ==========================================
  // AUDITORÍA
  // ==========================================
  async createAuditLog(
    data: Omit<AuditLogRecord, 'id' | 'createdAt'>,
  ): Promise<AuditLogRecord> {
    const newLog: AuditLogRecord = {
      id: uuidv4(),
      ...data,
      createdAt: new Date().toISOString(),
    };
    this.auditLogs.unshift(newLog);
    return newLog;
  }

  async findAuditLogs(
    query: { action?: string; resource?: string; userId?: string },
    skip = 0,
    take = 20,
  ): Promise<{ data: any[]; total: number }> {
    let filtered = this.auditLogs;
    if (query.action) {
      filtered = filtered.filter((l) => l.action.toLowerCase().includes(query.action!.toLowerCase()));
    }
    if (query.resource) {
      filtered = filtered.filter((l) => l.resource.toLowerCase().includes(query.resource!.toLowerCase()));
    }
    if (query.userId) {
      filtered = filtered.filter((l) => l.userId === query.userId);
    }

    const total = filtered.length;
    const paginated = filtered.slice(skip, skip + take).map((l) => {
      const user = l.userId ? this.users.find((u) => u.id === l.userId) : null;
      return {
        ...l,
        user: user
          ? {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role,
            }
          : null,
      };
    });

    return { data: paginated, total };
  }

  async transaction<T>(callback: (db: JsonDbService) => Promise<T>): Promise<T> {
    return callback(this);
  }
}
