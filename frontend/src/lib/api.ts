import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

class ApiClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (this.accessToken && config.headers) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
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
      }
    );
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
    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refreshToken: this.refreshToken,
    });
    this.setTokens(response.data.accessToken, response.data.refreshToken);
  }

  // Auth
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    this.setTokens(response.data.accessToken, response.data.refreshToken);
    return response.data;
  }

  async register(data: { email: string; password: string; firstName: string; lastName: string; nationalId: string }) {
    const response = await this.client.post('/auth/register', data);
    this.setTokens(response.data.accessToken, response.data.refreshToken);
    return response.data;
  }

  async logout() {
    this.clearTokens();
  }

  async getProfile() {
    const response = await this.client.get('/users/profile');
    return response.data;
  }

  // Accounts
  async getAccounts() {
    const response = await this.client.get('/accounts');
    return response.data;
  }

  async getAccount(id: string) {
    const response = await this.client.get(`/accounts/${id}`);
    return response.data;
  }

  async createAccount(data: { accountType: string; currency?: string }) {
    const response = await this.client.post('/accounts', data);
    return response.data;
  }

  async getAccountStatement(accountId: string, params?: { from?: string; to?: string; page?: number; limit?: number }) {
    const response = await this.client.get(`/accounts/${accountId}/statement`, { params });
    return response.data;
  }

  // Transfers
  async createTransfer(data: { fromAccountId: string; toAccountNumber: string; amountCents: number; currency: string; description?: string; idempotencyKey: string }) {
    const response = await this.client.post('/transfers', data);
    return response.data;
  }

  async getTransfers(params?: { page?: number; limit?: number }) {
    const response = await this.client.get('/transfers', { params });
    return response.data;
  }

  // Operations (Deposits/Withdrawals)
  async deposit(data: { accountId: string; amountCents: number; currency: string; description?: string; idempotencyKey: string }) {
    const response = await this.client.post('/operations/deposit', data);
    return response.data;
  }

  async withdraw(data: { accountId: string; amountCents: number; currency: string; description?: string; idempotencyKey: string }) {
    const response = await this.client.post('/operations/withdraw', data);
    return response.data;
  }

  // Cards
  async getCards() {
    const response = await this.client.get('/cards');
    return response.data;
  }

  async getCard(id: string) {
    const response = await this.client.get(`/cards/${id}`);
    return response.data;
  }

  async createCard(data: { accountId: string; cardType: string; dailyLimitCents?: number }) {
    const response = await this.client.post('/cards', data);
    return response.data;
  }

  async freezeCard(id: string) {
    const response = await this.client.post(`/cards/${id}/freeze`);
    return response.data;
  }

  async unfreezeCard(id: string) {
    const response = await this.client.post(`/cards/${id}/unfreeze`);
    return response.data;
  }

  async cancelCard(id: string) {
    const response = await this.client.delete(`/cards/${id}`);
    return response.data;
  }

  // Forex
  async getExchangeRates() {
    const response = await this.client.get('/forex/rates');
    return response.data;
  }

  async convertCurrency(data: { fromCurrency: string; toCurrency: string; amount: number }) {
    const response = await this.client.post('/forex/convert', data);
    return response.data;
  }

  // Audit
  async getAuditLogs(params?: { action?: string; resource?: string; userId?: string; page?: number; limit?: number }) {
    const response = await this.client.get('/audit', { params });
    return response.data;
  }

  // Health
  async healthCheck() {
    const response = await this.client.get('/health');
    return response.data;
  }

  // Users
  async getUsers(params?: { page?: number; limit?: number }) {
    const response = await this.client.get('/users', { params });
    return response.data;
  }

  async updateUser(id: string, data: Partial<{ firstName: string; lastName: string; status: string }>) {
    const response = await this.client.patch(`/users/${id}`, data);
    return response.data;
  }
}

export const api = new ApiClient();

// Initialize tokens from localStorage on client side
if (typeof window !== 'undefined') {
  api.loadTokensFromStorage();
}
