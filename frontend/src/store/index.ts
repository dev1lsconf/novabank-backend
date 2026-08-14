import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Account, Transaction, Card, ExchangeRate, AuditLog } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setAuthenticated: (auth: boolean) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

interface AccountsState {
  accounts: Account[];
  selectedAccount: Account | null;
  isLoading: boolean;
  error: string | null;
  setAccounts: (accounts: Account[]) => void;
  setSelectedAccount: (account: Account | null) => void;
  addAccount: (account: Account) => void;
  updateAccount: (account: Account) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAccountsStore = create<AccountsState>((set) => ({
  accounts: [],
  selectedAccount: null,
  isLoading: false,
  error: null,
  setAccounts: (accounts) => set({ accounts }),
  setSelectedAccount: (selectedAccount) => set({ selectedAccount }),
  addAccount: (account) => set((state) => ({ accounts: [account, ...state.accounts] })),
  updateAccount: (account) =>
    set((state) => ({
      accounts: state.accounts.map((a) => (a.id === account.id ? account : a)),
      selectedAccount: state.selectedAccount?.id === account.id ? account : state.selectedAccount,
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));

interface TransactionsState {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: Transaction) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useTransactionsStore = create<TransactionsState>((set) => ({
  transactions: [],
  isLoading: false,
  error: null,
  setTransactions: (transactions) => set({ transactions }),
  addTransaction: (transaction) =>
    set((state) => ({ transactions: [transaction, ...state.transactions] })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));

interface CardsState {
  cards: Card[];
  isLoading: boolean;
  error: string | null;
  setCards: (cards: Card[]) => void;
  addCard: (card: Card) => void;
  updateCard: (card: Card) => void;
  removeCard: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useCardsStore = create<CardsState>((set) => ({
  cards: [],
  isLoading: false,
  error: null,
  setCards: (cards) => set({ cards }),
  addCard: (card) => set((state) => ({ cards: [card, ...state.cards] })),
  updateCard: (card) =>
    set((state) => ({
      cards: state.cards.map((c) => (c.id === card.id ? card : c)),
    })),
  removeCard: (id) =>
    set((state) => ({
      cards: state.cards.filter((c) => c.id !== id),
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));

interface ForexState {
  rates: ExchangeRate[];
  isLoading: boolean;
  error: string | null;
  setRates: (rates: ExchangeRate[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useForexStore = create<ForexState>((set) => ({
  rates: [],
  isLoading: false,
  error: null,
  setRates: (rates) => set({ rates }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));

interface AuditState {
  logs: AuditLog[];
  isLoading: boolean;
  error: string | null;
  total: number;
  page: number;
  setLogs: (logs: AuditLog[], total?: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPage: (page: number) => void;
}

export const useAuditStore = create<AuditState>((set) => ({
  logs: [],
  isLoading: false,
  error: null,
  total: 0,
  page: 1,
  setLogs: (logs, total) => set({ logs, total: total ?? 0 }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setPage: (page) => set({ page }),
}));

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  notifications: Array<{ id: string; message: string; type: 'success' | 'error' | 'info' | 'warning' }>;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  addNotification: (notification: Omit<UIState['notifications'][0], 'id'>) => void;
  removeNotification: (id: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: 'dark',
      notifications: [],
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      setTheme: (theme) => set({ theme }),
      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            ...state.notifications,
            { ...notification, id: Math.random().toString(36).substring(7) },
          ],
        })),
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({ sidebarOpen: state.sidebarOpen, theme: state.theme }),
    }
  )
);
