import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Use shimmer effect instead of pulse
   */
  shimmer?: boolean;
}

function Skeleton({ className, shimmer = true, ...props }: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "rounded-lg bg-neutral-200/60",
        shimmer ? "animate-shimmer bg-gradient-to-r from-neutral-200/60 via-neutral-100 to-neutral-200/60 bg-[length:200%_100%]" : "animate-pulse",
        className
      )}
      {...props}
    />
  );
}

/**
 * Skeleton for stat card
 */
function StatCardSkeleton() {
  return (
    <div className="glass-card animate-fade-in-up">
      <div className="flex flex-col gap-4">
        {/* Icon skeleton */}
        <Skeleton className="h-16 w-16 rounded-xl" />
        
        {/* Label skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          
          {/* Number skeleton */}
          <Skeleton className="h-12 w-20" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for brand/campaign list item
 */
function ListItemSkeleton() {
  return (
    <div className="glass-card p-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          {/* Icon skeleton */}
          <Skeleton className="h-12 w-12 rounded-xl flex-shrink-0" />
          
          {/* Content skeleton */}
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        
        {/* Status badge skeleton */}
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
  );
}

/**
 * Skeleton for empty state (when no data and loading)
 */
function EmptyStateSkeleton() {
  return (
    <div className="glass-card text-center py-16 px-6">
      <div className="flex flex-col items-center gap-6">
        {/* Icon skeleton */}
        <Skeleton className="h-32 w-32 rounded-2xl" />
        
        {/* Text skeleton */}
        <div className="space-y-3 w-full max-w-sm">
          <Skeleton className="h-6 w-48 mx-auto" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4 mx-auto" />
        </div>
        
        {/* Button skeleton */}
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
    </div>
  );
}

export { Skeleton, StatCardSkeleton, ListItemSkeleton, EmptyStateSkeleton };
