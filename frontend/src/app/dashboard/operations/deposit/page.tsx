"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ArrowLeft, ArrowDownToLine, Loader2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { generateIdempotencyKey } from '@/lib/utils';

export default function DepositPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);
  const [accounts, setAccounts] = useState<Array<{ id: string; accountNumber: string; balanceCents: number; currency: string }>>([]);
  const [formData, setFormData] = useState({
    accountId: '',
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
      setAccounts(active);
      if (active.length > 0 && !formData.accountId) {
        setFormData((prev) => ({ ...prev, accountId: active[0].id }));
      }
    } catch (error) {
      toast.error('Error cargando cuentas');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!formData.accountId) newErrors.accountId = 'Selecciona cuenta';
    if (!formData.amountCents || parseInt(formData.amountCents) <= 0) newErrors.amountCents = 'Monto inválido';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true);
    try {
      await api.deposit({
        accountId: formData.accountId,
        amountCents: parseInt(formData.amountCents),
        currency: formData.currency,
        description: formData.description,
        idempotencyKey: formData.idempotencyKey,
      });
      toast.success('Depósito realizado');
      router.push('/dashboard/operations');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error en depósito');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard/operations" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Volver a Operaciones
        </Link>
      </div>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Depósito en Ventanilla</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select
              label="Cuenta"
              options={accounts.map((a) => ({
                value: a.id,
                label: `${a.accountNumber} - ${a.currency}`,
              }))}
              value={formData.accountId}
              onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
              error={errors.accountId}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Importe (centavos)"
                name="amountCents"
                type="number"
                value={formData.amountCents}
                onChange={(e) => setFormData({ ...formData, amountCents: e.target.value })}
                error={errors.amountCents}
              />
              <Select
                label="Moneda"
                options={[
                  { value: 'EUR', label: 'EUR' },
                  { value: 'USD', label: 'USD' },
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
              placeholder="Depósito en efectivo"
            />
            <CardFooter className="justify-between">
              <Link href="/dashboard/operations">
                <Button variant="secondary">Cancelar</Button>
              </Link>
              <Button type="submit" loading={submitting}>
                <ArrowDownToLine className="w-4 h-4" />
                Depositar
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}