/**
 * 群組聊天頁面 — 品牌群組內的對話
 * AI 員工可以參與對話、回答問題、協助任務
 * Sprint2-C: 聊天即任務 + AI 回應可直接下載
 */
import { useState, useRef, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { useI18n } from "@/i18n";
import RegroupConversation from "../components/RegroupConversation";
import MessageActions from "../components/MessageActions";
import { getDemoData } from "../demoData";

interface TaskAction {
  type: "download_report";
  label: string;
  taskTitle: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  agentId?: number;
  agentName?: string;
  agentAvatar?: string;
  timestamp: Date;
  taskCreated?: boolean;
  taskAction?: TaskAction;
}

export default function MobileGroupChatPage() {
  const [, navigate] = useLocation();
  const params = useParams<{ groupId: string }>();
  const { locale } = useI18n();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showRegroup, setShowRegroup] = useState(false);
  const [taskMode, setTaskMode] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Demo fallback — 從 localStorage 讀取 persona，找對應的群組資料
  const demoPersonaId = localStorage.getItem("demoPersonaId");
  const demoGroupData = (() => {
    if (!demoPersonaId || !params.groupId) return null;
    const data = getDemoData(demoPersonaId);
    if (!data) return null;
    const demoGroup = data.brandGroups.find(g => g.id === params.groupId);
    if (!demoGroup) return null;
    // 轉成 getBrandGroup 的格式
    return {
      id: demoGroup.id,
      brandName: demoGroup.brandName,
      description: `${demoGroup.brandName} AI 協作群組`,
      members: demoGroup.members.map((m, i) => ({
        id: i + 1,
        name: m.name,
        role: i === 0 ? "secretary" : "operations",
        avatar: null,
        type: "ai" as const,
      })),
    };
  })();

  // 獲取群組資訊（優先 server，fallback demo）
  const { data: serverGroup, isLoading: groupLoading } = trpc.company.getBrandGroup.useQuery(
    { groupId: params.groupId || "" },
    { enabled: !!params.groupId && !demoGroupData }
  );
  const group = demoGroupData || serverGroup;

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
            content: `你好！我是 ${primaryAgent.name}，${group.brandName} 群組的主要負責人。有什麼我可以幫助你的嗎？\n\n💡 點擊「⚡ 派任務」，我可以直接幫你完成任務並產出報告。`,
            agentId: primaryAgent.id,
            agentName: primaryAgent.name,
            agentAvatar: primaryAgent.avatar || undefined,
            timestamp: new Date(),
          },
        ]);
      }
    }
  }, [group]);

  // 偵測訊息是否包含任務意圖
  const detectTaskIntent = (text: string): string | null => {
    const lower = text.toLowerCase();
    if (lower.includes("分析競品") || lower.includes("競品分析")) return "競品分析報告";
    if (lower.includes("市場分析") || lower.includes("市場調查")) return "市場分析報告";
    if (lower.includes("品牌定位") || lower.includes("定位分析")) return "品牌定位報告";
    if (lower.includes("內容策略") || lower.includes("內容規劃")) return "內容策略報告";
    if (lower.includes("數據分析") || lower.includes("數據報告")) return "數據分析報告";
    if (lower.includes("週報") || lower.includes("月報")) return "工作報告";
    if (lower.includes("報告") || lower.includes("分析")) return "分析報告";
    if (lower.includes("任務") || lower.includes("幫我")) return "任務報告";
    return null;
  };

  // 發送訊息
  const handleSend = async (overrideTaskMode?: boolean) => {
    if (!input.trim() || isLoading) return;

    const isTask = overrideTaskMode ?? taskMode;
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: isTask ? `⚡ [派任務] ${input.trim()}` : input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const sentInput = input.trim();
    setInput("");
    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, isTask ? 2000 : 1500));

      const members = group?.members || [];
      const respondingAgent = members[Math.floor(Math.random() * members.length)] || {
        id: 0,
        name: "AI 助手",
        avatar: null,
      };

      const taskTitle = isTask ? detectTaskIntent(sentInput) || "任務報告" : null;
      const responseContent = isTask
        ? generateTaskResponse(sentInput, group?.brandName || "", taskTitle!)
        : generateResponse(sentInput, group?.brandName || "");

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseContent,
        agentId: respondingAgent.id,
        agentName: respondingAgent.name,
        agentAvatar: respondingAgent.avatar || undefined,
        timestamp: new Date(),
        taskCreated: isTask,
        taskAction: isTask
          ? { type: "download_report", label: `✅ 任務完成 — 點擊下載報告`, taskTitle: taskTitle! }
          : undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      if (isTask) setTaskMode(false);
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 處理下載報告（模擬）
  const handleMessageAction = (actionId: string, messageContent: string) => {
    // 把動作轉成一條使用者訊息，觸發 AI 執行
    const actionLabels: Record<string, string> = {
      "create-task": `請根據以下內容建立任務：${messageContent.slice(0, 100)}`,
      "add-calendar": `請把以下事項加入行事曆：${messageContent.slice(0, 100)}`,
      "set-reminder": `請設定提醒：${messageContent.slice(0, 100)}`,
      "generate-contract": `請根據以下內容生成合約草稿：${messageContent.slice(0, 100)}`,
      "generate-report": `請根據以下內容生成報表：${messageContent.slice(0, 100)}`,
      "create-presentation": `請根據以下內容建立簡報大綱：${messageContent.slice(0, 100)}`,
      "schedule-meeting": `請安排以下會議：${messageContent.slice(0, 100)}`,
      "pdf-report": `請將以下內容整理成 PDF 報告：${messageContent.slice(0, 100)}`,
      "spreadsheet": `請將以下資料整理成試算表：${messageContent.slice(0, 100)}`,
      "markdown": `請將以下內容整理成摘要筆記：${messageContent.slice(0, 100)}`,
    };
    const text = actionLabels[actionId] || `執行操作：${actionId}`;
    setInput(text);
    setTimeout(() => handleSend(false), 100);
  };

  const handleDownloadReport = async (msgId: string, taskTitle: string) => {
    setDownloadingId(msgId);
    await new Promise((resolve) => setTimeout(resolve, 800));

    // 產生簡易文字報告並觸發下載
    const reportContent = generateReportContent(taskTitle, group?.brandName || "品牌");
    const blob = new Blob([reportContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${taskTitle}_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadingId(null);
  };

  // 生成任務型 AI 回覆
  const generateTaskResponse = (userInput: string, brandName: string, taskTitle: string): string => {
    return `收到！我已為「${brandName}」啟動 **${taskTitle}** 任務。\n\n正在執行：\n• 資料收集與整理\n• AI 深度分析\n• 產出專業報告\n\n✅ 分析完成！報告已就緒，點擊下方按鈕立即下載。`;
  };

  // 生成一般 AI 回覆
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

  // 產生報告內容
  const generateReportContent = (taskTitle: string, brandName: string): string => {
    const date = new Date().toLocaleDateString("zh-TW");
    return `${taskTitle}
品牌：${brandName}
產出日期：${date}
產出方式：SoWork AI 自動分析

═══════════════════════════════

一、執行摘要
本報告由 SoWork AI 團隊自動完成，分析時間：< 3 分鐘
（傳統人工分析需要 2-4 小時）

二、主要發現
• 市場定位清晰，具備差異化優勢
• 目標客群集中於 25-40 歲都市專業人士
• 數位渠道覆蓋率達 78%，有提升空間

三、行動建議
1. 強化社群媒體內容策略
2. 優化用戶觸點體驗
3. 加強 KOL 合作推廣

四、下一步行動
建議在 2 週內完成方案細化，SoWork AI 可自動追蹤執行進度。

═══════════════════════════════
由 SoWork AI 自動產出 | 節省時間 2+ 小時
`;
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

          {/* 一鍵分類按鈕 */}
          <button
            onClick={() => setShowRegroup(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-[#F2F2F7] rounded-lg active:scale-95 transition-transform"
            title={locale === "zh" ? "按主題分類對話" : "Classify by topic"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#007AFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 6h16M4 12h10M4 18h7"/>
              <circle cx="20" cy="16" r="3"/>
              <path d="M22 22l-2-2"/>
            </svg>
            <span className="text-[#007AFF] text-xs font-medium">{locale === "zh" ? "分類" : "Sort"}</span>
          </button>

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

              {/* 任務完成下載按鈕 — 就在對話裡，一鍵下載 */}
              {msg.taskAction && msg.role === "assistant" && (
                <button
                  onClick={() => handleDownloadReport(msg.id, msg.taskAction!.taskTitle)}
                  disabled={downloadingId === msg.id}
                  className="mt-2 ml-1 flex items-center gap-2 px-4 py-2.5 bg-[#34C759] text-white rounded-xl font-semibold text-sm shadow-sm active:opacity-80 transition-opacity disabled:opacity-60"
                >
                  {downloadingId === msg.id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>準備下載中...</span>
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      <span>{msg.taskAction.label}</span>
                    </>
                  )}
                </button>
              )}

              {/* 快捷功能 — AI 訊息旁 */}
              {msg.role === "assistant" && (
                <MessageActions
                  agentRole={msg.agentId ? String(msg.agentId) : "default"}
                  messageId={msg.id}
                  messageContent={msg.content}
                  onAction={handleMessageAction}
                />
              )}

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

      {/* 派任務模式提示條 */}
      {taskMode && (
        <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-[#E8611A]/10 border-t border-[#E8611A]/20">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E8611A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          <p className="text-xs text-[#E8611A] font-medium flex-1">派任務模式：AI 將直接完成任務並產出可下載報告</p>
          <button onClick={() => setTaskMode(false)} className="text-[#8E8E93] text-xs">取消</button>
        </div>
      )}

      {/* 輸入區 */}
      <div className="flex-shrink-0 px-4 py-3 bg-white border-t border-[#C6C6C8]">
        <div className="flex items-center gap-2">
          {/* 派任務快捷按鈕 */}
          <button
            onClick={() => setTaskMode((v) => !v)}
            className={`flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
              taskMode ? "bg-[#E8611A] text-white" : "bg-[#F2F2F7] text-[#3C3C43]"
            }`}
            title="派任務"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={taskMode ? "描述任務，AI 直接完成..." : (locale === "zh" ? "輸入訊息..." : "Message...")}
            className={`flex-1 px-4 py-2.5 rounded-full text-[15px] focus:outline-none focus:ring-2 placeholder:text-[#8E8E93] ${
              taskMode
                ? "bg-[#E8611A]/10 focus:ring-[#E8611A]/30 text-[#1C1C1E]"
                : "bg-[#F2F2F7] focus:ring-[#007AFF]/30"
            }`}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="w-9 h-9 flex items-center justify-center bg-[#007AFF] text-white rounded-full disabled:bg-[#C7C7CC] transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* 按主題分類對話彈窗 */}
      {showRegroup && (
        <RegroupConversation
          chatId={params.groupId || "default"}
          onClose={() => setShowRegroup(false)}
        />
      )}
    </div>
  );
}
