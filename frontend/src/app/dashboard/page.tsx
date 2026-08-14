"use client";

import { useEffect, useState } from 'react';
import { useAuthStore, useAccountsStore, useTransactionsStore, useCardsStore, useForexStore } from '@/store';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatRelativeTime, getTransactionTypeColor, getTransactionTypeIcon } from '@/lib/utils';
import {
  CreditCard,
  ArrowRightLeft,
  Wallet,
  TrendingUp,
  Building2,
  ArrowUpRight,
  Eye,
  Plus,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { accounts, setAccounts, isLoading: accountsLoading, setLoading: setAccountsLoading } = useAccountsStore();
  const { transactions, setTransactions, isLoading: txLoading } = useTransactionsStore();
  const { cards, setCards } = useCardsStore();
  const { rates, setRates } = useForexStore();
  const [totalBalance, setTotalBalance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async () => {
    try {
      setAccountsLoading(true);
      const [accountsRes, txRes, cardsRes, ratesRes] = await Promise.allSettled([
        api.getAccounts(),
        api.getTransfers({ limit: 10 }),
        api.getCards(),
        api.getExchangeRates(),
      ]);

      if (accountsRes.status === 'fulfilled') {
        const accountsData = accountsRes.value.data || accountsRes.value;
        setAccounts(accountsData);
        const balance = accountsData.reduce((sum: number, acc: any) => sum + (acc.balanceCents || 0), 0);
        setTotalBalance(balance);
      }
      if (txRes.status === 'fulfilled') {
        const txData = txRes.value.data || txRes.value;
        setTransactions(txData);
      }
      if (cardsRes.status === 'fulfilled') {
        const cardsData = cardsRes.value.data || cardsRes.value;
        setCards(cardsData);
      }
      if (ratesRes.status === 'fulfilled') {
        const ratesData = ratesRes.value.data || ratesRes.value;
        setRates(ratesData);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Error cargando datos del dashboard');
    } finally {
      setAccountsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
    toast.success('Datos actualizados');
  };

  useEffect(() => {
    loadData();
  }, []);

  const recentTransactions = transactions.slice(0, 5);

  const stats = [
    { label: 'Saldo Total', value: formatCurrency(totalBalance), icon: Wallet, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Cuentas Activas', value: accounts.filter((a) => a.status === 'ACTIVA').length, icon: CreditCard, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Tarjetas', value: cards.filter((c) => c.status === 'ACTIVA').length, icon: Wallet, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Divisas', value: rates.length, icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">Bienvenido, {user?.firstName} {user?.lastName}</p>
        </div>
        <Button onClick={handleRefresh} variant="outline" loading={isRefreshing}>
          <RefreshCw className={isRefreshing ? 'animate-spin' : ''} />
          Actualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} variant="elevated">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">{stat.label}</p>
                    <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                  </div>
                  <div className={cn('p-3 rounded-xl', stat.bg)}>
                    <Icon className={cn('w-6 h-6', stat.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card variant="elevated" className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Transacciones Recientes</CardTitle>
            <Link href="/dashboard/transfers" className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1">
              Ver todas <ArrowUpRight className="w-4 h-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {txLoading || transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>No hay transacciones recientes</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 bg-dark-bg rounded-lg border border-dark-border hover:border-dark-border/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={cn('p-2 rounded-lg', getTransactionTypeColor(tx.type) + '/10')}>
                        <getTransactionTypeIcon(tx.type) className={cn('w-5 h-5', getTransactionTypeColor(tx.type))} />
                      </div>
                      <div>
                        <p className="font-medium text-white">{tx.description || tx.type.replace('_', ' ')}</p>
                        <p className="text-xs text-gray-400">{formatRelativeTime(tx.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn('font-semibold', tx.amountCents > 0 ? 'text-green-400' : 'text-red-400')}>
                        {tx.amountCents > 0 ? '+' : ''}{formatCurrency(tx.amountCents, tx.currency)}
                      </p>
                      <Badge variant="status" status={tx.status} className="text-xs" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Acceso Rápido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard/accounts/new" className="block">
              <Button variant="outline" className="w-full justify-start gap-3">
                <Plus className="w-5 h-5" />
                <span>Nueva Cuenta</span>
              </Button>
            </Link>
            <Link href="/dashboard/transfers/new" className="block">
              <Button variant="outline" className="w-full justify-start gap-3">
                <ArrowRightLeft className="w-5 h-5" />
                <span>Nueva Transferencia</span>
              </Button>
            </Link>
            <Link href="/dashboard/cards/new" className="block">
              <Button variant="outline" className="w-full justify-start gap-3">
                <Wallet className="w-5 h-5" />
                <span>Nueva Tarjeta</span>
              </Button>
            </Link>
            <Link href="/dashboard/forex" className="block">
              <Button variant="outline" className="w-full justify-start gap-3">
                <TrendingUp className="w-5 h-5" />
                <span>Cambio Divisas</span>
              </Button>
            </Link>
            <Link href="/dashboard/operations" className="block">
              <Button variant="outline" className="w-full justify-start gap-3">
                <Building2 className="w-5 h-5" />
                <span>Operaciones</span>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {accounts.length > 0 && (
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Tus Cuentas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {accounts.map((account) => (
                <Link key={account.id} href={`/dashboard/accounts/${account.id}`} className="block">
                  <div className="p-4 bg-dark-bg rounded-lg border border-dark-border hover:border-primary-500/50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="status" status={account.status} />
                      <span className="text-xs text-gray-400 font-mono">{account.accountNumber}</span>
                    </div>
                    <p className="text-2xl font-bold text-white mb-1">{formatCurrency(account.balanceCents, account.currency)}</p>
                    <p className="text-sm text-gray-400 capitalize">{account.accountType.toLowerCase().replace('_', ' ')}</p>
                    {account.lockedBalanceCents > 0 && (
                      <p className="text-xs text-amber-400 mt-2">Bloqueado: {formatCurrency(account.lockedBalanceCents, account.currency)}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {rates.length > 0 && (
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Tipos de Cambio (Forex)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b border-dark-border">
                    <th className="pb-2">Par</th>
                    <th className="pb-2 text-right">Compra</th>
                    <th className="pb-2 text-right">Venta</th>
                    <th className="pb-2 text-right">Actualizado</th>
                  </tr>
                </thead>
                <tbody>
                  {rates.slice(0, 10).map((rate) => (
                    <tr key={rate.id} className="border-b border-dark-border/50 hover:bg-dark-bg/50">
                      <td className="py-2 font-medium text-white">{rate.baseCurrency}/{rate.targetCurrency}</td>
                      <td className="py-2 text-right text-green-400">{rate.rate.toFixed(4)}</td>
                      <td className="py-2 text-right text-red-400">{(rate.rate * 1.02).toFixed(4)}</td>
                      <td className="py-2 text-right text-gray-400 text-xs">{formatRelativeTime(rate.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
