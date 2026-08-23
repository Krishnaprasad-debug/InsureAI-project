import { type ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: { value: string; positive: boolean };
  color?: 'primary' | 'accent' | 'warning' | 'danger' | 'info';
}

const colors = {
  primary: { bg: 'bg-primary-50 dark:bg-primary-900/30', text: 'text-primary-600 dark:text-primary-400', ring: 'ring-primary-100 dark:ring-primary-900/40' },
  accent: { bg: 'bg-accent-50 dark:bg-accent-900/30', text: 'text-accent-600 dark:text-accent-400', ring: 'ring-accent-100 dark:ring-accent-900/40' },
  warning: { bg: 'bg-warning-50 dark:bg-warning-500/10', text: 'text-warning-600 dark:text-warning-400', ring: 'ring-warning-100 dark:ring-warning-500/20' },
  danger: { bg: 'bg-danger-50 dark:bg-danger-900/30', text: 'text-danger-600 dark:text-danger-400', ring: 'ring-danger-100 dark:ring-danger-900/40' },
  info: { bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', ring: 'ring-blue-100 dark:ring-blue-900/40' },
};

export function StatCard({ label, value, icon, trend, color = 'primary' }: StatCardProps) {
  const c = colors[color];
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 card-shadow card-shadow-hover">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">{value}</p>
          {trend && (
            <p className={cn('text-xs mt-2 font-medium', trend.positive ? 'text-accent-600' : 'text-danger-500')}>
              {trend.positive ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        <div className={cn('p-3 rounded-xl ring-1', c.bg, c.text, c.ring)}>
          {icon}
        </div>
      </div>
    </div>
  );
}
