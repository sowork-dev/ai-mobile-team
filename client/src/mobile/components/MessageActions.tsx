/**
 * 訊息旁智能功能 — 超越通訊軟體
 * 根據 AI 職位動態顯示不同功能，支援智能排序
 */
import { useState, useEffect } from "react";
import { useI18n } from "@/i18n";

// 功能定義
interface ActionItem {
  id: string;
  label: string;
  labelEn: string;
  icon: string;
  category: "task" | "document" | "calendar" | "other";
}

// 所有可用功能
const ALL_ACTIONS: ActionItem[] = [
  { id: "create-task", label: "建立任務", labelEn: "Create Task", icon: "📋", category: "task" },
  { id: "add-calendar", label: "加行事曆", labelEn: "Add to Calendar", icon: "📅", category: "calendar" },
  { id: "set-reminder", label: "設提醒", labelEn: "Set Reminder", icon: "⏰", category: "calendar" },
  { id: "generate-contract", label: "生成合約", labelEn: "Generate Contract", icon: "📄", category: "document" },
  { id: "onboarding-task", label: "入職任務", labelEn: "Onboarding Task", icon: "👋", category: "task" },
  { id: "generate-report", label: "生成報表", labelEn: "Generate Report", icon: "📊", category: "document" },
  { id: "create-expense", label: "建立報銷單", labelEn: "Create Expense", icon: "💰", category: "task" },
  { id: "create-presentation", label: "建立簡報", labelEn: "Create Presentation", icon: "📽️", category: "document" },
  { id: "schedule-meeting", label: "排程會議", labelEn: "Schedule Meeting", icon: "🗓️", category: "calendar" },
  { id: "create-ticket", label: "建立工單", labelEn: "Create Ticket", icon: "🎫", category: "task" },
  { id: "tech-doc", label: "技術文件", labelEn: "Tech Document", icon: "📝", category: "document" },
  { id: "pdf-report", label: "PDF 報告", labelEn: "PDF Report", icon: "📕", category: "document" },
  { id: "spreadsheet", label: "試算表", labelEn: "Spreadsheet", icon: "📈", category: "document" },
  { id: "markdown", label: "摘要筆記", labelEn: "Summary Notes", icon: "📝", category: "document" },
  { id: "notify-team", label: "通知相關人", labelEn: "Notify Team", icon: "📢", category: "other" },
];

// 各職位的常用功能（2個）
const ROLE_QUICK_ACTIONS: Record<string, [string, string]> = {
  secretary: ["create-task", "add-calendar"],
  hr: ["generate-contract", "onboarding-task"],
  finance: ["spreadsheet", "create-expense"],
  pm: ["create-presentation", "create-task"],
  it: ["create-ticket", "tech-doc"],
  operations: ["create-task", "generate-report"],
  default: ["create-task", "markdown"],
};

interface Props {
  agentRole?: string;
  messageId: string;
  onAction: (actionId: string, messageContent: string) => void;
  messageContent: string;
}

export default function MessageActions({ agentRole, messageId, onAction, messageContent }: Props) {
  const { locale } = useI18n();
  const [showMore, setShowMore] = useState(false);
  const [usageStats, setUsageStats] = useState<Record<string, number>>({});

  // 載入使用統計
  useEffect(() => {
    const stats = JSON.parse(localStorage.getItem("messageActionStats") || "{}");
    setUsageStats(stats);
  }, []);

  // 記錄使用
  const recordUsage = (actionId: string) => {
    const stats = { ...usageStats };
    stats[actionId] = (stats[actionId] || 0) + 1;
    setUsageStats(stats);
    localStorage.setItem("messageActionStats", JSON.stringify(stats));
  };

  // 取得職位的快捷功能
  const role = agentRole?.toLowerCase() || "default";
  const quickActionIds = ROLE_QUICK_ACTIONS[role] || ROLE_QUICK_ACTIONS.default;
  const quickActions = quickActionIds
    .map(id => ALL_ACTIONS.find(a => a.id === id))
    .filter(Boolean) as ActionItem[];

  // 所有功能（按使用頻率排序）
  const sortedActions = [...ALL_ACTIONS].sort((a, b) => {
    return (usageStats[b.id] || 0) - (usageStats[a.id] || 0);
  });

  // 最近使用（用過的才顯示）
  const recentActions = sortedActions.filter(a => usageStats[a.id] > 0).slice(0, 3);

  const handleAction = (actionId: string) => {
    recordUsage(actionId);
    onAction(actionId, messageContent);
    setShowMore(false);
  };

  return (
    <div className="flex items-center gap-1 mt-1.5">
      {/* 常用功能 1 & 2 */}
      {quickActions.map(action => (
        <button
          key={action.id}
          onClick={() => handleAction(action.id)}
          className="flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs text-gray-700 transition-colors"
        >
          <span>{action.icon}</span>
          <span>{locale === "zh" ? action.label : action.labelEn}</span>
        </button>
      ))}

      {/* 更多按鈕 */}
      <div className="relative">
        <button
          onClick={() => setShowMore(!showMore)}
          className="flex items-center gap-0.5 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs text-gray-500 transition-colors"
        >
          <span>＋</span>
          <span>{locale === "zh" ? "更多" : "More"}</span>
        </button>

        {/* 更多選單 */}
        {showMore && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMore(false)} />
            <div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
              {/* 最近使用 */}
              {recentActions.length > 0 && (
                <>
                  <div className="px-3 py-1.5 bg-gray-50 text-xs text-gray-500 font-medium">
                    {locale === "zh" ? "最近使用" : "Recently Used"}
                  </div>
                  {recentActions.map(action => (
                    <button
                      key={action.id}
                      onClick={() => handleAction(action.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left"
                    >
                      <span>{action.icon}</span>
                      <span className="text-sm text-gray-700">
                        {locale === "zh" ? action.label : action.labelEn}
                      </span>
                      <span className="ml-auto text-xs text-gray-400">
                        {usageStats[action.id]}次
                      </span>
                    </button>
                  ))}
                  <div className="border-t border-gray-100" />
                </>
              )}

              {/* 所有功能 */}
              <div className="px-3 py-1.5 bg-gray-50 text-xs text-gray-500 font-medium">
                {locale === "zh" ? "所有功能" : "All Actions"}
              </div>
              <div className="max-h-48 overflow-y-auto">
                {sortedActions.map(action => (
                  <button
                    key={action.id}
                    onClick={() => handleAction(action.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left"
                  >
                    <span>{action.icon}</span>
                    <span className="text-sm text-gray-700">
                      {locale === "zh" ? action.label : action.labelEn}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
