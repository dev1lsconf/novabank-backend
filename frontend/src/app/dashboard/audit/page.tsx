"use client";

import { useEffect, useState } from 'react';
import { useAuthStore, useAuditStore } from '@/store';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatRelativeTime } from '@/lib/utils';
import { FileText, Search, Loader2, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

type AuditLog = {
  id: string;
  userId?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
  user?: { id: string; email: string; firstName: string; lastName: string; role: string } | null;
};

export default function AuditPage() {
  const { user } = useAuthStore();
  const { logs, setLogs, isLoading, setLoading, setError, page, setPage, total } = useAuditStore();
  const [search, setSearch] = useState('');

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'AUDITOR' || user?.role === 'GERENTE';

  useEffect(() => {
    if (!isAdmin) return;
    loadAuditLogs();
  }, [isAdmin, page]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const response = await api.getAuditLogs({ page, limit: 20 });
      const data = response.data || response;
      const totalCount = response.meta?.total || data.length;
      setLogs(data, totalCount);
    } catch (error) {
      setError('Error cargando auditoría');
      toast.error('Error cargando logs de auditoría');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(
    (log) =>
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.resource.toLowerCase().includes(search.toLowerCase()) ||
      log.user?.email.toLowerCase().includes(search.toLowerCase()) ||
      log.id.toLowerCase().includes(search.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <Card variant="elevated" className="text-center py-12">
        <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">Acceso Restringido</h3>
        <p className="text-gray-400">Esta sección requiere permisos de auditor</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Auditoría y Cumplimiento</h1>
          <p className="text-gray-400 mt-1">Pista de auditoría inmutable del sistema</p>
        </div>
        <div className="flex gap-3">
          <Input
            placeholder="Buscar en logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
            leftIcon={<Search className="w-5 h-5 text-gray-400" />}
          />
          <Button variant="outline" onClick={loadAuditLogs} loading={isLoading}>
            <Loader2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Logs de Auditoría</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Sin logs de auditoría</h3>
              <p className="text-gray-400">Los logs aparecerán aquí cuando haya actividad en el sistema</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-gray-400 border-b border-dark-border">
                      <th className="pb-3">ID</th>
                      <th className="pb-3">Acción</th>
                      <th className="pb-3">Recurso</th>
                      <th className="pb-3">Usuario</th>
                      <th className="pb-3">IP</th>
                      <th className="pb-3">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="border-b border-dark-border/50 hover:bg-dark-bg/50">
                        <td className="py-3 font-mono text-xs text-gray-400">{log.id.slice(0, 8)}...</td>
                        <td className="py-3">
                          <Badge variant="info">{log.action}</Badge>
                        </td>
                        <td className="py-3 font-medium text-white">{log.resource}</td>
                        <td className="py-3">
                          {log.user ? (
                            <div>
                              <p className="text-sm text-white">{log.user.firstName} {log.user.lastName}</p>
                              <p className="text-xs text-gray-400">{log.user.email}</p>
                            </div>
                          ) : (
                            <span className="text-gray-500">Sistema</span>
                          )}
                        </td>
                        <td className="py-3 text-sm text-gray-400 font-mono">{log.ipAddress || '—'}</td>
                        <td className="py-3 text-sm text-gray-400">{formatRelativeTime(log.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {total > 20 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-dark-border">
                  <p className="text-sm text-gray-400">
                    Página {page} de {Math.ceil(total / 20)} · {total} registros totales
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= Math.ceil(total / 20)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
