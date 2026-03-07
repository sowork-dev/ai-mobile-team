/**
 * 群組聊天頁面 — 品牌群組內的對話
 * AI 員工可以參與對話、回答問題、協助任務
 */
import { useState, useRef, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { useI18n } from "@/i18n";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  agentId?: number;
  agentName?: string;
  agentAvatar?: string;
  timestamp: Date;
}

export default function MobileGroupChatPage() {
  const [, navigate] = useLocation();
  const params = useParams<{ groupId: string }>();
  const { locale } = useI18n();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 獲取群組資訊
  const { data: group, isLoading: groupLoading } = trpc.company.getBrandGroup.useQuery(
    { groupId: params.groupId || "" },
    { enabled: !!params.groupId }
  );

  // 群組聊天 mutation
  const chatMutation = trpc.company.groupChat?.useMutation?.() || { mutateAsync: null };

  // 滾動到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 初始歡迎訊息
  useEffect(() => {
    if (group && messages.length === 0) {
      const primaryAgent = group.members?.[0];
      if (primaryAgent) {
        setMessages([
          {
            id: "welcome",
            role: "assistant",
            content: `你好！我是 ${primaryAgent.name}，${group.brandName} 群組的主要負責人。有什麼我可以幫助你的嗎？`,
            agentId: primaryAgent.id,
            agentName: primaryAgent.name,
            agentAvatar: primaryAgent.avatar || undefined,
            timestamp: new Date(),
          },
        ]);
      }
    }
  }, [group]);

  // 發送訊息
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // 模擬 AI 回覆（之後接真正的 API）
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // 隨機選擇一個群組成員回覆
      const members = group?.members || [];
      const respondingAgent = members[Math.floor(Math.random() * members.length)] || {
        id: 0,
        name: "AI 助手",
        avatar: null,
      };

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: generateResponse(input, group?.brandName || ""),
        agentId: respondingAgent.id,
        agentName: respondingAgent.name,
        agentAvatar: respondingAgent.avatar || undefined,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 生成回覆（模擬）
  const generateResponse = (userInput: string, brandName: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes("進度") || input.includes("狀態")) {
      return `${brandName} 目前的專案進度如下：\n\n• 品牌定位分析：已完成 ✓\n• 競品研究：進行中 (80%)\n• 內容策略規劃：待開始\n\n需要我詳細說明哪個部分嗎？`;
    }
    
    if (input.includes("報告") || input.includes("ppt") || input.includes("簡報")) {
      return `好的，我可以幫你準備 ${brandName} 的報告。請問你需要：\n\n1. 月度績效報告\n2. 品牌策略簡報\n3. 競品分析報告\n\n請選擇一個，或告訴我其他需求。`;
    }
    
    if (input.includes("任務") || input.includes("工作")) {
      return `${brandName} 目前有以下待辦任務：\n\n1. 📝 社群內容規劃 (截止：本週五)\n2. 🎨 品牌視覺更新 (截止：下週一)\n3. 📊 數據分析報告 (截止：月底)\n\n需要我幫你安排優先順序嗎？`;
    }
    
    return `收到！關於 ${brandName} 的這個問題，讓我思考一下...\n\n我建議我們可以：\n1. 先確認目標和範圍\n2. 收集相關資料\n3. 制定執行計劃\n\n你覺得這個方向如何？`;
  };

  if (groupLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="w-8 h-8 border-2 border-[#8E8E93] border-t-[#1C1C1E] rounded-full animate-spin" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white">
        <p className="text-[#8E8E93]">群組不存在</p>
        <button onClick={() => navigate("/chat")} className="mt-4 text-[#007AFF]">
          返回聊天列表
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex-shrink-0 bg-white/95 backdrop-blur-lg border-b border-[#C6C6C8] px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/chat")} className="p-1 -ml-1">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#007AFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          
          {/* 群組資訊 */}
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-[#1C1C1E] text-[17px] truncate">{group.brandName}</h1>
            <p className="text-[13px] text-[#8E8E93]">
              {group.members?.length || 0} {locale === "zh" ? "位成員" : "members"}
            </p>
          </div>

          {/* 成員頭像堆疊 */}
          <div className="flex -space-x-2">
            {(group.members || []).slice(0, 3).map((member: any) => (
              <div
                key={member.id}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-[#E8611A] to-[#FF8A50] flex items-center justify-center text-white text-xs font-semibold ring-2 ring-white overflow-hidden"
              >
                {member.avatar ? (
                  <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                ) : (
                  member.name?.charAt(0) || "?"
                )}
              </div>
            ))}
            {(group.members?.length || 0) > 3 && (
              <div className="w-8 h-8 rounded-full bg-[#F2F2F7] flex items-center justify-center text-[#8E8E93] text-xs font-semibold ring-2 ring-white">
                +{group.members.length - 3}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 訊息區 */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 bg-[#F2F2F7]">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {/* AI 頭像 */}
            {msg.role === "assistant" && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#E8611A] to-[#FF8A50] flex items-center justify-center overflow-hidden">
                {msg.agentAvatar ? (
                  <img src={msg.agentAvatar} alt={msg.agentName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-xs font-semibold">{msg.agentName?.charAt(0) || "A"}</span>
                )}
              </div>
            )}

            <div className={`max-w-[75%] ${msg.role === "user" ? "" : ""}`}>
              {/* AI 名稱 */}
              {msg.role === "assistant" && msg.agentName && (
                <p className="text-[11px] text-[#8E8E93] mb-1 ml-1">{msg.agentName}</p>
              )}
              
              {/* 訊息氣泡 */}
              <div
                className={`rounded-2xl px-3.5 py-2.5 ${
                  msg.role === "user"
                    ? "bg-[#007AFF] text-white rounded-br-sm"
                    : "bg-white text-[#1C1C1E] rounded-bl-sm shadow-sm"
                }`}
              >
                <p className="text-[15px] whitespace-pre-wrap leading-snug">{msg.content}</p>
              </div>
              
              {/* 時間 */}
              <p className={`text-[10px] mt-1 ${msg.role === "user" ? "text-right" : "ml-1"} text-[#8E8E93]`}>
                {msg.timestamp.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}

        {/* Loading */}
        {isLoading && (
          <div className="flex gap-2.5 justify-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#E8611A] to-[#FF8A50] flex items-center justify-center">
              <span className="text-white text-xs font-semibold">...</span>
            </div>
            <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-[#8E8E93] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-[#8E8E93] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-[#8E8E93] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 輸入區 */}
      <div className="flex-shrink-0 px-4 py-3 bg-white border-t border-[#C6C6C8]">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={locale === "zh" ? "輸入訊息..." : "Message..."}
            className="flex-1 px-4 py-2.5 bg-[#F2F2F7] rounded-full text-[15px] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 placeholder:text-[#8E8E93]"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="w-9 h-9 flex items-center justify-center bg-[#007AFF] text-white rounded-full disabled:bg-[#C7C7CC] transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
