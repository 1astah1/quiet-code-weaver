
import React, { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

const LazyWrapper = ({ children, fallback, className }: LazyWrapperProps) => {
  const defaultFallback = (
    <div className={`space-y-4 ${className || ''}`}>
      <Skeleton className="h-8 w-full bg-slate-700/50" />
      <Skeleton className="h-32 w-full bg-slate-700/50" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-20 bg-slate-700/50" />
        <Skeleton className="h-20 bg-slate-700/50" />
      </div>
    </div>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  );
};

export default LazyWrapper;
