"use client";

import { Bell, Moon, Sun, User, LogOut, ChevronDown } from 'lucide-react';
import { useAuthStore, useUIStore } from '@/store';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';

export function Header() {
  const { user, logout } = useAuthStore();
  const { theme, setTheme, notifications, removeNotification } = useUIStore();

  return (
    <header className="fixed top-0 right-0 h-16 bg-dark-card/80 backdrop-blur-sm border-b border-dark-border z-30 transition-all duration-300 lg:ml-64 lg:w-[calc(100%-16rem)]">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-white hidden lg:block">
            NovaBank Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg bg-dark-bg border border-dark-border hover:bg-dark-border transition-colors"
            aria-label={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-400" />}
          </button>

          <div className="relative">
            <button
              className="p-2 rounded-lg bg-dark-bg border border-dark-border hover:bg-dark-border transition-colors relative"
              aria-label="Notificaciones"
            >
              <Bell className="w-5 h-5 text-gray-400" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {notifications.length > 9 ? '9+' : notifications.length}
                </span>
              )}
            </button>
            {notifications.length > 0 && (
              <div className="absolute right-0 mt-2 w-80 bg-dark-card border border-dark-border rounded-lg shadow-xl py-2 z-50">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      'px-4 py-3 border-b border-dark-border last:border-0 flex items-start gap-3',
                      notification.type === 'success' && 'border-l-4 border-l-green-500',
                      notification.type === 'error' && 'border-l-4 border-l-red-500',
                      notification.type === 'warning' && 'border-l-4 border-l-amber-500',
                      notification.type === 'info' && 'border-l-4 border-l-blue-500'
                    )}
                  >
                    <p className="text-sm text-white flex-1">{notification.message}</p>
                    <button
                      onClick={() => removeNotification(notification.id)}
                      className="text-gray-400 hover:text-white"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-dark-bg border border-dark-border rounded-lg">
            <User className="w-5 h-5 text-gray-400" />
            <div className="text-left">
              <p className="text-xs text-gray-500">{user?.role}</p>
              <p className="text-sm font-medium text-white">{user?.firstName} {user?.lastName}</p>
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Salir</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
