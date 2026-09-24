import React from 'react';

export interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = 'h-6 w-full' }) => {
  return (
    <div
      className={`bg-slate-200/80 dark:bg-slate-800/80 rounded-2xl animate-pulse border border-slate-200 dark:border-slate-700/50 ${className}`}
    />
  );
};
