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
        const result = await confirmTeamMutation.mutateAsync({
          agentIds: selectedAgents,
          taskTitle: "新任務",
          taskDescription: messages[messages.length - 2]?.content || "",
        });
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: result.message,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setSelectedAgents([]);
      } catch (error) {
        console.error("Confirm team error:", error);
      } finally {
        setIsLoading(false);
      }
    } else if (action.action === "change_team") {
      handleSend("請推薦其他人選");
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

  // 快速操作按鈕 - 更精緻的設計
  const quickActions = [
    { 
      label: "組建團隊", 
      prompt: "我需要組建一個團隊來處理行銷專案",
      gradient: "from-orange-500 to-rose-500",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    },
    { 
      label: "派發任務", 
      prompt: "我要派發一個任務",
      gradient: "from-blue-500 to-indigo-500",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      )
    },
    { 
      label: "今日待辦", 
      prompt: "查看我今天的待辦事項",
      gradient: "from-emerald-500 to-teal-500",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /><path d="M9 16l2 2 4-4" />
        </svg>
      )
    },
    { 
      label: "查看進度", 
      prompt: "查看目前任務的進度",
      gradient: "from-violet-500 to-purple-500",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 20V10M12 20V4M6 20v-6" />
        </svg>
      )
    },
  ];

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-50 to-white">
      {/* 自定義 Header - 帶有幕僚長品牌感 */}
      <div className="flex-shrink-0 bg-white/80 backdrop-blur-lg border-b border-gray-100 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          {/* 幕僚長頭像 - 橘色漸變 */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center shadow-lg shadow-orange-500/25">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
            </svg>
          </div>
          <div>
            <h1 className="font-semibold text-gray-900">幕僚長</h1>
            <p className="text-xs text-gray-500">您的 AI 管理助理</p>
          </div>
          {/* 狀態指示燈 */}
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-emerald-600 font-medium">在線</span>
          </div>
        </div>
      </div>

      {/* 快速操作區 - 卡片式設計 */}
      {messages.length <= 1 && (
        <div className="flex-shrink-0 p-4">
          <p className="text-xs text-gray-500 mb-3 font-medium">快速開始</p>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => handleSend(action.prompt)}
                className="group relative overflow-hidden bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-[0.98] transition-all duration-200"
              >
                {/* 漸變背景 hover 效果 */}
                <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-active:opacity-10 transition-opacity`} />
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-3 text-white shadow-sm`}>
                  {action.icon}
                </div>
                <span className="font-medium text-sm text-gray-800">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 對話區域 */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className="space-y-3">
            <div className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {/* 幕僚長頭像 */}
              {msg.role === "assistant" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center shadow-md shadow-orange-500/20">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                  </svg>
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-br-md shadow-lg"
                    : "bg-white text-gray-800 rounded-bl-md shadow-sm border border-gray-100"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                <p
                  className={`text-[10px] mt-2 ${
                    msg.role === "user" ? "text-gray-400" : "text-gray-400"
                  }`}
                >
                  {msg.timestamp.toLocaleTimeString("zh-TW", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            {/* AI 員工推薦卡片 - 精緻設計 */}
            {msg.recommendations && msg.recommendations.length > 0 && (
              <div className="ml-11 space-y-2">
                <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                  </svg>
                  推薦團隊成員
                </p>
                {msg.recommendations.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => toggleAgentSelection(agent.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 transition-all duration-200 ${
                      selectedAgents.includes(agent.id)
                        ? "bg-gradient-to-r from-orange-500 to-rose-500 border-transparent text-white shadow-lg shadow-orange-500/25"
                        : "bg-white border-gray-100 text-gray-800 hover:border-orange-200"
                    }`}
                  >
                    {/* 頭像 */}
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center text-lg font-semibold ${
                      selectedAgents.includes(agent.id) 
                        ? "bg-white/20" 
                        : "bg-gradient-to-br from-gray-100 to-gray-200"
                    }`}>
                      {agent.avatar ? (
                        <img src={agent.avatar} alt={agent.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className={selectedAgents.includes(agent.id) ? "text-white" : "text-gray-600"}>
                          {agent.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    {/* 資訊 */}
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{agent.name}</span>
                        {agent.role === "primary" && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            selectedAgents.includes(agent.id) 
                              ? "bg-white/20 text-white" 
                              : "bg-orange-100 text-orange-600"
                          }`}>
                            主責
                          </span>
                        )}
                      </div>
                      <p className={`text-xs ${selectedAgents.includes(agent.id) ? "text-white/80" : "text-gray-500"}`}>
                        {agent.title}
                      </p>
                      <p className={`text-xs mt-0.5 ${selectedAgents.includes(agent.id) ? "text-white/70" : "text-gray-400"}`}>
                        {agent.reason}
                      </p>
                    </div>
                    {/* 選中標記 */}
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      selectedAgents.includes(agent.id) 
                        ? "border-white bg-white" 
                        : "border-gray-300"
                    }`}>
                      {selectedAgents.includes(agent.id) && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E8611A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* 建議操作按鈕 */}
            {msg.suggestedActions && msg.suggestedActions.length > 0 && (
              <div className="ml-11 flex flex-wrap gap-2">
                {msg.suggestedActions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAction(action)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      action.action === "confirm_team"
                        ? "bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/25 active:scale-95"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95"
                    }`}
                  >
                    {action.action === "confirm_team" && (
                      <span className="mr-1.5">✓</span>
                    )}
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Loading 動畫 */}
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center shadow-md shadow-orange-500/20">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
              </svg>
            </div>
            <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-gray-100">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* 輸入區域 - 浮動設計 */}
      <div className="flex-shrink-0 p-4 bg-gradient-to-t from-white via-white to-transparent">
        <div className="flex items-center gap-3 bg-white rounded-2xl border border-gray-200 p-1.5 shadow-lg shadow-gray-200/50">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="告訴幕僚長你需要什麼幫助..."
            className="flex-1 px-3 py-2 bg-transparent text-sm focus:outline-none placeholder:text-gray-400"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-orange-500 to-rose-500 text-white rounded-xl disabled:opacity-50 transition-all active:scale-95 shadow-md shadow-orange-500/25"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
