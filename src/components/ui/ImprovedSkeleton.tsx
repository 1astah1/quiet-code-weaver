
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'card' | 'text' | 'avatar' | 'button' | 'image';
  lines?: number;
  height?: string;
  width?: string;
}

const Skeleton = ({ 
  className, 
  variant = 'default', 
  lines = 1, 
  height, 
  width,
  ...props 
}: SkeletonProps) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'card':
        return 'h-32 w-full rounded-lg';
      case 'text':
        return 'h-4 w-full rounded';
      case 'avatar':
        return 'h-12 w-12 rounded-full';
      case 'button':
        return 'h-10 w-24 rounded-md';
      case 'image':
        return 'h-48 w-full rounded-lg';
      default:
        return 'h-4 w-full rounded';
    }
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "animate-pulse bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700",
              "bg-[length:200%_100%] animate-[shimmer_2s_infinite]",
              getVariantClasses(),
              index === lines - 1 && lines > 1 ? 'w-3/4' : '',
              className
            )}
            style={{ height, width }}
            {...props}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "animate-pulse bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700",
        "bg-[length:200%_100%] animate-[shimmer_2s_infinite]",
        getVariantClasses(),
        className
      )}
      style={{ height, width }}
      {...props}
    />
  );
};

export { Skeleton };
