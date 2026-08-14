"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useAccountsStore } from '@/store';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ArrowLeft, Plus, Send, Loader2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { generateIdempotencyKey } from '@/lib/utils';

export default function NewTransferPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { accounts } = useAccountsStore();
  const [submitting, setSubmitting] = useState(false);
  const [accountsList, setAccountsList] = useState<Array<{ id: string; accountNumber: string; balanceCents: number; currency: string }>>([]);
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
    if (!user) {
      router.push('/login');
      return;
    }
    loadAccounts();
  }, [user, router]);

  const loadAccounts = async () => {
    try {
      const response = await api.getAccounts();
      const data = response.data || response;
      const active = data.filter((a: any) => a.status === 'ACTIVA');
      setAccountsList(active);
      if (active.length > 0 && !formData.fromAccountId) {
        setFormData((prev) => ({ ...prev, fromAccountId: active[0].id }));
      }
    } catch (error) {
      toast.error('Error cargando cuentas');
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
      router.push('/dashboard/transfers');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error en transferencia');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard/transfers" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Volver a Transferencias
        </Link>
      </div>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Nueva Transferencia</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select
              label="Cuenta Origen"
              options={accountsList.map((a) => ({
                value: a.id,
                label: `${a.accountNumber} - ${a.currency}`,
              }))}
              value={formData.fromAccountId}
              onChange={(e) => setFormData({ ...formData, fromAccountId: e.target.value })}
              error={errors.fromAccountId}
            />
            <Input
              label="Cuenta Destino"
              name="toAccountNumber"
              value={formData.toAccountNumber}
              onChange={(e) => setFormData({ ...formData, toAccountNumber: e.target.value })}
              error={errors.toAccountNumber}
              placeholder="IBAN / número de cuenta"
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
              label="Concepto"
              name="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Concepto opcional"
            />
            <CardFooter className="justify-between">
              <Link href="/dashboard/transfers">
                <Button variant="secondary">Cancelar</Button>
              </Link>
              <Button type="submit" loading={submitting}>
                <Send className="w-4 h-4" />
                Enviar
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}