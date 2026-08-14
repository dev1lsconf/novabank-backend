"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  CreditCard,
  ArrowRightLeft,
  Wallet,
  TrendingUp,
  Shield,
  Users,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Home,
  Building2,
  FileText,
  Bell,
} from 'lucide-react';
import { useUIStore } from '@/store';
import { useAuthStore } from '@/store';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Cuentas', href: '/dashboard/accounts', icon: CreditCard },
  { name: 'Transferencias', href: '/dashboard/transfers', icon: ArrowRightLeft },
  { name: 'Tarjetas', href: '/dashboard/cards', icon: Wallet },
  { name: 'Forex', href: '/dashboard/forex', icon: TrendingUp },
  { name: 'Operaciones', href: '/dashboard/operations', icon: Building2 },
];

const adminNavigation = [
  { name: 'Usuarios', href: '/dashboard/users', icon: Users },
  { name: 'Auditoría', href: '/dashboard/audit', icon: Shield },
  { name: 'Reportes', href: '/dashboard/reports', icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar, theme } = useUIStore();
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) return null;

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'GERENTE' || user?.role === 'AUDITOR';

  return (
    <>
      <button
        onClick={toggleSidebar}
        className={cn(
          'fixed top-4 left-4 z-50 p-2 rounded-lg bg-dark-card border border-dark-border',
          'hover:bg-dark-border transition-colors',
          'lg:hidden'
        )}
        aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
      >
        {sidebarOpen ? <ChevronLeft className="w-5 h-5 text-white" /> : <ChevronRight className="w-5 h-5 text-white" />}
      </button>

      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-screen bg-dark-card border-r border-dark-border transition-all duration-300',
          'flex flex-col',
          sidebarOpen ? 'w-64 lg:w-64' : 'w-20 lg:w-20',
          'lg:translate-x-0'
        )}
        aria-label="Navegación principal"
      >
        <div className={cn('flex items-center justify-between h-16 px-4 border-b border-dark-border', !sidebarOpen && 'justify-center')}>
          <Link href="/dashboard" className="flex items-center gap-2" aria-label="NovaBank Dashboard">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            {sidebarOpen && (
              <span className="font-bold text-xl text-white">NovaBank</span>
            )}
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Menú principal">
          <div className={cn('px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider', !sidebarOpen && 'hidden')}>
            Principal
          </div>
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                  'group',
                  isActive
                    ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30'
                    : 'text-gray-400 hover:bg-dark-border hover:text-white',
                  !sidebarOpen && 'justify-center'
                )}
                aria-current={isActive ? 'page' : undefined}
                title={sidebarOpen ? undefined : item.name}
              >
                <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                {sidebarOpen && <span className="font-medium">{item.name}</span>}
              </Link>
            );
          })}

          {isAdmin && (
            <>
              <div className={cn('px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4', !sidebarOpen && 'hidden')}>
                Administración
              </div>
              {adminNavigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                      'group',
                      isActive
                        ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30'
                        : 'text-gray-400 hover:bg-dark-border hover:text-white',
                      !sidebarOpen && 'justify-center'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                    title={sidebarOpen ? undefined : item.name}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                    {sidebarOpen && <span className="font-medium">{item.name}</span>}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        <div className={cn('p-3 border-t border-dark-border', !sidebarOpen && 'hidden')}>
          <Link
            href="/dashboard/settings"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
              'text-gray-400 hover:bg-dark-border hover:text-white'
            )}
          >
            <Settings className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            <span className="font-medium">Configuración</span>
          </Link>
        </div>

        <div className={cn('p-3', !sidebarOpen && 'hidden')}>
          <button
            onClick={() => useAuthStore.getState().logout()}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 w-full',
              'text-red-400 hover:bg-red-500/10 hover:text-red-300'
            )}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            <span className="font-medium">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      <div
        className={cn(
          'fixed inset-0 z-30 bg-black/50 transition-opacity duration-300 lg:hidden',
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={toggleSidebar}
        aria-hidden="true"
      />
    </>
  );
}
