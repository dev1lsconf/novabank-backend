import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(cents: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ahora mismo';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours} h`;
  if (diffDays < 7) return `Hace ${diffDays} días`;
  return formatDate(dateString);
}

export function maskAccountNumber(accountNumber: string): string {
  const clean = accountNumber.replace(/\s+/g, '');
  if (clean.length <= 4) return clean;
  return clean.slice(0, 4) + ' '.repeat(Math.ceil((clean.length - 8) / 4)).trim() + ' ' + clean.slice(-4);
}

export function maskCardNumber(maskedPan: string): string {
  return maskedPan.replace(/\d(?=\d{4})/g, '•');
}

export function getRoleColor(role: string): string {
  const colors: Record<string, string> = {
    ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
    GERENTE: 'bg-blue-100 text-blue-800 border-blue-200',
    CAJERO: 'bg-green-100 text-green-800 border-green-200',
    AUDITOR: 'bg-amber-100 text-amber-800 border-amber-200',
    CLIENTE: 'bg-gray-100 text-gray-800 border-gray-200',
  };
  return colors[role] || 'bg-gray-100 text-gray-800 border-gray-200';
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    ACTIVA: 'bg-green-100 text-green-800 border-green-200',
    ACTIVO: 'bg-green-100 text-green-800 border-green-200',
    INACTIVA: 'bg-gray-100 text-gray-800 border-gray-200',
    INACTIVO: 'bg-gray-100 text-gray-800 border-gray-200',
    BLOQUEADA: 'bg-red-100 text-red-800 border-red-200',
    BLOQUEADO: 'bg-red-100 text-red-800 border-red-200',
    CERRADA: 'bg-slate-100 text-slate-800 border-slate-200',
    PENDIENTE: 'bg-amber-100 text-amber-800 border-amber-200',
    COMPLETADA: 'bg-green-100 text-green-800 border-green-200',
    FALLIDA: 'bg-red-100 text-red-800 border-red-200',
    CANCELADA: 'bg-gray-100 text-gray-800 border-gray-200',
    REVERTIDA: 'bg-blue-100 text-blue-800 border-blue-200',
  };
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
}

export function getTransactionTypeColor(type: string): string {
  const colors: Record<string, string> = {
    DEPOSITO: 'text-green-600',
    RETIRO: 'text-red-600',
    TRANSFERENCIA_ENVIADA: 'text-blue-600',
    TRANSFERENCIA_RECIBIDA: 'text-green-600',
    PAGO_TARJETA: 'text-purple-600',
    COMPRA_FOREX: 'text-amber-600',
    VENTA_FOREX: 'text-emerald-600',
  };
  return colors[type] || 'text-gray-600';
}

export function getTransactionTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    DEPOSITO: 'arrow-down-to-line',
    RETIRO: 'arrow-up-from-line',
    TRANSFERENCIA_ENVIADA: 'arrow-right-left',
    TRANSFERENCIA_RECIBIDA: 'arrow-left-right',
    PAGO_TARJETA: 'credit-card',
    COMPRA_FOREX: 'arrow-down-up',
    VENTA_FOREX: 'arrow-up-down',
  };
  return icons[type] || 'circle';
}

export function generateIdempotencyKey(): string {
  return `idem_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function parseError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    return axiosError.response?.data?.message || 'Error desconocido';
  }
  return 'Error desconocido';
}
