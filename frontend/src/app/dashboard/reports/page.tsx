"use client";

import { useAuthStore } from '@/store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import { BarChart3, FileText, Download, Loader2, Calendar, DollarSign, TrendingUp, Users } from 'lucide-react';
import toast from 'react-hot-toast';

type ReportData = {
  totalUsers: number;
  totalAccounts: number;
  totalBalance: number;
  totalTransactions: number;
  totalVolume: number;
  byCurrency: Record<string, { count: number; volume: number }>;
  byStatus: Record<string, number>;
  recentActivity: Array<{ date: string; count: number; volume: number }>;
};

export default function ReportsPage() {
  const { user } = useAuthStore();
  const [report, setReport] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'GERENTE' || user?.role === 'AUDITOR';

  useEffect(() => {
    if (!isAdmin) return;
    generateReport();
  }, [isAdmin]);

  const generateReport = async () => {
    setIsLoading(true);
    try {
      // This would call a real reporting endpoint
      // For now, we simulate a report
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setReport({
        totalUsers: 156,
        totalAccounts: 342,
        totalBalance: 1250000000,
        totalTransactions: 8934,
        totalVolume: 4560000000,
        byCurrency: {
          EUR: { count: 234, volume: 2100000000 },
          USD: { count: 89, volume: 1450000000 },
          GBP: { count: 19, volume: 560000000 },
        },
        byStatus: {
          COMPLETADA: 8234,
          PENDIENTE: 456,
          FALLIDA: 123,
          CANCELADA: 89,
          REVERTIDA: 32,
        },
        recentActivity: [
          { date: '2026-01-15', count: 234, volume: 45000000 },
          { date: '2026-01-14', count: 189, volume: 38000000 },
          { date: '2026-01-13', count: 267, volume: 52000000 },
          { date: '2026-01-12', count: 198, volume: 41000000 },
          { date: '2026-01-11', count: 245, volume: 47000000 },
          { date: '2026-01-10', count: 156, volume: 32000000 },
          { date: '2026-01-09', count: 312, volume: 58000000 },
        ],
      });
    } catch (error) {
      toast.error('Error generando reporte');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    setGenerating(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success(`Reporte ${format.toUpperCase()} generado`);
    } catch (error) {
      toast.error('Error exportando reporte');
    } finally {
      setGenerating(false);
    }
  };

  if (!isAdmin) {
    return (
      <Card variant="elevated" className="text-center py-12">
        <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">Acceso Restringido</h3>
        <p className="text-gray-400">Esta sección requiere permisos de gerente o auditor</p>
      </Card>
    );
  }

  if (!report) {
    return (
      <Card variant="elevated" className="text-center py-12">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Generando reporte...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Reportes y Analítica</h1>
          <p className="text-gray-400 mt-1">Visión general del negocio bancario</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => handleExport('csv')} loading={generating}>
            <Download className="w-4 h-4" />
            CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport('pdf')} loading={generating}>
            <FileText className="w-4 h-4" />
            PDF
          </Button>
          <Button onClick={generateReport} loading={isLoading}>
            <Loader2 className="w-4 h-4" />
            Actualizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="elevated">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Usuarios Totales</p>
                <p className="text-2xl font-bold text-white mt-1">{report.totalUsers.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="elevated">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Cuentas Activas</p>
                <p className="text-2xl font-bold text-white mt-1">{report.totalAccounts.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-green-500/10">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="elevated">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Saldo Total</p>
                <p className="text-2xl font-bold text-white mt-1">{formatCurrency(report.totalBalance)}</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-500/10">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="elevated">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Volumen Transacciones</p>
                <p className="text-2xl font-bold text-white mt-1">{formatCurrency(report.totalVolume)}</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10">
                <BarChart3 className="w-6 h-6 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Transacciones por Moneda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(report.byCurrency).map(([currency, data]) => (
                <div key={currency} className="flex items-center justify-between p-3 bg-dark-bg rounded-lg border border-dark-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-600/20 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-primary-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{currency}</p>
                      <p className="text-xs text-gray-400">{data.count} transacciones</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-white">{formatCurrency(data.volume)}</p>
                    <p className="text-xs text-gray-400">
                      {((data.volume / report.totalVolume) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Transacciones por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(report.byStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between p-3 bg-dark-bg rounded-lg border border-dark-border">
                  <div className="flex items-center gap-3">
                    <Badge variant="status" status={status} className="text-xs" />
                    <span className="text-white">{status}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-white">{count.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">
                      {((count / report.totalTransactions) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Actividad Reciente (Últimos 7 días)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-dark-border">
                  <th className="pb-3">Fecha</th>
                  <th className="pb-3 text-right">Transacciones</th>
                  <th className="pb-3 text-right">Volumen</th>
                  <th className="pb-3 text-right">Promedio</th>
                </tr>
              </thead>
              <tbody>
                {report.recentActivity.map((day) => (
                  <tr key={day.date} className="border-b border-dark-border/50 hover:bg-dark-bg/50">
                    <td className="py-3 font-medium text-white">{new Date(day.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</td>
                    <td className="py-3 text-right text-white">{day.count.toLocaleString()}</td>
                    <td className="py-3 text-right text-white">{formatCurrency(day.volume)}</td>
                    <td className="py-3 text-right text-gray-400">{formatCurrency(day.count > 0 ? Math.round(day.volume / day.count) : 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
