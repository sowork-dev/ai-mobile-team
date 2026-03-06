/**
 * 底部 5 個 Tab 導航列
 * 設計參考 LINE 框架，使用純 SVG 線條圖示
 * 注意：此元件在 Router base="/app" 下，路徑使用相對路徑
 */
import { useLocation } from "wouter";

interface TabItem {
  id: string;
  path: string;
  label: string;
  icon: (active: boolean) => JSX.Element;
}

const tabs: TabItem[] = [
  {
    id: "contacts",
    path: "/contacts",
    label: "聯絡人",
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
    label: "聊天",
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "#F97316" : "#6B7280"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    id: "tasks",
    path: "/tasks",
    label: "任務",
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "#F97316" : "#6B7280"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    id: "groups",
    path: "/groups",
    label: "群組",
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "#F97316" : "#6B7280"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        <circle cx="19" cy="8" r="2" fill={active ? "#F97316" : "none"} stroke={active ? "#F97316" : "#6B7280"} strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    id: "profile",
    path: "/profile",
    label: "我的",
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

  // location 是相對於 /app 的路徑，例如 /chat、/contacts 等
  const activeTab = tabs.find((t) => location === t.path || location.startsWith(t.path + "/"))?.id ?? "chat";

  return (
    <nav
      className="flex-shrink-0 bg-white border-t border-gray-200"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
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
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
