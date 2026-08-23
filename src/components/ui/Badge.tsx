import { type ReactNode } from 'react';
import { cn } from '../../lib/utils';

type Variant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'outline';

interface BadgeProps {
  children: ReactNode;
  variant?: Variant;
  className?: string;
  dot?: boolean;
}

const variants: Record<Variant, string> = {
  default: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  primary: 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300',
  success: 'bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300',
  warning: 'bg-warning-100 text-warning-600 dark:bg-warning-500/20 dark:text-warning-400',
  danger: 'bg-danger-100 text-danger-700 dark:bg-danger-900/40 dark:text-danger-300',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  outline: 'border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400',
};

const dotColors: Record<Variant, string> = {
  default: 'bg-gray-500',
  primary: 'bg-primary-500',
  success: 'bg-accent-500',
  warning: 'bg-warning-500',
  danger: 'bg-danger-500',
  info: 'bg-blue-500',
  outline: 'bg-gray-400',
};

export function Badge({ children, variant = 'default', className, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className,
      )}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  );
}
