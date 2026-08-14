"use client";

import { useEffect } from 'react';
import { useAuthStore, useAccountsStore } from '@/store';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatCurrency, maskAccountNumber } from '@/lib/utils';
import { Plus, Eye, CreditCard, Search, Filter, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function AccountsPage() {
  const { accounts, setAccounts, isLoading, setLoading, selectedAccount, setSelectedAccount } = useAccountsStore();

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        setLoading(true);
        const response = await api.getAccounts();
        const data = response.data || response;
        setAccounts(data);
      } catch (error) {
        toast.error('Error cargando cuentas');
      } finally {
        setLoading(false);
      }
    };
    loadAccounts();
  }, [setAccounts, setLoading]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Cuentas Bancarias</h1>
          <p className="text-gray-400 mt-1">Gestiona tus cuentas y saldos</p>
        </div>
        <Link href="/dashboard/accounts/new">
          <Button>
            <Plus className="w-4 h-4" />
            Nueva Cuenta
          </Button>
        </Link>
      </div>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Todas las Cuentas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="mt-4 text-gray-400">Cargando cuentas...</p>
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No tienes cuentas</h3>
              <p className="text-gray-400 mb-6">Comienza creando tu primera cuenta bancaria</p>
              <Link href="/dashboard/accounts/new">
                <Button>
                  <Plus className="w-4 h-4" />
                  Crear Cuenta
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {accounts.map((account) => (
                <Link key={account.id} href={`/dashboard/accounts/${account.id}`} className="block">
                  <div className="p-5 bg-dark-bg rounded-xl border border-dark-border hover:border-primary-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-primary-500/10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-primary-600/20">
                          <CreditCard className="w-5 h-5 text-primary-400" />
                        </div>
                        <div>
                          <Badge variant="status" status={account.status} className="text-xs mb-1" />
                          <p className="text-xs text-gray-400 font-mono">{maskAccountNumber(account.accountNumber)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mb-3">
                      <p className="text-2xl font-bold text-white">{formatCurrency(account.balanceCents, account.currency)}</p>
                      <p className="text-sm text-gray-400 capitalize">{account.accountType.toLowerCase().replace('_', ' ')} · {account.currency}</p>
                    </div>
                    {account.lockedBalanceCents > 0 && (
                      <div className="pt-3 border-t border-dark-border">
                        <p className="text-xs text-amber-400 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                          Bloqueado: {formatCurrency(account.lockedBalanceCents, account.currency)}
                        </p>
                      </div>
                    )}
                    <div className="mt-4 pt-3 border-t border-dark-border flex items-center justify-between text-xs text-gray-500">
                      <span>Creada: {new Date(account.createdAt).toLocaleDateString('es-ES')}</span>
                      <Eye className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
