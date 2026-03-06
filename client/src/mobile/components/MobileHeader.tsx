/**
 * Mobile 頁面頂部 Header
 */
import { useLocation } from "wouter";

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  onBack?: () => void;
}

export default function MobileHeader({
  title,
  subtitle,
  showBack = false,
  rightAction,
  onBack,
}: MobileHeaderProps) {
  const [, navigate] = useLocation();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  return (
    <div
      className="flex-shrink-0 bg-white border-b border-gray-100 flex items-center px-4 h-14"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      {/* 返回按鈕 */}
      {showBack && (
        <button
          onClick={handleBack}
          className="mr-2 -ml-1 w-9 h-9 flex items-center justify-center rounded-full transition-colors active:bg-gray-100"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.5 5L7.5 10L12.5 15" />
          </svg>
        </button>
      )}

      {/* 標題 */}
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold text-gray-900 truncate">{title}</h1>
        {subtitle && (
          <p className="text-xs text-gray-500 truncate">{subtitle}</p>
        )}
      </div>

      {/* 右側操作 */}
      {rightAction && <div className="ml-2 flex-shrink-0">{rightAction}</div>}
    </div>
  );
}
