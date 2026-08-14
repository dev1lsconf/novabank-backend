"use client";

import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { getStatusColor, getRoleColor } from '@/lib/utils';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'status' | 'role';
  status?: string;
  role?: string;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', status, role, children, ...props }, ref) => {
    const variants = {
      default: 'bg-gray-100 text-gray-800 border-gray-200',
      success: 'bg-green-100 text-green-800 border-green-200',
      warning: 'bg-amber-100 text-amber-800 border-amber-200',
      danger: 'bg-red-100 text-red-800 border-red-200',
      info: 'bg-blue-100 text-blue-800 border-blue-200',
      status: status ? getStatusColor(status) : 'bg-gray-100 text-gray-800 border-gray-200',
      role: role ? getRoleColor(role) : 'bg-gray-100 text-gray-800 border-gray-200',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
