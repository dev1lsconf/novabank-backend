"use client";

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { formatCurrency, maskCardNumber } from '@/lib/utils';
import { Plus, CreditCard, Lock, Unlock, Trash2, Eye, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

type CardItem = {
  id: string;
  accountId: string;
  maskedPan: string;
  panHash: string;
  cardType: string;
  expirationDate: string;
  status: string;
  dailyLimitCents: number;
  createdAt: string;
};

export default function CardsPage() {
  const { user } = useAuthStore();
  const [cards, setCards] = useState<CardItem[]>([]);
  const [accounts, setAccounts] = useState<Array<{ id: string; accountNumber: string; balanceCents: number; currency: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    accountId: '',
    cardType: 'DEBITO',
    dailyLimitCents: '500000',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [cardsRes, accountsRes] = await Promise.allSettled([
        api.getCards(),
        api.getAccounts(),
      ]);

      if (cardsRes.status === 'fulfilled') {
        const data = cardsRes.value.data || cardsRes.value;
        setCards(data);
      }
      if (accountsRes.status === 'fulfilled') {
        const data = accountsRes.value.data || accountsRes.value;
        setAccounts(data.filter((a: any) => a.status === 'ACTIVA'));
      }
    } catch (error) {
      toast.error('Error cargando tarjetas');
    } finally {
      setIsLoading(false);
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
      toast.success('Tarjeta creada correctamente');
      setShowModal(false);
      setFormData({ accountId: '', cardType: 'DEBITO', dailyLimitCents: '500000' });
      loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error creando tarjeta');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFreeze = async (id: string) => {
    setActionLoading(id);
    try {
      await api.freezeCard(id);
      toast.success('Tarjeta bloqueada');
      loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error bloqueando tarjeta');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnfreeze = async (id: string) => {
    setActionLoading(id);
    try {
      await api.unfreezeCard(id);
      toast.success('Tarjeta desbloqueada');
      loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error desbloqueando tarjeta');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('¿Estás seguro de cancelar esta tarjeta? Esta acción no se puede deshacer.')) return;
    setActionLoading(id);
    try {
      await api.cancelCard(id);
      toast.success('Tarjeta cancelada');
      loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error cancelando tarjeta');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Tarjetas Bancarias</h1>
          <p className="text-gray-400 mt-1">Gestiona tus tarjetas de débito y crédito</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" />
          Nueva Tarjeta
        </Button>
      </div>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Tus Tarjetas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : cards.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No tienes tarjetas</h3>
              <p className="text-gray-400 mb-6">Solicita tu primera tarjeta bancaria</p>
              <Button onClick={() => setShowModal(true)}>
                <Plus className="w-4 h-4" />
                Solicitar Tarjeta
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cards.map((card) => (
                <div key={card.id} className="p-5 bg-dark-bg rounded-xl border border-dark-border relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl bg-primary-600/20">
                      <CreditCard className="w-5 h-5 text-primary-400" />
                    </div>
                    <Badge variant="status" status={card.status} />
                  </div>
                  <div className="mb-4">
                    <p className="text-xl font-bold text-white font-mono tracking-wider">{maskCardNumber(card.maskedPan)}</p>
                    <p className="text-sm text-gray-400 capitalize">{card.cardType.toLowerCase()} · Expira: {card.expirationDate}</p>
                  </div>
                  <div className="mb-4 text-sm text-gray-400">
                    <p>Límite diario: {formatCurrency(card.dailyLimitCents, 'EUR')}</p>
                  </div>
                  <div className="flex gap-2">
                    {card.status === 'ACTIVA' ? (
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => handleFreeze(card.id)} loading={actionLoading === card.id}>
                        <Lock className="w-4 h-4" />
                        Bloquear
                      </Button>
                    ) : card.status === 'BLOQUEADA' ? (
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => handleUnfreeze(card.id)} loading={actionLoading === card.id}>
                        <Unlock className="w-4 h-4" />
                        Desbloquear
                      </Button>
                    ) : null}
                    <Button variant="outline" size="sm" className="flex-1 text-red-400 hover:text-red-300 hover:border-red-500/50" onClick={() => handleCancel(card.id)} loading={actionLoading === card.id}>
                      <Trash2 className="w-4 h-4" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <Card variant="elevated" className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Nueva Tarjeta</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Select
                  label="Cuenta Asociada"
                  options={accounts.map((a) => ({
                    value: a.id,
                    label: `${a.accountNumber} - ${formatCurrency(a.balanceCents, a.currency)}`,
                  }))}
                  placeholder="Selecciona cuenta"
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
                  placeholder="500000"
                />
                <div className="flex gap-3 pt-4">
                  <Button variant="secondary" type="button" onClick={() => setShowModal(false)} className="flex-1">
                    Cancelar
                  </Button>
                  <Button type="submit" loading={submitting} className="flex-1">
                    Crear Tarjeta
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
