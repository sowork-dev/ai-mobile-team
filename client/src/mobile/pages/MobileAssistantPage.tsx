/**
 * 幕僚長頁面 - AI 幕僚長主介面
 * 這是用戶與幕僚長對話的主要入口
 * 
 * UI 設計規範：
 * - Apple SF Symbols 風格圖標
 * - 品牌色: #E8611A (橘色)
 * - 漸變: 橘色到粉色
 */
import { useState, useRef, useEffect } from "react";
import MobileHeader from "../components/MobileHeader";
import { trpc } from "@/lib/trpc";

// 推薦的 AI 員工
interface AgentRecommendation {
  id: number;
  name: string;
  title: string;
  avatar: string | null;
  reason: string;
  role: "primary" | "support";
}

// 建議操作
interface SuggestedAction {
  label: string;
  action: string;
  params?: Record<string, any>;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  recommendations?: AgentRecommendation[];
  suggestedActions?: SuggestedAction[];
}

export default function MobileAssistantPage() {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 今日 AI 工作摘要資料
  const { data: completedTasks } = trpc.chiefOfStaff.tasks.useQuery({ status: "completed" });
  const completedCount = completedTasks?.length ?? 0;
  const timeSavedHours = completedCount * 2;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "您好，我是您的幕僚長。\n\n我可以協助您：\n• 組建最佳團隊\n• 派發任務給 AI 同事\n• 追蹤專案進度\n• 提供決策建議\n\n請問今天有什麼需要我協助的？",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAgents, setSelectedAgents] = useState<number[]>([]);

  // tRPC mutation
  const chatMutation = trpc.chiefOfStaff.chat.useMutation();
  const confirmTeamMutation = trpc.chiefOfStaff.confirmTeam.useMutation();

  // 滾動到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const history = messages.slice(-6).map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      const response = await chatMutation.mutateAsync({
        message: messageText,
        history,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.message,
        timestamp: new Date(),
        recommendations: response.recommendations,
        suggestedActions: response.suggestedActions,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      
      if (response.recommendations) {
        setSelectedAgents(response.recommendations.map(r => r.id));
      }

    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "抱歉，我暫時無法處理這個請求。請稍後再試。",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // 處理建議操作
  const handleAction = async (action: SuggestedAction) => {
    if (action.action === "confirm_team" && selectedAgents.length > 0) {
      setIsLoading(true);
      try {
        // 從最近的用戶消息提取任務描述
        const userMessages = messages.filter(m => m.role === "user");
        const lastUserMessage = userMessages[userMessages.length - 1]?.content || "";
        
        const result = await confirmTeamMutation.mutateAsync({
          agentIds: selectedAgents,
          taskTitle: lastUserMessage.slice(0, 30) || "新任務",
          taskDescription: lastUserMessage,
        });
        
        // 顯示成功消息，並添加跳轉按鈕
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: result.message,
          timestamp: new Date(),
          suggestedActions: [
            { label: "查看任務詳情", action: "view_task", params: { taskId: result.taskId } },
            { label: "繼續對話", action: "continue" },
          ],
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setSelectedAgents([]);
      } catch (error) {
        console.error("Confirm team error:", error);
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "抱歉，建立任務時發生錯誤。請稍後再試。",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    } else if (action.action === "view_task" && action.params?.taskId) {
      // 跳轉到任務頁面
      window.location.href = `/app/tasks/${action.params.taskId}`;
    } else if (action.action === "change_team") {
      handleSend("請推薦其他人選");
    } else if (action.action === "continue") {
      // 不做任何事，讓用戶繼續輸入
    } else {
      handleSend(action.label);
    }
  };

  // 切換選擇 AI 員工
  const toggleAgentSelection = (id: number) => {
    setSelectedAgents(prev => 
      prev.includes(id) 
        ? prev.filter(a => a !== id)
        : [...prev, id]
    );
  };

  // 快速操作按鈕 - Apple SF Symbols 風格（單色、克制）
  const quickActions = [
    { 
      label: "組建團隊", 
      prompt: "我需要組建一個團隊來處理行銷專案",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3C3C43" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    },
    { 
      label: "派發任務", 
      prompt: "我要派發一個任務",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3C3C43" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      )
    },
    { 
      label: "今日待辦", 
      prompt: "查看我今天的待辦事項",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3C3C43" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /><path d="M9 16l2 2 4-4" />
        </svg>
      )
    },
    { 
      label: "查看進度", 
      prompt: "查看目前任務的進度",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3C3C43" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 20V10M12 20V4M6 20v-6" />
        </svg>
      )
    },
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header - Apple 風格（簡潔、克制） */}
      <div className="flex-shrink-0 bg-white/95 backdrop-blur-lg border-b border-gray-200/60 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* 小型品牌圖標 - 只有這裡用橘色 */}
            <div className="w-8 h-8 rounded-lg bg-[#E8611A] flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <circle cx="12" cy="8" r="3.5" />
                <path d="M5 20c0-3.5 3.5-5.5 7-5.5s7 2 7 5.5" />
              </svg>
            </div>
            <span className="text-base font-medium text-[#1C1C1E]">幕僚長</span>
          </div>
          {/* 右側按鈕組 */}
          <div className="flex items-center gap-3">
            {/* 知識庫按鈕 */}
            <button 
              onClick={() => window.location.href = "/app/company-settings"}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 rounded-lg active:bg-blue-100 transition-colors"
              title="連接知識庫"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 1.5 17V4.5A2.5 2.5 0 0 1 4 2h8.5L17 6.5V17a2.5 2.5 0 0 1-2.5 2.5H4z" transform="scale(1.2) translate(-1,-1)" />
                <path d="M12 2v5h5" transform="scale(1.2) translate(-1,-1)" />
              </svg>
              <span className="text-xs text-blue-600 font-medium">知識庫</span>
            </button>
            {/* 狀態 - 低調的灰色 */}
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#34C759]" />
              <span className="text-xs text-[#8E8E93]">在線</span>
            </div>
          </div>
        </div>
      </div>

      {/* 今日 AI 工作摘要 — ROI Widget */}
      {messages.length <= 1 && (
        <div className="flex-shrink-0 mx-4 mt-4 mb-1 bg-gradient-to-r from-[#1C1C1E] to-[#3A3A3C] rounded-2xl p-4">
          <p className="text-[11px] text-white/50 mb-2 tracking-wide uppercase">今日 AI 工作摘要</p>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-2xl font-bold text-white">{completedCount}</p>
              <p className="text-[12px] text-white/60 mt-0.5">任務已完成</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="flex-1">
              <p className="text-2xl font-bold text-[#34C759]">{timeSavedHours}h</p>
              <p className="text-[12px] text-white/60 mt-0.5">節省時間</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="flex-1 text-right">
              <div className="flex items-center justify-end gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#30D158" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <p className="text-[12px] text-[#30D158] font-medium">Slack</p>
              </div>
              <p className="text-[11px] text-white/40 mt-0.5">不再需要</p>
            </div>
          </div>
          {completedCount === 0 && (
            <p className="text-[11px] text-white/40 mt-2">派發第一個任務，開始計算你節省的時間</p>
          )}
        </div>
      )}

      {/* 快速操作區 - Apple 風格（單色、簡潔） */}
      {messages.length <= 1 && (
        <div className="flex-shrink-0 px-4 py-5">
          <p className="text-xs text-[#8E8E93] mb-3 tracking-wide">快速開始</p>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => handleSend(action.prompt)}
                className="flex items-center gap-3 bg-[#F2F2F7] rounded-xl px-4 py-3.5 active:bg-[#E5E5EA] transition-colors"
              >
                <div className="flex-shrink-0">{action.icon}</div>
                <span className="text-sm font-medium text-[#1C1C1E]">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 對話區域 - Apple iMessage 風格 */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className="space-y-2">
            <div className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {/* 幕僚長頭像 - 小型、低調 */}
              {msg.role === "assistant" && (
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#E8611A] flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                    <circle cx="12" cy="8" r="3.5" />
                    <path d="M5 20c0-3.5 3.5-5.5 7-5.5s7 2 7 5.5" />
                  </svg>
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 ${
                  msg.role === "user"
                    ? "bg-[#007AFF] rounded-br-sm"
                    : "bg-[#E9E9EB] rounded-bl-sm"
                }`}
              >
                <p className={`text-[15px] whitespace-pre-wrap leading-snug ${
                  msg.role === "user" ? "text-white" : "text-[#1C1C1E]"
                }`}>{msg.content}</p>
                <p
                  className={`text-[10px] mt-1.5 ${
                    msg.role === "user" ? "text-white/60" : "text-[#8E8E93]"
                  }`}
                >
                  {msg.timestamp.toLocaleTimeString("zh-TW", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            {/* AI 員工推薦卡片 - Apple 風格 */}
            {msg.recommendations && msg.recommendations.length > 0 && (
              <div className="ml-9 space-y-2">
                <p className="text-xs text-[#8E8E93] flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                  </svg>
                  推薦團隊成員
                </p>
                {msg.recommendations.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => toggleAgentSelection(agent.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                      selectedAgents.includes(agent.id)
                        ? "bg-[#E8611A] text-white"
                        : "bg-[#F2F2F7] text-[#1C1C1E]"
                    }`}
                  >
                    {/* 頭像 */}
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-base font-medium bg-white/20 overflow-hidden">
                      {agent.avatar ? (
                        <img src={agent.avatar} alt={agent.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className={selectedAgents.includes(agent.id) ? "text-white" : "text-[#3C3C43]"}>
                          {agent.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    {/* 資訊 */}
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-sm truncate">{agent.name}</span>
                        {agent.role === "primary" && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            selectedAgents.includes(agent.id) 
                              ? "bg-white/20 text-white" 
                              : "bg-[#E8611A]/10 text-[#E8611A]"
                          }`}>
                            主責
                          </span>
                        )}
                      </div>
                      <p className={`text-xs truncate ${selectedAgents.includes(agent.id) ? "text-white/80" : "text-[#8E8E93]"}`}>
                        {agent.title}
                      </p>
                    </div>
                    {/* 選中標記 */}
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      selectedAgents.includes(agent.id) 
                        ? "border-white bg-white" 
                        : "border-[#C7C7CC]"
                    }`}>
                      {selectedAgents.includes(agent.id) && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#E8611A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* 建議操作按鈕 - Apple 風格 */}
            {msg.suggestedActions && msg.suggestedActions.length > 0 && (
              <div className="ml-9 flex flex-wrap gap-2">
                {msg.suggestedActions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAction(action)}
                    className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      action.action === "confirm_team"
                        ? "bg-[#E8611A] text-white"
                        : "bg-[#F2F2F7] text-[#007AFF]"
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Loading 動畫 - Apple 風格 */}
        {isLoading && (
          <div className="flex gap-2.5 justify-start">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#E8611A] flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                <circle cx="12" cy="8" r="3.5" />
                <path d="M5 20c0-3.5 3.5-5.5 7-5.5s7 2 7 5.5" />
              </svg>
            </div>
            <div className="bg-[#E9E9EB] rounded-2xl rounded-bl-sm px-3.5 py-2.5">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-[#8E8E93] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 bg-[#8E8E93] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 bg-[#8E8E93] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* 輸入區域 - Apple iMessage 風格 */}
      <div className="flex-shrink-0 px-4 py-3 bg-white border-t border-[#C6C6C8]">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="訊息"
            className="flex-1 px-4 py-2 bg-[#F2F2F7] rounded-full text-[15px] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 placeholder:text-[#8E8E93]"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="w-8 h-8 flex items-center justify-center bg-[#007AFF] text-white rounded-full disabled:bg-[#C7C7CC] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
