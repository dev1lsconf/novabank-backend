import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
const isDemo = !API_BASE_URL;

const demoDelay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

const demoAccounts = [
  { id: 'acc_1', accountNumber: 'ES1234567890123456789012', accountType: 'AHORRO', currency: 'EUR', balanceCents: 125000000, lockedBalanceCents: 0, status: 'ACTIVA', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z', userId: 'u_1' },
  { id: 'acc_2', accountNumber: 'ES9876543210987654321098', accountType: 'CORRIENTE', currency: 'EUR', balanceCents: 54000000, lockedBalanceCents: 0, status: 'ACTIVA', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z', userId: 'u_1' },
];

const demoTxs = [
  { id: 'tx_1', referenceCode: 'NVB-1001', type: 'DEPOSITO', status: 'COMPLETADA', amountCents: 12000000, currency: 'EUR', description: 'Depósito inicial', createdAt: '2025-01-02T00:00:00Z' },
  { id: 'tx_2', referenceCode: 'NVB-1002', type: 'TRANSFERENCIA_ENVIADA', status: 'COMPLETADA', amountCents: 2500000, currency: 'EUR', description: 'Pago alquiler', createdAt: '2025-01-03T00:00:00Z' },
];

const demoCards = [
  { id: 'card_1', accountId: 'acc_1', maskedPan: '•••• •••• •••• 1234', panHash: 'hash_1', cardType: 'DEBITO', expirationDate: '2027-12', status: 'ACTIVA', dailyLimitCents: 5000000, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
];

const demoRates = [
  { id: 'fx_1', baseCurrency: 'EUR', targetCurrency: 'USD', rate: 1.0845, updatedAt: '2025-01-03T00:00:00Z' },
  { id: 'fx_2', baseCurrency: 'EUR', targetCurrency: 'GBP', rate: 0.8593, updatedAt: '2025-01-03T00:00:00Z' },
];

const demoAudit = [
  { id: 'log_1', userId: 'u_1', action: 'LOGIN', resource: 'auth', resourceId: 'u_1', ipAddress: '127.0.0.1', userAgent: 'demo', createdAt: '2025-01-03T00:00:00Z', user: { id: 'u_1', email: 'demo@novabank.local', firstName: 'Demo', lastName: 'User', role: 'CLIENTE' } },
];

class ApiClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
    });

    this.client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      if (this.accessToken && config.headers) {
        config.headers.Authorization = `Bearer ${this.accessToken}`;
      }
      return config;
    }, (error) => Promise.reject(error));

    this.client.interceptors.response.use((response) => response, async (error) => {
      const originalRequest = error.config;
      if (error.response?.status === 401 && !originalRequest._retry && this.refreshToken) {
        originalRequest._retry = true;
        try {
          await this.refreshAccessToken();
          originalRequest.headers.Authorization = `Bearer ${this.accessToken}`;
          return this.client(originalRequest);
        } catch (refreshError) {
          this.clearTokens();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        }
      }
      return Promise.reject(error);
    });
  }

  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    }
  }

  loadTokensFromStorage() {
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('accessToken');
      this.refreshToken = localStorage.getItem('refreshToken');
    }
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) throw new Error('No refresh token');
    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken: this.refreshToken });
    this.setTokens(response.data.accessToken, response.data.refreshToken);
  }

  async login(email: string, password: string) {
    if (isDemo) {
      await demoDelay(400);
      const demoUser = { id: 'u_1', email, firstName: 'Demo', lastName: 'User', nationalId: 'DEMO', role: 'CLIENTE', status: 'ACTIVO', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' };
      this.setTokens('demo_access_token', 'demo_refresh_token');
      return { accessToken: 'demo_access_token', refreshToken: 'demo_refresh_token', user: demoUser };
    }
    const response = await this.client.post('/auth/login', { email, password });
    this.setTokens(response.data.accessToken, response.data.refreshToken);
    return response.data;
  }

  async register(data: { email: string; password: string; firstName: string; lastName: string; nationalId: string }) {
    if (isDemo) {
      await demoDelay(400);
      const demoUser = { id: 'u_1', email: data.email, firstName: data.firstName, lastName: data.lastName, nationalId: data.nationalId, role: 'CLIENTE', status: 'ACTIVO', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      this.setTokens('demo_access_token', 'demo_refresh_token');
      return { accessToken: 'demo_access_token', refreshToken: 'demo_refresh_token', user: demoUser };
    }
    const response = await this.client.post('/auth/register', data);
    this.setTokens(response.data.accessToken, response.data.refreshToken);
    return response.data;
  }

  async logout() {
    this.clearTokens();
  }

  async getProfile() {
    if (isDemo) {
      await demoDelay();
      return { id: 'u_1', email: 'demo@novabank.local', firstName: 'Demo', lastName: 'User', nationalId: 'DEMO', role: 'CLIENTE', status: 'ACTIVO', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' };
    }
    const response = await this.client.get('/users/profile');
    return response.data;
  }

  async getAccounts() {
    if (isDemo) {
      await demoDelay();
      return demoAccounts;
    }
    const response = await this.client.get('/accounts');
    return response.data;
  }

  async getAccount(id: string) {
    if (isDemo) {
      await demoDelay();
      const account = demoAccounts.find((a) => a.id === id) || demoAccounts[0];
      return { ...account, journalEntries: [] };
    }
    const response = await this.client.get(`/accounts/${id}`);
    return response.data;
  }

  async createAccount(data: { accountType: string; currency?: string }) {
    if (isDemo) {
      await demoDelay(500);
      const newAccount = { id: 'acc_' + Date.now(), accountNumber: 'ES' + Math.floor(Math.random() * 1e18).toString().padStart(18, '0'), ...data, balanceCents: 0, lockedBalanceCents: 0, status: 'ACTIVA', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), userId: 'u_1' };
      demoAccounts.push(newAccount);
      return newAccount;
    }
    const response = await this.client.post('/accounts', data);
    return response.data;
  }

  async getAccountStatement(accountId: string, params?: { from?: string; to?: string; page?: number; limit?: number }) {
    if (isDemo) {
      await demoDelay();
      return { data: [], total: 0, page: 1, limit: 20 };
    }
    const response = await this.client.get(`/accounts/${accountId}/statement`, { params });
    return response.data;
  }

  async createTransfer(data: { fromAccountId: string; toAccountNumber: string; amountCents: number; currency: string; description?: string; idempotencyKey: string }) {
    if (isDemo) {
      await demoDelay(600);
      const tx = { id: 'tx_' + Date.now(), referenceCode: 'NVB-' + Math.floor(1000 + Math.random() * 9000), type: 'TRANSFERENCIA_ENVIADA', status: 'COMPLETADA', amountCents: data.amountCents, currency: data.currency, description: data.description || 'Transferencia', createdAt: new Date().toISOString() };
      demoTxs.unshift(tx);
      return tx;
    }
    const response = await this.client.post('/transfers', data);
    return response.data;
  }

  async getTransfers(params?: { page?: number; limit?: number }) {
    if (isDemo) {
      await demoDelay();
      return demoTxs;
    }
    const response = await this.client.get('/transfers', { params });
    return response.data;
  }

  async deposit(data: { accountId: string; amountCents: number; currency: string; description?: string; idempotencyKey: string }) {
    if (isDemo) {
      await demoDelay(600);
      const tx = { id: 'tx_' + Date.now(), referenceCode: 'NVB-' + Math.floor(1000 + Math.random() * 9000), type: 'DEPOSITO', status: 'COMPLETADA', amountCents: data.amountCents, currency: data.currency, description: data.description || 'Depósito', createdAt: new Date().toISOString() };
      demoTxs.unshift(tx);
      return tx;
    }
    const response = await this.client.post('/operations/deposit', data);
    return response.data;
  }

  async withdraw(data: { accountId: string; amountCents: number; currency: string; description?: string; idempotencyKey: string }) {
    if (isDemo) {
      await demoDelay(600);
      const tx = { id: 'tx_' + Date.now(), referenceCode: 'NVB-' + Math.floor(1000 + Math.random() * 9000), type: 'RETIRO', status: 'COMPLETADA', amountCents: data.amountCents, currency: data.currency, description: data.description || 'Retiro', createdAt: new Date().toISOString() };
      demoTxs.unshift(tx);
      return tx;
    }
    const response = await this.client.post('/operations/withdraw', data);
    return response.data;
  }

  async getCards() {
    if (isDemo) {
      await demoDelay();
      return demoCards;
    }
    const response = await this.client.get('/cards');
    return response.data;
  }

  async getCard(id: string) {
    if (isDemo) {
      await demoDelay();
      return demoCards.find((c) => c.id === id) || demoCards[0];
    }
    const response = await this.client.get(`/cards/${id}`);
    return response.data;
  }

  async createCard(data: { accountId: string; cardType: string; dailyLimitCents?: number }) {
    if (isDemo) {
      await demoDelay(500);
      const card = { id: 'card_' + Date.now(), accountId: data.accountId, maskedPan: '•••• •••• •••• ' + Math.floor(1000 + Math.random() * 9000), panHash: 'hash_' + Date.now(), cardType: data.cardType, expirationDate: '2027-12', status: 'ACTIVA', dailyLimitCents: data.dailyLimitCents || 5000000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      demoCards.push(card);
      return card;
    }
    const response = await this.client.post('/cards', data);
    return response.data;
  }

  async freezeCard(id: string) {
    if (isDemo) {
      await demoDelay(400);
      const card = demoCards.find((c) => c.id === id);
      if (card) card.status = 'BLOQUEADA';
      return card;
    }
    const response = await this.client.post(`/cards/${id}/freeze`);
    return response.data;
  }

  async unfreezeCard(id: string) {
    if (isDemo) {
      await demoDelay(400);
      const card = demoCards.find((c) => c.id === id);
      if (card) card.status = 'ACTIVA';
      return card;
    }
    const response = await this.client.post(`/cards/${id}/unfreeze`);
    return response.data;
  }

  async cancelCard(id: string) {
    if (isDemo) {
      await demoDelay(400);
      const idx = demoCards.findIndex((c) => c.id === id);
      if (idx >= 0) demoCards.splice(idx, 1);
      return { success: true };
    }
    const response = await this.client.delete(`/cards/${id}`);
    return response.data;
  }

  async getExchangeRates() {
    if (isDemo) {
      await demoDelay();
      return demoRates;
    }
    const response = await this.client.get('/forex/rates');
    return response.data;
  }

  async convertCurrency(data: { fromCurrency: string; toCurrency: string; amount: number }) {
    if (isDemo) {
      await demoDelay(500);
      const rate = demoRates.find((r) => r.baseCurrency === data.fromCurrency && r.targetCurrency === data.toCurrency) || { rate: 1 };
      return { convertedAmount: data.amount * rate.rate, rate: rate.rate };
    }
    const response = await this.client.post('/forex/convert', data);
    return response.data;
  }

  async getAuditLogs(params?: { action?: string; resource?: string; userId?: string; page?: number; limit?: number }) {
    if (isDemo) {
      await demoDelay();
      return demoAudit;
    }
    const response = await this.client.get('/audit', { params });
    return response.data;
  }

  async healthCheck() {
    if (isDemo) {
      await demoDelay();
      return { status: 'ok', timestamp: new Date().toISOString(), checks: { database: { status: 'demo' }, redis: { status: 'demo' }, memory: { used: 0, total: 0 } } };
    }
    const response = await this.client.get('/health');
    return response.data;
  }

  async getUsers(params?: { page?: number; limit?: number }) {
    if (isDemo) {
      await demoDelay();
      return [{ id: 'u_1', email: 'demo@novabank.local', firstName: 'Demo', lastName: 'User', nationalId: 'DEMO', role: 'CLIENTE', status: 'ACTIVO', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' }];
    }
    const response = await this.client.get('/users', { params });
    return response.data;
  }

  async updateUser(id: string, data: Partial<{ firstName: string; lastName: string; status: string }>) {
    if (isDemo) {
      await demoDelay(400);
      return { id, ...data };
    }
    const response = await this.client.patch(`/users/${id}`, data);
    return response.data;
  }
}

export const api = new ApiClient();

if (typeof window !== 'undefined') {
  api.loadTokensFromStorage();
}