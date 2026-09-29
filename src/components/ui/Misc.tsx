import { type ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { Check } from 'lucide-react';

type Status = 'pending' | 'under_review' | 'approved' | 'rejected';

const statusConfig: Record<Status, { label: string; variant: string; dot: string }> = {
  pending: { label: 'Pending', variant: 'bg-warning-100 text-warning-600 dark:bg-warning-500/20 dark:text-warning-400', dot: 'bg-warning-500' },
  under_review: { label: 'Under Review', variant: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/40 dark:text-secondary-300', dot: 'bg-secondary-500' },
  approved: { label: 'Approved', variant: 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300', dot: 'bg-primary-500' },
  rejected: { label: 'Rejected', variant: 'bg-danger-100 text-danger-700 dark:bg-danger-900/40 dark:text-danger-300', dot: 'bg-danger-500' },
};

export function StatusBadge({ status }: { status: Status }) {
  const config = statusConfig[status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium', config.variant)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
      {config.label}
    </span>
  );
}

export function ProgressBar({ value, className, color }: { value: number; className?: string; color?: string }) {
  return (
    <div className={cn('h-2 w-full rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden', className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-500', color || 'bg-primary-600')}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          'w-5 h-5 rounded-md border flex items-center justify-center transition-colors',
          checked ? 'bg-primary-600 border-primary-600 text-white' : 'border-gray-300 dark:border-gray-600',
        )}
      >
        {checked && <Check className="w-3.5 h-3.5" />}
      </button>
      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
    </label>
  );
}
