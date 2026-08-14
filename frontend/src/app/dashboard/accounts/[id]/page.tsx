"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore, useAccountsStore } from '@/store';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatRelativeTime, maskAccountNumber } from '@/lib/utils';
import { ArrowLeft, CreditCard, TrendingUp, ArrowRightLeft, Eye, Loader2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

type AccountDetail = {
  id: string;
  accountNumber: string;
  accountType: string;
  currency: string;
  balanceCents: number;
  lockedBalanceCents: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  journalEntries: Array<{
    id: string;
    transactionId: string;
    entryType: string;
    amountCents: number;
    balanceAfterCents: number;
    createdAt: string;
    transaction?: {
      id: string;
      referenceCode: string;
      type: string;
      status: string;
      description: string;
      createdAt: string;
    };
  }>;
};

export default function AccountDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { accounts, setAccounts } = useAccountsStore();
  const [account, setAccount] = useState<AccountDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadAccount();
  }, [user, router, params.id]);

  const loadAccount = async () => {
    try {
      setIsLoading(true);
      const response = await api.getAccount(params.id as string);
      const data = response.data || response;
      setAccount(data);

      const existing = accounts.find(a => a.id === params.id);
      if (!existing) {
        const accountsRes = await api.getAccounts();
        const accountsData = accountsRes.data || accountsRes;
        setAccounts(accountsData);
      }
    } catch (error) {
      toast.error('Error cargando cuenta');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!account) {
    return (
      <div className="text-center py-12">
        <CreditCard className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">Cuenta no encontrada</h3>
        <p className="text-gray-400 mb-6">La cuenta que buscas no existe o no tienes acceso</p>
        <Link href="/dashboard/accounts">
          <Button>Volver a Cuentas</Button>
        </Link>
      </div>
    );
  }

  const totalBalance = account.balanceCents + account.lockedBalanceCents;
  const availableBalance = account.balanceCents;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/accounts">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Cuenta {maskAccountNumber(account.accountNumber)}</h1>
          <p className="text-gray-400 mt-1 capitalize">{account.accountType.toLowerCase().replace('_', ' ')} · {account.currency}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="elevated">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Saldo Disponible</p>
                <p className="text-2xl font-bold text-green-400 mt-1">{formatCurrency(availableBalance, account.currency)}</p>
              </div>
              <div className="p-3 rounded-xl bg-green-500/10">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Saldo Bloqueado</p>
                <p className="text-2xl font-bold text-amber-400 mt-1">{formatCurrency(account.lockedBalanceCents, account.currency)}</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10">
                <Eye className="w-6 h-6 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Saldo Total</p>
                <p className="text-2xl font-bold text-white mt-1">{formatCurrency(totalBalance, account.currency)}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10">
                <CreditCard className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card variant="elevated" className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Movimientos de la Cuenta</CardTitle>
          </CardHeader>
          <CardContent>
            {!account.journalEntries || account.journalEntries.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>No hay movimientos registrados</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-gray-400 border-b border-dark-border">
                      <th className="pb-3">Fecha</th>
                      <th className="pb-3">Tipo</th>
                      <th className="pb-3">Descripción</th>
                      <th className="pb-3 text-right">Monto</th>
                      <th className="pb-3 text-right">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {account.journalEntries.map((entry) => (
                      <tr key={entry.id} className="border-b border-dark-border/50 hover:bg-dark-bg/50">
                        <td className="py-3 text-sm text-gray-400">{formatRelativeTime(entry.createdAt)}</td>
                        <td className="py-3">
                          <Badge variant={entry.entryType === 'DEBIT' ? 'danger' : 'success'}>
                            {entry.entryType === 'DEBIT' ? 'Débito' : 'Crédito'}
                          </Badge>
                        </td>
                        <td className="py-3 text-sm text-white">
                          {entry.transaction?.description || entry.transaction?.type || 'Movimiento'}
                        </td>
                        <td className={`py-3 text-right font-medium ${entry.entryType === 'DEBIT' ? 'text-red-400' : 'text-green-400'}`}>
                          {entry.entryType === 'DEBIT' ? '-' : '+'}{formatCurrency(entry.amountCents, account.currency)}
                        </td>
                        <td className="py-3 text-right text-white">{formatCurrency(entry.balanceAfterCents, account.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Acciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard/transfers/new">
              <Button variant="outline" className="w-full justify-start gap-3">
                <ArrowRightLeft className="w-5 h-5" />
                <span>Transferir</span>
              </Button>
            </Link>
            <Link href="/dashboard/operations/deposit">
              <Button variant="outline" className="w-full justify-start gap-3">
                <TrendingUp className="w-5 h-5" />
                <span>Depositar</span>
              </Button>
            </Link>
            <Link href="/dashboard/operations/withdraw">
              <Button variant="outline" className="w-full justify-start gap-3 text-red-400 hover:text-red-300">
                <ArrowRightLeft className="w-5 h-5 rotate-180" />
                <span>Retirar</span>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}