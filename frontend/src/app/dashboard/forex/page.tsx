"use client";

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, ArrowRightLeft, RotateCcw, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

type Rate = {
  id: string;
  baseCurrency: string;
  targetCurrency: string;
  rate: number;
  updatedAt: string;
};

export default function ForexPage() {
  const { user } = useAuthStore();
  const [rates, setRates] = useState<Rate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [showConverter, setShowConverter] = useState(false);
  const [conversion, setConversion] = useState({
    fromCurrency: 'EUR',
    toCurrency: 'USD',
    amount: '100',
  });
  const [result, setResult] = useState<{ converted: number; rate: number } | null>(null);

  const currencies = ['EUR', 'USD', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'CNY'];

  useEffect(() => {
    loadRates();
  }, []);

  const loadRates = async () => {
    try {
      setIsLoading(true);
      const response = await api.getExchangeRates();
      const data = response.data || response;
      setRates(data);
    } catch (error) {
      toast.error('Error cargando tipos de cambio');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    setConverting(true);
    try {
      const response = await api.convertCurrency({
        fromCurrency: conversion.fromCurrency,
        toCurrency: conversion.toCurrency,
        amount: parseFloat(conversion.amount),
      });
      setResult({
        converted: response.convertedAmount,
        rate: response.rate,
      });
      toast.success('Conversión realizada');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error en conversión');
    } finally {
      setConverting(false);
    }
  };

  const swapCurrencies = () => {
    setConversion((prev) => ({
      ...prev,
      fromCurrency: prev.toCurrency,
      toCurrency: prev.fromCurrency,
    }));
    setResult(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Mercado Forex</h1>
          <p className="text-gray-400 mt-1">Tipos de cambio en tiempo real</p>
        </div>
        <Button variant="outline" onClick={() => setShowConverter(!showConverter)}>
          <TrendingUp className="w-4 h-4" />
          Conversor
        </Button>
      </div>

      {showConverter && (
        <Card variant="elevated" className="mb-6">
          <CardHeader>
            <CardTitle>Conversor de Divisas</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleConvert} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  label="De"
                  options={currencies.map((c) => ({ value: c, label: c }))}
                  value={conversion.fromCurrency}
                  onChange={(e) => setConversion({ ...conversion, fromCurrency: e.target.value })}
                />
                <div className="flex items-center">
                  <Button type="button" variant="ghost" size="sm" onClick={swapCurrencies} className="h-10">
                    <RotateCcw className="w-5 h-5" />
                  </Button>
                </div>
                <Select
                  label="A"
                  options={currencies.map((c) => ({ value: c, label: c }))}
                  value={conversion.toCurrency}
                  onChange={(e) => setConversion({ ...conversion, toCurrency: e.target.value })}
                />
              </div>
              <Input
                label="Cantidad"
                name="amount"
                type="number"
                step="0.01"
                value={conversion.amount}
                onChange={(e) => setConversion({ ...conversion, amount: e.target.value })}
                placeholder="100"
              />
              <Button type="submit" className="w-full" loading={converting}>
                <ArrowRightLeft className="w-4 h-4" />
                Convertir
              </Button>
              {result && (
                <div className="p-4 bg-dark-bg rounded-lg border border-dark-border">
                  <p className="text-sm text-gray-400">Resultado</p>
                  <p className="text-2xl font-bold text-green-400">
                    {formatCurrency(Math.round(result.converted * 100), conversion.toCurrency)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Tasa: 1 {conversion.fromCurrency} = {result.rate.toFixed(4)} {conversion.toCurrency}</p>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      )}

      <Card variant="elevated">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Tipos de Cambio</CardTitle>
          <Button variant="ghost" size="sm" onClick={loadRates} loading={isLoading}>
            <Loader2 className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b border-dark-border">
                    <th className="pb-3">Par</th>
                    <th className="pb-3 text-right">Tasa</th>
                    <th className="pb-3 text-right">Compra</th>
                    <th className="pb-3 text-right">Venta</th>
                    <th className="pb-3 text-right">Spread</th>
                    <th className="pb-3 text-right">Actualizado</th>
                  </tr>
                </thead>
                <tbody>
                  {rates.map((rate) => (
                    <tr key={rate.id} className="border-b border-dark-border/50 hover:bg-dark-bg/50">
                      <td className="py-3 font-medium text-white">{rate.baseCurrency}/{rate.targetCurrency}</td>
                      <td className="py-3 text-right font-mono text-white">{rate.rate.toFixed(6)}</td>
                      <td className="py-3 text-right text-green-400">{rate.rate.toFixed(4)}</td>
                      <td className="py-3 text-right text-red-400">{(rate.rate * 1.015).toFixed(4)}</td>
                      <td className="py-3 text-right text-amber-400">{(rate.rate * 0.015).toFixed(4)}</td>
                      <td className="py-3 text-right text-gray-400 text-xs">
                        {new Date(rate.updatedAt).toLocaleString('es-ES')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
