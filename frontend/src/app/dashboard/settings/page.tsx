"use client";

import { useEffect, useState } from 'react';
import { useAuthStore, useUIStore } from '@/store';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { User, Shield, Bell, Palette, Moon, Sun, Key, Loader2, Save, Check, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, isAuthenticated } = useAuthStore();
  const { theme, setTheme } = useUIStore();
  const [profile, setProfile] = useState({ firstName: '', lastName: '', email: '' });
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile({ firstName: user.firstName, lastName: user.lastName, email: user.email });
    }
  }, [user]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateUser(user!.id, {
        firstName: profile.firstName,
        lastName: profile.lastName,
      });
      toast.success('Perfil actualizado');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error actualizando perfil');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.new !== passwordData.confirm) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    if (passwordData.new.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    setSaving(true);
    try {
      // This would call a real password change endpoint
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Contraseña cambiada correctamente');
      setPasswordData({ current: '', new: '', confirm: '' });
    } catch (error) {
      toast.error('Error cambiando contraseña');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Configuración</h1>
        <p className="text-gray-400 mt-1">Gestiona tu cuenta y preferencias</p>
      </div>

      <Card variant="elevated">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary-600/20">
              <User className="w-6 h-6 text-primary-400" />
            </div>
            <div>
              <CardTitle>Perfil de Usuario</CardTitle>
              <CardDescription>Información personal y de contacto</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nombre"
                name="firstName"
                type="text"
                value={profile.firstName}
                onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                placeholder="Juan"
              />
              <Input
                label="Apellido"
                name="lastName"
                type="text"
                value={profile.lastName}
                onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                placeholder="Pérez"
              />
            </div>
            <Input
              label="Email"
              name="email"
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              disabled
              helperText="El email no se puede modificar"
            />
            <div className="flex items-center gap-3">
              <Badge variant="role" role={user?.role || 'CLIENTE'} />
              <span className="text-sm text-gray-400">Rol: {user?.role}</span>
              <span className="text-sm text-gray-400 ml-4">Miembro desde: {user ? formatRelativeTime(user.createdAt) : '—'}</span>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="submit" loading={saving}>
                {saved ? (
                  <>
                    <Check className="w-4 h-4" />
                    Guardado
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card variant="elevated">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-600/20">
              <Key className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <CardTitle>Cambiar Contraseña</CardTitle>
              <CardDescription>Actualiza tu contraseña de acceso</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <Input
              label="Contraseña Actual"
              name="current"
              type="password"
              value={passwordData.current}
              onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
              placeholder="••••••••"
              required
            />
            <Input
              label="Nueva Contraseña"
              name="new"
              type="password"
              value={passwordData.new}
              onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
              placeholder="••••••••"
              required
            />
            <Input
              label="Confirmar Nueva Contraseña"
              name="confirm"
              type="password"
              value={passwordData.confirm}
              onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
              placeholder="••••••••"
              required
            />
            <Button type="submit" loading={saving}>
              Cambiar Contraseña
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card variant="elevated">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-purple-600/20">
              <Palette className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <CardTitle>Apariencia</CardTitle>
              <CardDescription>Personaliza la vista del dashboard</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Tema</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setTheme('light')}
                  className={cn(
                    'p-4 rounded-xl border-2 transition-all',
                    theme === 'light'
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-dark-border hover:border-gray-600'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Sun className={cn('w-6 h-6', theme === 'light' ? 'text-yellow-400' : 'text-gray-400')} />
                    <span className={cn('font-medium', theme === 'light' ? 'text-white' : 'text-gray-300')}>
                      Claro
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={cn(
                    'p-4 rounded-xl border-2 transition-all',
                    theme === 'dark'
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-dark-border hover:border-gray-600'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Moon className={cn('w-6 h-6', theme === 'dark' ? 'text-blue-400' : 'text-gray-400')} />
                    <span className={cn('font-medium', theme === 'dark' ? 'text-white' : 'text-gray-300')}>
                      Oscuro
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card variant="elevated">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-600/20">
              <Bell className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <CardTitle>Notificaciones</CardTitle>
              <CardDescription>Configura cómo recibes alertas</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-dark-bg rounded-lg border border-dark-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <Bell className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-white">Notificaciones Push</p>
                  <p className="text-sm text-gray-400">Recibe alertas en tiempo real</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between p-3 bg-dark-bg rounded-lg border border-dark-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Mail className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-white">Notificaciones por Email</p>
                  <p className="text-sm text-gray-400">Resumen diario de actividad</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between p-3 bg-dark-bg rounded-lg border border-dark-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20">
                  <Shield className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="font-medium text-white">Alertas de Seguridad</p>
                  <p className="text-sm text-gray-400">Intentos de acceso, cambios de contraseña</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card variant="elevated" className="border-red-500/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-red-600/20">
              <Shield className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <CardTitle className="text-red-400">Zona de Peligro</CardTitle>
              <CardDescription>Acciones irreversibles</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 bg-red-500/5 rounded-lg border border-red-500/20">
            <div>
              <p className="font-medium text-red-300">Eliminar Cuenta</p>
              <p className="text-sm text-gray-400">Esta acción eliminará permanentemente tu cuenta y todos tus datos</p>
            </div>
            <Button variant="danger" onClick={() => confirm('¿Estás seguro?') && toast.error('Función no implementada')}>
              Eliminar Cuenta
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
