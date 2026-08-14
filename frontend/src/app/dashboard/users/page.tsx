"use client";

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatRelativeTime } from '@/lib/utils';
import { Users, Search, Loader2, Shield, UserCheck, UserX, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

type UserItem = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export default function UsersPage() {
  const { user } = useAuthStore();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'GERENTE' || user?.role === 'AUDITOR';

  useEffect(() => {
    if (!isAdmin) return;
    loadUsers();
  }, [isAdmin]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await api.getUsers({ limit: 100 });
      const data = response.data || response;
      setUsers(data);
    } catch (error) {
      toast.error('Error cargando usuarios');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.firstName.toLowerCase().includes(search.toLowerCase()) ||
      u.lastName.toLowerCase().includes(search.toLowerCase()) ||
      u.nationalId.toLowerCase().includes(search.toLowerCase())
  );

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await api.updateUser(id, { status: newStatus });
      toast.success('Usuario actualizado');
      loadUsers();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error actualizando usuario');
    }
  };

  if (!isAdmin) {
    return (
      <Card variant="elevated" className="text-center py-12">
        <Shield className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">Acceso Restringido</h3>
        <p className="text-gray-400">Esta sección requiere permisos de administrador</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestión de Usuarios</h1>
          <p className="text-gray-400 mt-1">Administra los usuarios del sistema</p>
        </div>
        <div className="flex gap-3">
          <Input
            placeholder="Buscar usuarios..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
            leftIcon={<Search className="w-5 h-5 text-gray-400" />}
          />
        </div>
      </div>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Usuarios Registrados</CardTitle>
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
                    <th className="pb-3">Usuario</th>
                    <th className="pb-3">Email</th>
                    <th className="pb-3">DNI</th>
                    <th className="pb-3">Rol</th>
                    <th className="pb-3">Estado</th>
                    <th className="pb-3">Creado</th>
                    <th className="pb-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="border-b border-dark-border/50 hover:bg-dark-bg/50">
                      <td className="py-3">
                        <div>
                          <p className="font-medium text-white">{u.firstName} {u.lastName}</p>
                          <p className="text-xs text-gray-400">ID: {u.id.slice(0, 8)}...</p>
                        </div>
                      </td>
                      <td className="py-3 text-gray-300">{u.email}</td>
                      <td className="py-3 font-mono text-sm text-gray-400">{u.nationalId}</td>
                      <td className="py-3"><Badge variant="role" role={u.role} /></td>
                      <td className="py-3">
                        <Badge variant="status" status={u.status} />
                      </td>
                      <td className="py-3 text-sm text-gray-400">{formatRelativeTime(u.createdAt)}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          {u.status !== 'ACTIVO' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusChange(u.id, 'ACTIVO')}
                              className="text-green-400 hover:text-green-300"
                            >
                              <UserCheck className="w-4 h-4" />
                            </Button>
                          )}
                          {u.status !== 'BLOQUEADO' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusChange(u.id, 'BLOQUEADO')}
                              className="text-red-400 hover:text-red-300"
                            >
                              <UserX className="w-4 h-4" />
                            </Button>
                          )}
                          {u.status !== 'INACTIVO' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusChange(u.id, 'INACTIVO')}
                              className="text-gray-400 hover:text-gray-300"
                            >
                              <UserPlus className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
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
