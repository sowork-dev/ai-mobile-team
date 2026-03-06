/**
 * 群組詳情頁面 — 多個 AI 員工 + 真實同事在同一對話
 * 每個 AI 員工有自己的頭像和名字前綴
 */
import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface GroupMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  senderName: string;
  senderAvatar: string;
  senderBg: string;
  senderType: "ai" | "human";
  timestamp: Date;
}

const GROUP_CONFIGS: Record<string, { name: string; members: any[] }> = {
  "brand-team": {
    name: "品牌行銷小組",
    members: [
      { name: "Vivian", avatar: "V", bg: "from-orange-400 to-orange-600", type: "ai" },
      { name: "Ken", avatar: "K", bg: "from-blue-400 to-blue-600", type: "ai" },
    ],
  },
  "content-team": {
    name: "內容創作組",
    members: [
      { name: "Ken", avatar: "K", bg: "from-blue-400 to-blue-600", type: "ai" },
      { name: "Luna", avatar: "L", bg: "from-purple-400 to-purple-600", type: "ai" },
    ],
  },
};

const DEFAULT_GROUP = {
  name: "工作群組",
  members: [
    { name: "Vivian", avatar: "V", bg: "from-orange-400 to-orange-600", type: "ai" },
    { name: "Ken", avatar: "K", bg: "from-blue-400 to-blue-600", type: "ai" },
  ],
};

export default function MobileGroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const [, navigate] = useLocation();
  const groupConfig = GROUP_CONFIGS[groupId] || DEFAULT_GROUP;

  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [respondingAgent, setRespondingAgent] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 初始歡迎訊息
    const firstMember = groupConfig.members[0];
    setMessages([
      {
        id: "1",
        role: "assistant",
        content: `大家好！我是 **${firstMember.name}**，歡迎來到「${groupConfig.name}」。\n\n這個群組由 ${groupConfig.members.map((m: any) => m.name).join("、")} 組成，我們隨時準備好協助您完成行銷任務。請告訴我們今天需要什麼幫助？`,
        senderName: firstMember.name,
        senderAvatar: firstMember.avatar,
        senderBg: firstMember.bg,
        senderType: "ai",
        timestamp: new Date(),
      },
    ]);
  }, [groupId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg || isLoading) return;
    setInput("");

    const userMsg: GroupMessage = {
      id: Date.now().toString(),
      role: "user",
      content: msg,
      senderName: "你",
      senderAvatar: "我",
      senderBg: "from-gray-500 to-gray-700",
      senderType: "human",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    // 模擬多個 AI 員工輪流回應
    const respondingMembers = groupConfig.members.slice(0, Math.random() > 0.5 ? 2 : 1);

    for (const member of respondingMembers) {
      setRespondingAgent(member.name);
      await new Promise((r) => setTimeout(r, 1000 + Math.random() * 1500));

      const responses: Record<string, string[]> = {
        "Vivian": [
          `從策略角度來看，這個方向非常正確。我建議我們先確立**核心訊息**，再分配各渠道的執行重點。\n\n**Ken**，你覺得文案方向呢？`,
          `根據品牌定位分析，我認為應該聚焦在**情感連結**上，而不只是功能訴求。這樣能更有效地觸及目標受眾。`,
        ],
        "Ken": [
          `收到 Vivian 的建議！我可以準備 3 組不同語調的文案版本：\n\n1. **感性版**：強調品牌故事\n2. **理性版**：數據與功能導向\n3. **幽默版**：輕鬆有趣的互動風格\n\n您希望先看哪個方向？`,
          `這個任務我來負責！預計 **2 小時內**完成初稿，會直接發到群組讓大家審閱。`,
        ],
        "Luna": [
          `視覺方面，我建議使用品牌主色 **#F97316** 作為重點色，搭配乾淨的白色背景，呈現高質感的視覺風格。`,
          `我已經準備了 3 個視覺方向的草圖，稍後會上傳到群組供大家選擇。`,
        ],
      };

      const memberResponses = responses[member.name] || [`我已收到您的需求，正在處理中...`];
      const content = memberResponses[Math.floor(Math.random() * memberResponses.length)];

      const aiMsg: GroupMessage = {
        id: (Date.now() + Math.random()).toString(),
        role: "assistant",
        content,
        senderName: member.name,
        senderAvatar: member.avatar,
        senderBg: member.bg,
        senderType: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    }

    setRespondingAgent(null);
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 flex items-center px-4 h-14 gap-3">
        <button
          onClick={() => navigate("/groups")}
          className="w-9 h-9 flex items-center justify-center rounded-full active:bg-gray-100 -ml-1"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.5 5L7.5 10L12.5 15" />
          </svg>
        </button>

        {/* 群組頭像（疊加顯示） */}
        <div className="flex -space-x-2">
          {groupConfig.members.slice(0, 3).map((m: any, i: number) => (
            <div
              key={i}
              className={`w-8 h-8 rounded-full bg-gradient-to-br ${m.bg} flex items-center justify-center text-white text-xs font-bold border-2 border-white`}
              style={{ zIndex: 10 - i }}
            >
              {m.avatar}
            </div>
          ))}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{groupConfig.name}</p>
          <p className="text-xs text-gray-500">
            {groupConfig.members.length} 位 AI 員工
          </p>
        </div>

        <button className="w-9 h-9 flex items-center justify-center rounded-full active:bg-gray-100">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#6B7280" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="10" cy="5" r="1" fill="#6B7280" />
            <circle cx="10" cy="10" r="1" fill="#6B7280" />
            <circle cx="10" cy="15" r="1" fill="#6B7280" />
          </svg>
        </button>
      </div>

      {/* 訊息列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.senderType === "human" ? "justify-end" : "justify-start"}`}
          >
            {/* AI 頭像 */}
            {msg.senderType === "ai" && (
              <div className="flex flex-col items-center mr-2 flex-shrink-0">
                <div
                  className={`w-8 h-8 rounded-full bg-gradient-to-br ${msg.senderBg} flex items-center justify-center text-white font-bold text-xs`}
                >
                  {msg.senderAvatar}
                </div>
              </div>
            )}

            <div className={`max-w-[78%] ${msg.senderType === "ai" ? "space-y-1" : ""}`}>
              {/* 發送者名稱（AI 才顯示） */}
              {msg.senderType === "ai" && (
                <p className="text-xs font-semibold text-gray-600 ml-1">{msg.senderName}</p>
              )}

              {/* 訊息泡泡 */}
              <div
                className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  msg.senderType === "human"
                    ? "bg-orange-500 text-white rounded-tr-sm"
                    : "bg-white text-gray-900 rounded-tl-sm shadow-sm border border-gray-100"
                }`}
              >
                {msg.senderType === "ai" ? (
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      ul: ({ children }) => <ul className="list-disc pl-4 space-y-0.5">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-4 space-y-0.5">{children}</ol>,
                      li: ({ children }) => <li className="text-sm">{children}</li>,
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* 等待動畫 */}
        {isLoading && respondingAgent && (
          <div className="flex justify-start">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-xs mr-2 flex-shrink-0">
              {respondingAgent[0]}
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-gray-600 ml-1">{respondingAgent}</p>
              <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100">
                <div className="flex gap-1.5 items-center h-4">
                  {[0, 150, 300].map((delay) => (
                    <div
                      key={delay}
                      className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 輸入區 */}
      <div
        className="flex-shrink-0 bg-white border-t border-gray-100 px-3 py-2.5"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 8px)" }}
      >
        {/* 快速任務按鈕 */}
        <div className="flex gap-2 mb-2 overflow-x-auto scrollbar-none pb-0.5">
          {["制定本月計畫", "分析競品", "生成文案", "規劃社群"].map((quick) => (
            <button
              key={quick}
              onClick={() => setInput(quick)}
              className="flex-shrink-0 px-3 py-1.5 bg-gray-100 rounded-full text-xs text-gray-600 font-medium active:bg-gray-200"
            >
              {quick}
            </button>
          ))}
        </div>

        <div className="flex items-end gap-2">
          <div className="flex-1 bg-gray-100 rounded-2xl px-3.5 py-2 flex items-end gap-2 min-h-[40px]">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="發送訊息給群組..."
              rows={1}
              className="flex-1 bg-transparent text-sm resize-none focus:outline-none max-h-24 leading-5"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="w-9 h-9 bg-orange-500 rounded-full flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform flex-shrink-0 shadow-sm shadow-orange-200"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M14 2L2 7.5 7 8.5M14 2L9 14 7 8.5M14 2L7 8.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
