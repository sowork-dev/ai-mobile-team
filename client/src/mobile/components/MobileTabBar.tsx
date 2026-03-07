/**
 * 底部 5 個 Tab 導航列
 * 設計：聯絡人 → 聊天 → 幕僚長(中間突出) → 任務 → 我的
 * 注意：此元件在 Router base="/app" 下，路徑使用相對路徑
 */
import { useLocation } from "wouter";
import { useI18n } from "@/i18n";

interface TabItem {
  id: string;
  path: string;
  labelKey: string;
  isCenter?: boolean;
  icon: (active: boolean) => JSX.Element;
}

const tabs: TabItem[] = [
  {
    id: "contacts",
    path: "/contacts",
    labelKey: "tabs.contacts",
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "#F97316" : "#6B7280"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: "chat",
    path: "/chat",
    labelKey: "tabs.chat",
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "#F97316" : "#6B7280"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    id: "assistant",
    path: "/assistant",
    labelKey: "tabs.assistant",
    isCenter: true,
    icon: (active) => (
      <svg width="28" height="28" viewBox="0 0 24 24" fill={active ? "#F97316" : "none"} stroke={active ? "#F97316" : "#FFFFFF"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        {/* AI Assistant icon - sparkles/magic */}
        <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
        <circle cx="12" cy="12" r="4" fill={active ? "#F97316" : "#FFFFFF"} stroke={active ? "#F97316" : "#FFFFFF"} />
        <path d="M12 8v8M8 12h8" stroke={active ? "#FFFFFF" : "#F97316"} strokeWidth="2" />
      </svg>
    ),
  },
  {
    id: "tasks",
    path: "/tasks",
    labelKey: "tabs.tasks",
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "#F97316" : "#6B7280"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    id: "profile",
    path: "/profile",
    labelKey: "tabs.profile",
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "#F97316" : "#6B7280"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export default function MobileTabBar() {
  const [location, navigate] = useLocation();
  const { t } = useI18n();

  const activeTab = tabs.find((tab) => location === tab.path || location.startsWith(tab.path + "/"))?.id ?? "chat";

  return (
    <nav
      className="flex-shrink-0 bg-white border-t border-gray-200 relative"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          
          // 中間的「幕僚長」按鈕特殊樣式
          if (tab.isCenter) {
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className="flex flex-col items-center justify-center flex-1 h-full relative"
              >
                {/* 突出的圓形按鈕 */}
                <div 
                  className="absolute -top-5 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95"
                  style={{ 
                    background: isActive 
                      ? "linear-gradient(135deg, #F97316 0%, #EA580C 100%)" 
                      : "linear-gradient(135deg, #F97316 0%, #FB923C 100%)",
                  }}
                >
                  {tab.icon(isActive)}
                </div>
                <span
                  className="text-[10px] font-medium leading-none mt-7"
                  style={{ color: isActive ? "#F97316" : "#6B7280" }}
                >
                  {t(tab.labelKey)}
                </span>
              </button>
            );
          }
          
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-opacity active:opacity-60"
            >
              {tab.icon(isActive)}
              <span
                className="text-[10px] font-medium leading-none"
                style={{ color: isActive ? "#F97316" : "#6B7280" }}
              >
                {t(tab.labelKey)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
