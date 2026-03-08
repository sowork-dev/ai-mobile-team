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
import { getDemoData } from "../demoData";
import { useI18n } from "@/i18n";

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
  const { locale, t } = useI18n();

  const demoPersonaId = localStorage.getItem("demoPersonaId");
  const demoAssistant = demoPersonaId ? getDemoData(demoPersonaId) : null;

  // 今日 AI 工作摘要資料
  const { data: completedTasks } = trpc.chiefOfStaff.tasks.useQuery(
    { status: "completed" },
    { enabled: !demoPersonaId }
  );
  const completedCount = demoAssistant?.assistantContext.completedToday ?? (completedTasks?.length ?? 0);
  const timeSavedHours = demoAssistant?.assistantContext.timeSavedHours ?? (completedCount * 2);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: demoAssistant?.assistantContext.welcomeMessage ?? t("assistant.defaultWelcome"),
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
        content: t("assistant.errorResponse"),
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
        const userMessages = messages.filter(m => m.role === "user");
        const lastUserMessage = userMessages[userMessages.length - 1]?.content || "";

        const result = await confirmTeamMutation.mutateAsync({
          agentIds: selectedAgents,
          taskTitle: lastUserMessage.slice(0, 30) || (locale === "zh" ? "新任務" : "New Task"),
          taskDescription: lastUserMessage,
        });

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: result.message,
          timestamp: new Date(),
          suggestedActions: [
            { label: locale === "zh" ? "查看任務詳情" : "View Task", action: "view_task", params: { taskId: result.taskId } },
            { label: locale === "zh" ? "繼續對話" : "Continue", action: "continue" },
          ],
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setSelectedAgents([]);
      } catch (error) {
        console.error("Confirm team error:", error);
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: t("assistant.teamError"),
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    } else if (action.action === "view_task" && action.params?.taskId) {
      window.location.href = `/app/tasks/${action.params.taskId}`;
    } else if (action.action === "change_team") {
      handleSend(locale === "zh" ? "請推薦其他人選" : "Please recommend other candidates");
    } else if (action.action === "new_call_summary") {
      handleSend(locale === "zh" ? "我剛打完電話，幫我整理通話重點" : "I just finished a call, help me summarize the key points");
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

  const defaultQuickActionDefs = [
    { label: t("assistant.quickAction1"), prompt: t("assistant.quickAction1Prompt") },
    { label: t("assistant.quickAction2"), prompt: t("assistant.quickAction2Prompt") },
    { label: t("assistant.quickAction3"), prompt: t("assistant.quickAction3Prompt") },
    { label: t("assistant.quickAction4"), prompt: t("assistant.quickAction4Prompt") },
  ];

  const quickActionDefs = demoAssistant?.assistantContext.quickActions ?? defaultQuickActionDefs;

  const defaultIcon = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3C3C43" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
    </svg>
  );

  const quickActions = quickActionDefs.map((qa, i) => ({
    label: qa.label,
    prompt: qa.prompt,
    icon: [
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3C3C43" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" key="0">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>,
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3C3C43" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" key="1">
        <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>,
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3C3C43" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" key="2">
        <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /><path d="M9 16l2 2 4-4" />
      </svg>,
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3C3C43" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" key="3">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6 6l.86-.86a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16z" />
      </svg>,
    ][i] ?? defaultIcon,
  }));

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex-shrink-0 bg-white/95 backdrop-blur-lg border-b border-gray-200/60 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E8611A] flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <circle cx="12" cy="8" r="3.5" />
                <path d="M5 20c0-3.5 3.5-5.5 7-5.5s7 2 7 5.5" />
              </svg>
            </div>
            <span className="text-base font-medium text-[#1C1C1E]">{t("assistant.title")}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.location.href = "/app/company-settings"}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 rounded-lg active:bg-blue-100 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 1.5 17V4.5A2.5 2.5 0 0 1 4 2h8.5L17 6.5V17a2.5 2.5 0 0 1-2.5 2.5H4z" transform="scale(1.2) translate(-1,-1)" />
                <path d="M12 2v5h5" transform="scale(1.2) translate(-1,-1)" />
              </svg>
              <span className="text-xs text-blue-600 font-medium">{t("assistant.knowledgeBase")}</span>
            </button>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#34C759]" />
              <span className="text-xs text-[#8E8E93]">{t("assistant.statusOnline")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 今日 AI 工作摘要 */}
      {messages.length <= 1 && (
        <div className="flex-shrink-0 mx-4 mt-4 mb-1 bg-gradient-to-r from-[#1C1C1E] to-[#3A3A3C] rounded-2xl p-4">
          <p className="text-[11px] text-white/50 mb-2 tracking-wide uppercase">{t("assistant.todaySummary")}</p>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-2xl font-bold text-white">{completedCount}</p>
              <p className="text-[12px] text-white/60 mt-0.5">{t("assistant.tasksCompleted")}</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="flex-1">
              <p className="text-2xl font-bold text-[#34C759]">{timeSavedHours}h</p>
              <p className="text-[12px] text-white/60 mt-0.5">{t("assistant.timeSaved")}</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="flex-1 text-right">
              <div className="flex items-center justify-end gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#30D158" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <p className="text-[12px] text-[#30D158] font-medium">Slack</p>
              </div>
              <p className="text-[11px] text-white/40 mt-0.5">{t("assistant.noSlackNeeded")}</p>
            </div>
          </div>
          {completedCount === 0 && (
            <p className="text-[11px] text-white/40 mt-2">{t("assistant.firstTaskPrompt")}</p>
          )}
        </div>
      )}

      {/* 快速操作區 */}
      {messages.length <= 1 && (
        <div className="flex-shrink-0 px-4 py-5">
          <p className="text-xs text-[#8E8E93] mb-3 tracking-wide">{t("assistant.quickStart")}</p>
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

      {/* 對話區域 */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className="space-y-2">
            <div className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
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
                  {msg.timestamp.toLocaleTimeString(locale === "zh" ? "zh-TW" : "en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            {/* AI 員工推薦卡片 */}
            {msg.recommendations && msg.recommendations.length > 0 && (
              <div className="ml-9 space-y-2">
                <p className="text-xs text-[#8E8E93] flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                  </svg>
                  {t("assistant.recommendedTeam")}
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
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-base font-medium bg-white/20 overflow-hidden">
                      {agent.avatar ? (
                        <img src={agent.avatar} alt={agent.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className={selectedAgents.includes(agent.id) ? "text-white" : "text-[#3C3C43]"}>
                          {agent.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-sm truncate">{agent.name}</span>
                        {agent.role === "primary" && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            selectedAgents.includes(agent.id)
                              ? "bg-white/20 text-white"
                              : "bg-[#E8611A]/10 text-[#E8611A]"
                          }`}>
                            {t("assistant.primaryTag")}
                          </span>
                        )}
                      </div>
                      <p className={`text-xs truncate ${selectedAgents.includes(agent.id) ? "text-white/80" : "text-[#8E8E93]"}`}>
                        {agent.title}
                      </p>
                    </div>
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

            {/* 建議操作按鈕 */}
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

        {/* Loading 動畫 */}
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

      {/* 輸入區域 */}
      <div className="flex-shrink-0 px-4 py-3 bg-white border-t border-[#C6C6C8]">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={t("assistant.messagePlaceholder")}
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
