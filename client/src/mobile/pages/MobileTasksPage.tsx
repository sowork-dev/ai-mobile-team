/**
 * 任務頁面 — 所有交付物的統一收件匣
 * 按類型分類：簡報 / 社群 / 文案 / 策略 / 影片
 */
import { useState } from "react";
import { useLocation } from "wouter";
import MobileHeader from "../components/MobileHeader";

type TaskType = "all" | "presentation" | "social" | "copy" | "strategy" | "video";
type TaskStatus = "pending" | "in_progress" | "completed" | "review";

interface Task {
  id: string;
  title: string;
  type: TaskType;
  status: TaskStatus;
  agentName: string;
  agentAvatar: string;
  agentBg: string;
  createdAt: string;
  preview?: string;
}

const MOCK_TASKS: Task[] = [
  {
    id: "1",
    title: "品牌社群貼文計畫（10 月份）",
    type: "social",
    status: "completed",
    agentName: "Ken",
    agentAvatar: "K",
    agentBg: "from-blue-400 to-blue-600",
    createdAt: "今天 10:32",
    preview: "包含 12 篇 Instagram 貼文草稿，涵蓋產品介紹、品牌故事...",
  },
  {
    id: "2",
    title: "Q4 行銷策略報告",
    type: "strategy",
    status: "in_progress",
    agentName: "Vivian",
    agentAvatar: "V",
    agentBg: "from-orange-400 to-orange-600",
    createdAt: "昨天 15:20",
    preview: "分析競品動態、市場趨勢，制定第四季行銷重點...",
  },
  {
    id: "3",
    title: "新品上市簡報",
    type: "presentation",
    status: "review",
    agentName: "Luna",
    agentAvatar: "L",
    agentBg: "from-purple-400 to-purple-600",
    createdAt: "週一 09:15",
    preview: "20 頁 PPT，包含市場定位、競品分析、行銷計畫...",
  },
  {
    id: "4",
    title: "廣告文案 A/B 測試版本",
    type: "copy",
    status: "completed",
    agentName: "Ken",
    agentAvatar: "K",
    agentBg: "from-blue-400 to-blue-600",
    createdAt: "週日 14:00",
    preview: "3 組廣告文案，針對不同受眾測試點擊率...",
  },
  {
    id: "5",
    title: "品牌形象影片腳本",
    type: "video",
    status: "pending",
    agentName: "Max",
    agentAvatar: "M",
    agentBg: "from-green-400 to-green-600",
    createdAt: "上週五",
    preview: "60 秒品牌形象影片的分鏡腳本與旁白文字...",
  },
];

const TYPE_CONFIG: Record<TaskType, { label: string; color: string; bg: string; icon: JSX.Element }> = {
  all: {
    label: "全部",
    color: "text-gray-700",
    bg: "bg-gray-100",
    icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="1" y="1" width="12" height="12" rx="1.5"/></svg>,
  },
  presentation: {
    label: "簡報",
    color: "text-purple-700",
    bg: "bg-purple-50",
    icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="1" y="1" width="12" height="9" rx="1"/><path d="M4 13h6M7 10v3"/></svg>,
  },
  social: {
    label: "社群",
    color: "text-pink-700",
    bg: "bg-pink-50",
    icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="7" cy="7" r="5"/><path d="M4.5 7h5M7 4.5v5"/></svg>,
  },
  copy: {
    label: "文案",
    color: "text-blue-700",
    bg: "bg-blue-50",
    icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 3h10M2 6h8M2 9h6"/></svg>,
  },
  strategy: {
    label: "策略",
    color: "text-orange-700",
    bg: "bg-orange-50",
    icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 10l3-3 2 2 5-5"/></svg>,
  },
  video: {
    label: "影片",
    color: "text-green-700",
    bg: "bg-green-50",
    icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 7L5 4v6l4-3z"/><rect x="1" y="2" width="12" height="10" rx="1.5"/></svg>,
  },
};

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; dot: string }> = {
  pending: { label: "待處理", color: "text-gray-500", dot: "bg-gray-400" },
  in_progress: { label: "進行中", color: "text-blue-600", dot: "bg-blue-500" },
  review: { label: "待審核", color: "text-orange-600", dot: "bg-orange-500" },
  completed: { label: "已完成", color: "text-green-600", dot: "bg-green-500" },
};

export default function MobileTasksPage() {
  const [, navigate] = useLocation();
  const [activeType, setActiveType] = useState<TaskType>("all");

  const filtered = MOCK_TASKS.filter(
    (t) => activeType === "all" || t.type === activeType
  );

  const types: TaskType[] = ["all", "presentation", "social", "copy", "strategy", "video"];

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <MobileHeader title="任務" />

      {/* 類型篩選 */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-4 py-2.5">
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {types.map((type) => {
            const cfg = TYPE_CONFIG[type];
            const isActive = activeType === type;
            return (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-orange-500 text-white"
                    : `${cfg.bg} ${cfg.color}`
                }`}
              >
                {cfg.icon}
                {cfg.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 任務列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm">此分類尚無任務</p>
          </div>
        ) : (
          filtered.map((task) => {
            const typeCfg = TYPE_CONFIG[task.type];
            const statusCfg = STATUS_CONFIG[task.status];
            return (
              <button
                key={task.id}
                onClick={() => navigate(`/task/${task.id}`)}
                className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-left active:bg-gray-50 transition-colors"
              >
                {/* 頂部：類型 + 狀態 */}
                <div className="flex items-center justify-between mb-2.5">
                  <span className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${typeCfg.bg} ${typeCfg.color}`}>
                    {typeCfg.icon}
                    {typeCfg.label}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                    <span className={`text-xs font-medium ${statusCfg.color}`}>{statusCfg.label}</span>
                  </div>
                </div>

                {/* 標題 */}
                <p className="font-semibold text-gray-900 text-sm mb-1.5 line-clamp-2">{task.title}</p>

                {/* 預覽 */}
                {task.preview && (
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">{task.preview}</p>
                )}

                {/* 底部：AI 員工 + 時間 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-full bg-gradient-to-br ${task.agentBg} flex items-center justify-center text-white text-[10px] font-bold`}
                    >
                      {task.agentAvatar}
                    </div>
                    <span className="text-xs text-gray-500">{task.agentName}</span>
                  </div>
                  <span className="text-xs text-gray-400">{task.createdAt}</span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
