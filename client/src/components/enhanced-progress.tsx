import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

interface EnhancedProgressProps extends React.ComponentProps<typeof ProgressPrimitive.Root> {
  value?: number;
  showPulse?: boolean; // 是否顯示脈動效果
  colorScheme?: 'slate' | 'lime' | 'violet'; // 顏色方案
}

function EnhancedProgress({
  className,
  value = 0,
  showPulse = false,
  colorScheme = 'slate',
  ...props
}: EnhancedProgressProps) {
  // 根據顏色方案獲取顏色類
  const getColorClasses = () => {
    switch (colorScheme) {
      case 'slate':
        return {
          bg: 'bg-slate-100',
          indicator: 'bg-slate-600',
          pulse: 'bg-slate-400',
        };
      case 'lime':
        return {
          bg: 'bg-lime-100',
          indicator: 'bg-lime-600',
          pulse: 'bg-lime-400',
        };
      case 'violet':
        return {
          bg: 'bg-violet-100',
          indicator: 'bg-violet-600',
          pulse: 'bg-violet-400',
        };
      default:
        return {
          bg: 'bg-gray-100',
          indicator: 'bg-gray-600',
          pulse: 'bg-gray-400',
        };
    }
  };

  const colors = getColorClasses();
  const progressValue = Math.min(Math.max(value, 0), 100);

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "relative h-3 w-full overflow-hidden rounded-full border-2 border-black",
        colors.bg,
        className
      )}
      {...props}
    >
      {/* 進度條指示器 */}
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          "h-full w-full flex-1 transition-all duration-500 ease-out",
          colors.indicator
        )}
        style={{ transform: `translateX(-${100 - progressValue}%)` }}
      />
      
      {/* 脈動效果（僅在 analyzing 狀態顯示） */}
      {showPulse && (
        <div 
          className={cn(
            "absolute top-0 left-0 h-full animate-pulse-wave",
            colors.pulse
          )}
          style={{
            width: `${progressValue}%`,
            opacity: 0.4,
          }}
        />
      )}
      
      {/* 光澤效果 */}
      <div 
        className="absolute top-0 left-0 h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-20"
        style={{
          width: `${progressValue}%`,
          animation: showPulse ? 'shimmer 2s infinite' : 'none',
        }}
      />
    </ProgressPrimitive.Root>
  );
}

export { EnhancedProgress };
