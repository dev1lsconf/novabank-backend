"use client";

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectOption } from '@/components/ui/Select';
import { formatCurrency, formatRelativeTime, generateIdempotencyKey } from '@/lib/utils';
import { Plus, ArrowRightLeft, Search, Filter, Send, Loader2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

type Transfer = {
  id: string;
  referenceCode: string;
  type: string;
  status: string;
  amountCents: number;
  currency: string;
  description: string;
  createdAt: string;
  fromAccount?: { accountNumber: string };
  toAccount?: { accountNumber: string };
};

export default function TransfersPage() {
  const { user } = useAuthStore();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [accounts, setAccounts] = useState<Array<{ id: string; accountNumber: string; balanceCents: number; currency: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fromAccountId: '',
    toAccountNumber: '',
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
      const [transfersRes, accountsRes] = await Promise.allSettled([
        api.getTransfers({ limit: 50 }),
        api.getAccounts(),
      ]);

      if (transfersRes.status === 'fulfilled') {
        const data = transfersRes.value.data || transfersRes.value;
        setTransfers(data);
      }
      if (accountsRes.status === 'fulfilled') {
        const data = accountsRes.value.data || accountsRes.value;
        setAccounts(data.filter((a: any) => a.status === 'ACTIVA'));
      }
    } catch (error) {
      toast.error('Error cargando transferencias');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!formData.fromAccountId) newErrors.fromAccountId = 'Selecciona cuenta origen';
    if (!formData.toAccountNumber) newErrors.toAccountNumber = 'Cuenta destino requerida';
    if (!formData.amountCents || parseInt(formData.amountCents) <= 0) newErrors.amountCents = 'Monto inválido';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true);
    try {
      await api.createTransfer({
        fromAccountId: formData.fromAccountId,
        toAccountNumber: formData.toAccountNumber,
        amountCents: parseInt(formData.amountCents),
        currency: formData.currency,
        description: formData.description,
        idempotencyKey: formData.idempotencyKey,
      });
      toast.success('Transferencia realizada');
      setShowModal(false);
      setFormData({ ...formData, amountCents: '', description: '', idempotencyKey: generateIdempotencyKey() });
      loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error en transferencia');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Transferencias</h1>
          <p className="text-gray-400 mt-1">Envía y recibe dinero de forma segura</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" />
          Nueva Transferencia
        </Button>
      </div>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Historial de Transferencias</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : transfers.length === 0 ? (
            <div className="text-center py-12">
              <ArrowRightLeft className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Sin transferencias</h3>
              <p className="text-gray-400 mb-6">Tu historial de transferencias aparecerá aquí</p>
              <Button onClick={() => setShowModal(true)}>
                <Plus className="w-4 h-4" />
                Realizar Transferencia
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b border-dark-border">
                    <th className="pb-3">Referencia</th>
                    <th className="pb-3">Cuentas</th>
                    <th className="pb-3">Importe</th>
                    <th className="pb-3">Estado</th>
                    <th className="pb-3">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.map((tx) => (
                    <tr key={tx.id} className="border-b border-dark-border/50 hover:bg-dark-bg/50">
                      <td className="py-3 font-mono text-sm text-white">{tx.referenceCode}</td>
                      <td className="py-3">
                        <div className="text-sm">
                          <p className="text-white">{tx.fromAccount?.accountNumber || '—'}</p>
                          <p className="text-gray-400">{tx.toAccount?.accountNumber || '—'}</p>
                        </div>
                      </td>
                      <td className="py-3 font-medium text-white">{formatCurrency(tx.amountCents, tx.currency)}</td>
                      <td className="py-3"><Badge variant="status" status={tx.status} /></td>
                      <td className="py-3 text-sm text-gray-400">{formatRelativeTime(tx.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <Card variant="elevated" className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Nueva Transferencia</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Select
                  label="Cuenta Origen"
                  options={accounts.map((a) => ({
                    value: a.id,
                    label: `${a.accountNumber} - ${formatCurrency(a.balanceCents, a.currency)}`,
                  }))}
                  placeholder="Selecciona cuenta"
                  value={formData.fromAccountId}
                  onChange={(e) => setFormData({ ...formData, fromAccountId: e.target.value })}
                  error={errors.fromAccountId}
                />
                <Input
                  label="Cuenta Destino (IBAN/Numero)"
                  name="toAccountNumber"
                  type="text"
                  value={formData.toAccountNumber}
                  onChange={(e) => setFormData({ ...formData, toAccountNumber: e.target.value })}
                  error={errors.toAccountNumber}
                  placeholder="ES12 3456 7890 1234 5678 9012"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Importe"
                    name="amountCents"
                    type="number"
                    value={formData.amountCents}
                    onChange={(e) => setFormData({ ...formData, amountCents: e.target.value })}
                    error={errors.amountCents}
                    placeholder="10000"
                  />
                  <Select
                    label="Moneda"
                    options={[
                      { value: 'EUR', label: 'EUR' },
                      { value: 'USD', label: 'USD' },
                      { value: 'GBP', label: 'GBP' },
                    ]}
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  />
                </div>
                <Input
                  label="Concepto (opcional)"
                  name="description"
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Pago factura, alquiler, etc."
                />
                <div className="flex gap-3 pt-4">
                  <Button variant="secondary" type="button" onClick={() => setShowModal(false)} className="flex-1">
                    Cancelar
                  </Button>
                  <Button type="submit" loading={submitting} className="flex-1">
                    <Send className="w-4 h-4" />
                    Enviar
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
