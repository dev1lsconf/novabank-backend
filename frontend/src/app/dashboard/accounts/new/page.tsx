"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useAccountsStore } from '@/store';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ArrowLeft, Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function NewAccountPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ accountType: 'AHORRO', currency: 'EUR' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) router.push('/login');
  }, [user, router]);

  const accountTypes = [
    { value: 'AHORRO', label: 'Cuenta de Ahorro' },
    { value: 'CORRIENTE', label: 'Cuenta Corriente' },
    { value: 'PLAZO_FIJO', label: 'Plazo Fijo' },
    { value: 'INVERSION', label: 'Cuenta de Inversión' },
  ];
  const currencies = [
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'USD', label: 'USD - Dólar Estadounidense' },
    { value: 'GBP', label: 'GBP - Libra Esterlina' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!formData.accountType) newErrors.accountType = 'Tipo de cuenta requerido';
    if (!formData.currency) newErrors.currency = 'Moneda requerida';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true);
    try {
      await api.createAccount({ accountType: formData.accountType, currency: formData.currency });
      toast.success('Cuenta creada exitosamente');
      router.push('/dashboard/accounts');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error creando cuenta');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard/accounts" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Volver a Cuentas
        </Link>
      </div>
      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Crear Nueva Cuenta</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Select label="Tipo de Cuenta" options={accountTypes} value={formData.accountType} onChange={(e) => setFormData({ ...formData, accountType: e.target.value })} error={errors.accountType} />
            <Select label="Moneda" options={currencies} value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })} error={errors.currency} />
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <h4 className="text-sm font-medium text-blue-400 mb-2">Información importante</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• La cuenta se creará con saldo inicial de 0</li>
                <li>• Recibirás un número de cuenta único</li>
                <li>• Podrás realizar depósitos y transferencias inmediatamente</li>
              </ul>
            </div>
            <CardFooter className="justify-between">
              <Link href="/dashboard/accounts"><Button variant="secondary">Cancelar</Button></Link>
              <Button type="submit" loading={submitting}><Plus className="w-4 h-4" /> Crear Cuenta</Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}