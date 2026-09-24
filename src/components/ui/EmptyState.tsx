import React from 'react';
import { Compass } from 'lucide-react';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Data Available',
  description = 'There are no items to display at this time.',
  icon,
  action,
}) => {
  return (
    <div className="p-12 text-center bg-white/70 dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 max-w-lg mx-auto my-8 shadow-soft">
      <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-600/20 text-violet-600 dark:text-violet-400 flex items-center justify-center mx-auto border border-violet-200 dark:border-violet-500/30">
        {icon || <Compass className="w-6 h-6" />}
      </div>
      <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">{title}</h3>
      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{description}</p>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
};
