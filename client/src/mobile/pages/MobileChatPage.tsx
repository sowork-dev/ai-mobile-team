/**
 * 聊天列表頁面 — 個人對話列表（AI 員工 + 真實同事）
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import MobileHeader from "../components/MobileHeader";

// 模擬對話列表資料（實際應從後端取得）
const MOCK_CONVERSATIONS = [
  {
    id: "vivian-brand",
    type: "ai",
    name: "Vivian",
    title: "品牌策略顧問",
    avatar: "V",
    avatarBg: "from-orange-400 to-orange-600",
    lastMessage: "根據您的品牌定位，我建議本月優先佈局 Instagram...",
    time: "10:32",
    unread: 2,
    online: true,
  },
  {
    id: "ken-copy",
    type: "ai",
    name: "Ken",
    title: "文案創作專家",
    avatar: "K",
    avatarBg: "from-blue-400 to-blue-600",
    lastMessage: "您的社群貼文草稿已完成，請查看附件",
    time: "昨天",
    unread: 0,
    online: true,
  },
  {
    id: "luna-design",
    type: "ai",
    name: "Luna",
    title: "視覺設計顧問",
    avatar: "L",
    avatarBg: "from-purple-400 to-purple-600",
    lastMessage: "品牌視覺規範已更新，包含新的色彩系統",
    time: "週一",
    unread: 1,
    online: false,
  },
  {
    id: "max-data",
    type: "ai",
    name: "Max",
    title: "數據分析師",
    avatar: "M",
    avatarBg: "from-green-400 to-green-600",
    lastMessage: "上週廣告數據報告：ROAS 達到 4.2x",
    time: "週日",
    unread: 0,
    online: false,
  },
];

export default function MobileChatPage() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");

  // 取得 agents 列表
  const { data: agentsData } = trpc.cmo.listAgents.useQuery({});

  const filtered = MOCK_CONVERSATIONS.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-white">
      <MobileHeader
        title="聊天"
        rightAction={
          <button
            onClick={() => navigate("/contacts")}
            className="w-9 h-9 flex items-center justify-center rounded-full active:bg-gray-100"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="10" cy="10" r="8" />
              <path d="M10 6v8M6 10h8" />
            </svg>
          </button>
        }
      />

      {/* 搜尋列 */}
      <div className="px-4 py-2 bg-white border-b border-gray-100">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="7" cy="7" r="5" />
            <path d="M11 11l3 3" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜尋對話..."
            className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-xl text-sm focus:outline-none"
          />
        </div>
      </div>

      {/* 對話列表 */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M35 25a2 2 0 0 1-2 2H11.5L6 33V8a2 2 0 0 1 2-2h25a2 2 0 0 1 2 2z" />
            </svg>
            <p className="mt-3 text-sm">尚無對話</p>
            <button
              onClick={() => navigate("/contacts")}
              className="mt-3 text-sm text-orange-500 font-medium"
            >
              找 AI 員工開始對話
            </button>
          </div>
        ) : (
          <div>
            {filtered.map((conv) => (
              <button
                key={conv.id}
                onClick={() => navigate(`/chat/${conv.id}`)}
                className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 border-b border-gray-50 transition-colors"
              >
                {/* 頭像 */}
                <div className="relative flex-shrink-0">
                  <div
                    className={`w-12 h-12 rounded-full bg-gradient-to-br ${conv.avatarBg} flex items-center justify-center text-white font-bold text-base shadow-sm`}
                  >
                    {conv.avatar}
                  </div>
                  {conv.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>

                {/* 內容 */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-gray-900 text-sm">{conv.name}</span>
                      {conv.type === "ai" && (
                        <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-medium">AI</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">{conv.time}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{conv.lastMessage}</p>
                </div>

                {/* 未讀數 */}
                {conv.unread > 0 && (
                  <div className="flex-shrink-0 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold">{conv.unread}</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
