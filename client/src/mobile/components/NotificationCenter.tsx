/**
 * 通知中心組件
 * 顯示任務狀態更新、審批請求等通知
 */
import { useI18n } from "@/i18n";

interface Notification {
  id: string;
  type: "task_assigned" | "stage_complete" | "approval_required" | "approval_result" | "task_complete" | "ai_question";
  title: string;
  message: string;
  taskId: string;
  taskTitle: string;
  fromAI?: { id: number; name: string };
  createdAt: Date | string;
  readAt?: Date | string;
  actionRequired: boolean;
}

interface Props {
  notifications: Notification[];
  onClose: () => void;
  onNotificationClick: (notification: Notification) => void;
  onMarkAllRead: () => void;
}

export default function NotificationCenter({ 
  notifications, 
  onClose, 
  onNotificationClick,
  onMarkAllRead 
}: Props) {
  const { locale } = useI18n();
  
  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "approval_required":
        return (
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v4l3 3"/>
            </svg>
          </div>
        );
      case "stage_complete":
      case "task_complete":
        return (
          <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
        );
      case "ai_question":
        return (
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <path d="M12 17h.01"/>
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>
        );
    }
  };
  
  const formatTime = (dateStr: Date | string) => {
    const date = new Date(dateStr as string);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return locale === "zh" ? "剛剛" : "Just now";
    if (diffMins < 60) return locale === "zh" ? `${diffMins} 分鐘前` : `${diffMins}m ago`;
    if (diffHours < 24) return locale === "zh" ? `${diffHours} 小時前` : `${diffHours}h ago`;
    if (diffDays < 7) return locale === "zh" ? `${diffDays} 天前` : `${diffDays}d ago`;
    return date.toLocaleDateString();
  };
  
  const unreadCount = notifications.filter(n => !n.readAt).length;
  
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={onClose}>
      <div 
        className="w-full bg-white rounded-t-3xl max-h-[85vh] flex flex-col animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 pt-3 pb-2 px-6 border-b border-gray-100">
          <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">
              {locale === "zh" ? "通知" : "Notifications"}
              {unreadCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-gray-900 text-white text-xs rounded-full">
                  {unreadCount}
                </span>
              )}
            </h2>
            {unreadCount > 0 && (
              <button 
                onClick={onMarkAllRead}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                {locale === "zh" ? "全部已讀" : "Mark all read"}
              </button>
            )}
          </div>
        </div>
        
        {/* Notification List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto mb-4 flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              </div>
              <p className="text-gray-500">
                {locale === "zh" ? "暫無通知" : "No notifications"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map(notification => (
                <button
                  key={notification.id}
                  onClick={() => onNotificationClick(notification)}
                  className={`w-full flex items-start gap-3 p-4 text-left hover:bg-gray-50 transition-colors ${
                    !notification.readAt ? "bg-gray-50" : ""
                  }`}
                >
                  {getIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-medium ${!notification.readAt ? "text-gray-900" : "text-gray-700"}`}>
                        {notification.title}
                      </p>
                      {!notification.readAt && (
                        <span className="w-2 h-2 rounded-full bg-gray-900 flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      {notification.fromAI && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                          {notification.fromAI.name}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {formatTime(notification.createdAt)}
                      </span>
                      {notification.actionRequired && (
                        <span className="text-xs bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded">
                          {locale === "zh" ? "需處理" : "Action needed"}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
