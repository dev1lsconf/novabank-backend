"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ArrowLeft, Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function NewCardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);
  const [accounts, setAccounts] = useState<Array<{ id: string; accountNumber: string; balanceCents: number; currency: string }>>([]);
  const [formData, setFormData] = useState({
    accountId: '',
    cardType: 'DEBITO',
    dailyLimitCents: '500000',
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
    if (!formData.accountId) newErrors.accountId = 'Selecciona una cuenta';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true);
    try {
      await api.createCard({
        accountId: formData.accountId,
        cardType: formData.cardType,
        dailyLimitCents: parseInt(formData.dailyLimitCents),
      });
      toast.success('Tarjeta creada');
      router.push('/dashboard/cards');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error creando tarjeta');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard/cards" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Volver a Tarjetas
        </Link>
      </div>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Nueva Tarjeta</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select
              label="Cuenta Asociada"
              options={accounts.map((a) => ({
                value: a.id,
                label: `${a.accountNumber} - ${a.currency}`,
              }))}
              value={formData.accountId}
              onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
              error={errors.accountId}
            />
            <Select
              label="Tipo de Tarjeta"
              options={[
                { value: 'DEBITO', label: 'Débito' },
                { value: 'CREDITO', label: 'Crédito' },
                { value: 'PREPAGO', label: 'Prepago' },
              ]}
              value={formData.cardType}
              onChange={(e) => setFormData({ ...formData, cardType: e.target.value })}
            />
            <Input
              label="Límite Diario (centavos)"
              name="dailyLimitCents"
              type="number"
              value={formData.dailyLimitCents}
              onChange={(e) => setFormData({ ...formData, dailyLimitCents: e.target.value })}
            />
            <CardFooter className="justify-between">
              <Link href="/dashboard/cards">
                <Button variant="secondary">Cancelar</Button>
              </Link>
              <Button type="submit" loading={submitting}>
                <Plus className="w-4 h-4" />
                Crear Tarjeta
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}