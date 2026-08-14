"use client";

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { formatCurrency, formatRelativeTime, generateIdempotencyKey } from '@/lib/utils';
import { Plus, ArrowDownToLine, ArrowUpFromLine, Building2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

type Operation = {
  id: string;
  referenceCode: string;
  type: string;
  status: string;
  amountCents: number;
  currency: string;
  description: string;
  createdAt: string;
  account?: { accountNumber: string };
};

export default function OperationsPage() {
  const { user } = useAuthStore();
  const [operations, setOperations] = useState<Operation[]>([]);
  const [accounts, setAccounts] = useState<Array<{ id: string; accountNumber: string; balanceCents: number; currency: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [depositForm, setDepositForm] = useState({
    accountId: '',
    amountCents: '',
    currency: 'EUR',
    description: '',
    idempotencyKey: generateIdempotencyKey(),
  });
  const [withdrawForm, setWithdrawForm] = useState({
    accountId: '',
    amountCents: '',
    currency: 'EUR',
    description: '',
    idempotencyKey: generateIdempotencyKey(),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [opsRes, accountsRes] = await Promise.allSettled([
        api.getTransfers({ limit: 50 }),
        api.getAccounts(),
      ]);

      if (opsRes.status === 'fulfilled') {
        const data = opsRes.value.data || opsRes.value;
        setOperations(data.filter((op: any) => op.type === 'DEPOSITO' || op.type === 'RETIRO'));
      }
      if (accountsRes.status === 'fulfilled') {
        const data = accountsRes.value.data || accountsRes.value;
        setAccounts(data.filter((a: any) => a.status === 'ACTIVA'));
      }
    } catch (error) {
      toast.error('Error cargando operaciones');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!depositForm.accountId) newErrors.accountId = 'Selecciona cuenta';
    if (!depositForm.amountCents || parseInt(depositForm.amountCents) <= 0) newErrors.amountCents = 'Monto inválido';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true);
    try {
      await api.deposit({
        accountId: depositForm.accountId,
        amountCents: parseInt(depositForm.amountCents),
        currency: depositForm.currency,
        description: depositForm.description,
        idempotencyKey: depositForm.idempotencyKey,
      });
      toast.success('Depósito realizado');
      setShowDepositModal(false);
      setDepositForm({ ...depositForm, amountCents: '', description: '', idempotencyKey: generateIdempotencyKey() });
      loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error en depósito');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!withdrawForm.accountId) newErrors.accountId = 'Selecciona cuenta';
    if (!withdrawForm.amountCents || parseInt(withdrawForm.amountCents) <= 0) newErrors.amountCents = 'Monto inválido';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true);
    try {
      await api.withdraw({
        accountId: withdrawForm.accountId,
        amountCents: parseInt(withdrawForm.amountCents),
        currency: withdrawForm.currency,
        description: withdrawForm.description,
        idempotencyKey: withdrawForm.idempotencyKey,
      });
      toast.success('Retiro realizado');
      setShowWithdrawModal(false);
      setWithdrawForm({ ...withdrawForm, amountCents: '', description: '', idempotencyKey: generateIdempotencyKey() });
      loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error en retiro');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Operaciones en Ventanilla</h1>
          <p className="text-gray-400 mt-1">Depósitos y retiros en efectivo</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setShowDepositModal(true)}>
            <ArrowDownToLine className="w-4 h-4" />
            Depósito
          </Button>
          <Button variant="outline" onClick={() => setShowWithdrawModal(true)}>
            <ArrowUpFromLine className="w-4 h-4" />
            Retiro
          </Button>
        </div>
      </div>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Historial de Operaciones</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : operations.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Sin operaciones</h3>
              <p className="text-gray-400 mb-6">Tu historial de depósitos y retiros aparecerá aquí</p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => setShowDepositModal(true)}>
                  <ArrowDownToLine className="w-4 h-4" />
                  Depósito
                </Button>
                <Button variant="outline" onClick={() => setShowWithdrawModal(true)}>
                  <ArrowUpFromLine className="w-4 h-4" />
                  Retiro
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b border-dark-border">
                    <th className="pb-3">Referencia</th>
                    <th className="pb-3">Tipo</th>
                    <th className="pb-3">Cuenta</th>
                    <th className="pb-3">Importe</th>
                    <th className="pb-3">Estado</th>
                    <th className="pb-3">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {operations.map((op) => (
                    <tr key={op.id} className="border-b border-dark-border/50 hover:bg-dark-bg/50">
                      <td className="py-3 font-mono text-sm text-white">{op.referenceCode}</td>
                      <td className="py-3">
                        <Badge variant={op.type === 'DEPOSITO' ? 'success' : 'danger'}>{op.type}</Badge>
                      </td>
                      <td className="py-3 font-mono text-sm text-gray-300">{op.account?.accountNumber || '—'}</td>
                      <td className="py-3 font-medium text-white">{formatCurrency(op.amountCents, op.currency)}</td>
                      <td className="py-3"><Badge variant="status" status={op.status} /></td>
                      <td className="py-3 text-sm text-gray-400">{formatRelativeTime(op.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <Card variant="elevated" className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Nuevo Depósito</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleDeposit} className="space-y-4">
                <Select
                  label="Cuenta"
                  options={accounts.map((a) => ({
                    value: a.id,
                    label: `${a.accountNumber} - ${formatCurrency(a.balanceCents, a.currency)}`,
                  }))}
                  placeholder="Selecciona cuenta"
                  value={depositForm.accountId}
                  onChange={(e) => setDepositForm({ ...depositForm, accountId: e.target.value })}
                  error={errors.accountId}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Importe (centavos)"
                    name="amountCents"
                    type="number"
                    value={depositForm.amountCents}
                    onChange={(e) => setDepositForm({ ...depositForm, amountCents: e.target.value })}
                    error={errors.amountCents}
                    placeholder="10000"
                  />
                  <Select
                    label="Moneda"
                    options={[
                      { value: 'EUR', label: 'EUR' },
                      { value: 'USD', label: 'USD' },
                    ]}
                    value={depositForm.currency}
                    onChange={(e) => setDepositForm({ ...depositForm, currency: e.target.value })}
                  />
                </div>
                <Input
                  label="Concepto (opcional)"
                  name="description"
                  type="text"
                  value={depositForm.description}
                  onChange={(e) => setDepositForm({ ...depositForm, description: e.target.value })}
                  placeholder="Depósito en efectivo"
                />
                <div className="flex gap-3 pt-4">
                  <Button variant="secondary" type="button" onClick={() => setShowDepositModal(false)} className="flex-1">
                    Cancelar
                  </Button>
                  <Button type="submit" loading={submitting} className="flex-1">
                    <ArrowDownToLine className="w-4 h-4" />
                    Depositar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <Card variant="elevated" className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Nuevo Retiro</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleWithdraw} className="space-y-4">
                <Select
                  label="Cuenta"
                  options={accounts.map((a) => ({
                    value: a.id,
                    label: `${a.accountNumber} - ${formatCurrency(a.balanceCents, a.currency)}`,
                  }))}
                  placeholder="Selecciona cuenta"
                  value={withdrawForm.accountId}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, accountId: e.target.value })}
                  error={errors.accountId}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Importe (centavos)"
                    name="amountCents"
                    type="number"
                    value={withdrawForm.amountCents}
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, amountCents: e.target.value })}
                    error={errors.amountCents}
                    placeholder="10000"
                  />
                  <Select
                    label="Moneda"
                    options={[
                      { value: 'EUR', label: 'EUR' },
                      { value: 'USD', label: 'USD' },
                    ]}
                    value={withdrawForm.currency}
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, currency: e.target.value })}
                  />
                </div>
                <Input
                  label="Concepto (opcional)"
                  name="description"
                  type="text"
                  value={withdrawForm.description}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, description: e.target.value })}
                  placeholder="Retiro en efectivo"
                />
                <div className="flex gap-3 pt-4">
                  <Button variant="secondary" type="button" onClick={() => setShowWithdrawModal(false)} className="flex-1">
                    Cancelar
                  </Button>
                  <Button type="submit" loading={submitting} className="flex-1" variant="danger">
                    <ArrowUpFromLine className="w-4 h-4" />
                    Retirar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
