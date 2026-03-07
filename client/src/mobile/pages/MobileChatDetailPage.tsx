/**
 * 聊天詳情頁面 — 與 AI 員工或真實同事的對話介面
 * 支援：Markdown 渲染、訊息工具列、輸出格式選單、交付物卡片、等待動畫
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import MobileHeader from "../components/MobileHeader";
import MessageActions from "../components/MessageActions";

// ── 類型定義 ──────────────────────────────────────────────────
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  agentName?: string;
  deliverable?: DeliverableData;
  isStreaming?: boolean;
}

interface DeliverableData {
  type: "presentation" | "pdf" | "markdown";
  title: string;
  url?: string;
  status: "generating" | "ready";
}

// ── 輸出格式選單（聊天版，僅 3 個）────────────────────────────
const OUTPUT_FORMATS = [
  {
    id: "presentation",
    label: "簡報 PPT",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="14" height="11" rx="1.5" />
        <path d="M6 16h6M9 13v3" />
      </svg>
    ),
  },
  {
    id: "pdf",
    label: "PDF 報告",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 2H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V6z" />
        <path d="M10 2v4h4" />
        <path d="M6 9h6M6 12h4" />
      </svg>
    ),
  },
  {
    id: "markdown",
    label: "Markdown",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3h12v12H3z" rx="1" />
        <path d="M5 12V7l2.5 3 2.5-3v5M12 12V9l-1.5 1.5" />
      </svg>
    ),
  },
];

// ── 等待動畫（三層次）────────────────────────────────────────
function WaitingAnimation({ elapsed }: { elapsed: number }) {
  if (elapsed < 5) {
    // 0-5s：簡單三點
    return (
      <div className="flex gap-1.5 items-center h-4">
        {[0, 150, 300].map((delay) => (
          <div
            key={delay}
            className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    );
  } else if (elapsed < 15) {
    // 5-15s：進度條 + 提示
    return (
      <div className="space-y-2">
        <div className="flex gap-1.5 items-center">
          {[0, 150, 300].map((delay) => (
            <div
              key={delay}
              className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
          <span className="text-xs text-gray-500 ml-1">正在思考中...</span>
        </div>
        <div className="w-32 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gray-600 rounded-full transition-all duration-1000"
            style={{ width: `${Math.min(((elapsed - 5) / 10) * 100, 90)}%` }}
          />
        </div>
      </div>
    );
  } else {
    // 15-30s+：更詳細的狀態
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-gray-500">正在深度分析，請稍候...</span>
        </div>
        <p className="text-xs text-gray-400">這個問題需要更多時間，通常在 30 秒內完成</p>
      </div>
    );
  }
}

// ── 訊息工具列 ────────────────────────────────────────────────
function MessageToolbar({
  message,
  onSaveAsTask,
  onOutputFormat,
  onClose,
}: {
  message: Message;
  onSaveAsTask: () => void;
  onOutputFormat: (format: string) => void;
  onClose: () => void;
}) {
  const [showFormats, setShowFormats] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    toast.success("已複製到剪貼簿");
    onClose();
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([message.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `message-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("已下載 .txt 檔案");
    onClose();
  };

  return (
    <div className="absolute bottom-full left-0 mb-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 min-w-[200px]">
      {!showFormats ? (
        <div className="py-1">
          <button
            onClick={handleCopy}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 active:bg-gray-50"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="5" width="9" height="9" rx="1" />
              <path d="M3 11V3a1 1 0 0 1 1-1h8" />
            </svg>
            複製
          </button>
          <button
            onClick={handleDownloadTxt}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 active:bg-gray-50"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 2v9M4 7l4 4 4-4M2 13h12" />
            </svg>
            下載 .txt
          </button>
          <button
            onClick={onSaveAsTask}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 active:bg-gray-50"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 5l-6 6-3-3" />
              <rect x="2" y="2" width="12" height="12" rx="1.5" />
            </svg>
            儲存為任務
          </button>
          <button
            onClick={() => setShowFormats(true)}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 active:bg-gray-50"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 4h12M2 8h8M2 12h5" />
            </svg>
            輸出格式
            <svg className="ml-auto" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M4 5l2 2 2-2" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="py-1">
          <button
            onClick={() => setShowFormats(false)}
            className="w-full flex items-center gap-2 px-4 py-2 text-xs text-gray-500 active:bg-gray-50 border-b border-gray-100"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M9 3L5 7l4 4" />
            </svg>
            輸出格式
          </button>
          {OUTPUT_FORMATS.map((fmt) => (
            <button
              key={fmt.id}
              onClick={() => { onOutputFormat(fmt.id); onClose(); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 active:bg-gray-50"
            >
              <span className="text-gray-500">{fmt.icon}</span>
              {fmt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 交付物卡片 ────────────────────────────────────────────────
function DeliverableCard({ deliverable }: { deliverable: DeliverableData }) {
  const typeIcons = {
    presentation: "📊",
    pdf: "📄",
    markdown: "📝",
  };
  const typeLabels = {
    presentation: "簡報 PPT",
    pdf: "PDF 報告",
    markdown: "Markdown 檔案",
  };

  return (
    <div className="mt-2 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <div className="flex items-center gap-3 px-3 py-2.5 border-b border-gray-100">
        <span className="text-xl">{typeIcons[deliverable.type]}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{deliverable.title}</p>
          <p className="text-xs text-gray-500">{typeLabels[deliverable.type]}</p>
        </div>
        {deliverable.status === "generating" ? (
          <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
        ) : (
          <button className="flex items-center gap-1 text-xs text-gray-900 font-medium px-2.5 py-1.5 bg-gray-50 rounded-lg active:bg-gray-100">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 1v7M2 5l4 4 4-4M1 10h10" />
            </svg>
            下載
          </button>
        )}
      </div>
    </div>
  );
}

// ── 主要聊天頁面 ──────────────────────────────────────────────
export default function MobileChatDetailPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const [, navigate] = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingElapsed, setLoadingElapsed] = useState(0);
  const [activeToolbar, setActiveToolbar] = useState<string | null>(null);
  const [showOutputFormat, setShowOutputFormat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const loadingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 取得 CMO 策略聊天 mutation
  const strategyChatMutation = trpc.cmo.strategyChat.useMutation();

  // 模擬初始訊息
  useEffect(() => {
    const agentName = getAgentName(conversationId);
    setMessages([
      {
        id: "1",
        role: "assistant",
        content: `您好！我是 **${agentName}**，您的專屬 AI 顧問。\n\n我已準備好為您提供專業建議，請告訴我您需要什麼幫助？`,
        timestamp: new Date(),
        agentName,
      },
    ]);
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // 等待計時器
  useEffect(() => {
    if (isLoading) {
      setLoadingElapsed(0);
      loadingTimerRef.current = setInterval(() => {
        setLoadingElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (loadingTimerRef.current) {
        clearInterval(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
    }
    return () => {
      if (loadingTimerRef.current) clearInterval(loadingTimerRef.current);
    };
  }, [isLoading]);

  const getAgentName = (id: string) => {
    const map: Record<string, string> = {
      "vivian-brand": "Vivian",
      "ken-copy": "Ken",
      "luna-design": "Luna",
      "max-data": "Max",
    };
    return map[id] || "AI 顧問";
  };

  const getAgentAvatarBg = (id: string) => {
    const map: Record<string, string> = {
      "vivian-brand": "from-gray-700 to-gray-900",
      "ken-copy": "from-gray-600 to-gray-800",
      "luna-design": "from-gray-500 to-gray-700",
      "max-data": "from-gray-600 to-gray-800",
    };
    return map[id] || "from-gray-600 to-gray-800";
  };

  // 取得 AI 職位（用於訊息旁功能）
  const getAgentRole = (id: string) => {
    const map: Record<string, string> = {
      "vivian-brand": "pm",        // 品牌 = PM
      "ken-copy": "pm",            // 文案 = PM  
      "luna-design": "pm",         // 設計 = PM
      "max-data": "finance",       // 數據 = Finance
      "rita-hr": "hr",
      "finance-ai": "finance",
      "it-support": "it",
      "secretary": "secretary",
      "operations": "operations",
    };
    return map[id] || "default";
  };

  // 處理訊息旁功能
  const handleMessageAction = (actionId: string, messageContent: string) => {
    const actionLabels: Record<string, string> = {
      "create-task": "建立任務",
      "add-calendar": "加入行事曆",
      "set-reminder": "設提醒",
      "generate-contract": "生成合約",
      "onboarding-task": "入職任務",
      "generate-report": "生成報表",
      "create-expense": "建立報銷單",
      "create-presentation": "建立簡報",
      "schedule-meeting": "排程會議",
      "create-ticket": "建立工單",
      "tech-doc": "技術文件",
      "pdf-report": "PDF 報告",
      "spreadsheet": "試算表",
      "markdown": "摘要筆記",
      "notify-team": "通知相關人",
    };
    toast.success(`正在${actionLabels[actionId] || actionId}...`);
    // TODO: 實際執行對應功能
  };

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg || isLoading) return;
    setInput("");

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: msg,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // 嘗試呼叫真實 API（需要 recruitmentId）
      // 這裡先用模擬回應
      await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1000));

      const agentName = getAgentName(conversationId);
      const responses = [
        `根據您的品牌定位分析，我建議您在社群媒體上採用以下策略：\n\n1. **內容主題**：聚焦在品牌核心價值，每週發布 3-4 篇高品質貼文\n2. **互動策略**：在晚間 7-9 點發布，提升觸及率\n3. **視覺風格**：保持一致的品牌色調，建立視覺識別度`,
        `這是個很好的問題！根據市場數據分析：\n\n- 目標受眾的活躍時段主要在**晚間 8-10 點**\n- Instagram 的互動率比 Facebook 高出 **3.2 倍**\n- 短影音內容的觸及率是靜態圖片的 **5 倍**\n\n建議優先投入 Instagram Reels 的製作。`,
        `我已為您分析了競品策略，以下是主要發現：\n\n**競品 A**：主打性價比，月均發文 20 篇\n**競品 B**：聚焦品質感，KOL 合作頻繁\n\n您的差異化機會在於**結合品質感與故事性**，這是目前市場的空白點。`,
      ];

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
        agentName,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      toast.error("發送失敗，請重試");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSaveAsTask = (msg: Message) => {
    toast.success("已儲存為任務，可在任務頁查看");
    setActiveToolbar(null);
  };

  const handleOutputFormat = (format: string) => {
    const labels: Record<string, string> = {
      presentation: "簡報 PPT",
      pdf: "PDF 報告",
      markdown: "Markdown 檔案",
    };
    toast.success(`正在生成 ${labels[format]}...`);
    // 模擬生成交付物
    const deliverable: DeliverableData = {
      type: format as any,
      title: `${getAgentName(conversationId)} 的分析報告`,
      status: "generating",
    };
    const delivMsg: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content: `正在為您生成 ${labels[format]}，請稍候...`,
      timestamp: new Date(),
      agentName: getAgentName(conversationId),
      deliverable,
    };
    setMessages((prev) => [...prev, delivMsg]);
    // 模擬生成完成
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === delivMsg.id
            ? {
                ...m,
                content: `您的 ${labels[format]} 已生成完畢，請點擊下方下載。`,
                deliverable: { ...deliverable, status: "ready" },
              }
            : m
        )
      );
    }, 3000);
  };

  const agentName = getAgentName(conversationId);
  const agentBg = getAgentAvatarBg(conversationId);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div
        className="flex-shrink-0 bg-white border-b border-gray-100 flex items-center px-4 h-14 gap-3"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <button
          onClick={() => navigate("/chat")}
          className="w-9 h-9 flex items-center justify-center rounded-full active:bg-gray-100 -ml-1"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.5 5L7.5 10L12.5 15" />
          </svg>
        </button>
        <div
          className={`w-9 h-9 rounded-full bg-gradient-to-br ${agentBg} flex items-center justify-center text-white font-bold text-sm`}
        >
          {agentName[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{agentName}</p>
          <p className="text-xs text-green-500">線上</p>
        </div>
        <button className="w-9 h-9 flex items-center justify-center rounded-full active:bg-gray-100">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#6B7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="10" cy="5" r="1" fill="#6B7280" />
            <circle cx="10" cy="10" r="1" fill="#6B7280" />
            <circle cx="10" cy="15" r="1" fill="#6B7280" />
          </svg>
        </button>
      </div>

      {/* 訊息列表 */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
        onClick={() => setActiveToolbar(null)}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {/* AI 頭像 */}
            {msg.role === "assistant" && (
              <div
                className={`w-8 h-8 rounded-full bg-gradient-to-br ${agentBg} flex items-center justify-center text-white font-bold text-xs mr-2 flex-shrink-0 mt-0.5`}
              >
                {agentName[0]}
              </div>
            )}

            <div className={`max-w-[78%] ${msg.role === "assistant" ? "space-y-1" : ""}`}>
              {/* 訊息泡泡 */}
              <div className="relative">
                <div
                  className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-gray-900 text-white rounded-tr-sm"
                      : "bg-gray-100 text-gray-900 rounded-tl-sm"
                  }`}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    if (msg.role === "assistant") setActiveToolbar(msg.id);
                  }}
                >
                  {msg.role === "assistant" ? (
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        ul: ({ children }) => <ul className="list-disc pl-4 space-y-0.5">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-4 space-y-0.5">{children}</ol>,
                        li: ({ children }) => <li className="text-sm">{children}</li>,
                        h1: ({ children }) => <h1 className="text-base font-bold mb-1">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-sm font-bold mb-1">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-sm font-semibold mb-0.5">{children}</h3>,
                        code: ({ children }) => <code className="bg-gray-200 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    <p>{msg.content}</p>
                  )}
                </div>

                {/* 訊息工具列（長按顯示） */}
                {activeToolbar === msg.id && msg.role === "assistant" && (
                  <MessageToolbar
                    message={msg}
                    onSaveAsTask={() => handleSaveAsTask(msg)}
                    onOutputFormat={handleOutputFormat}
                    onClose={() => setActiveToolbar(null)}
                  />
                )}
              </div>

              {/* 交付物卡片 */}
              {msg.deliverable && <DeliverableCard deliverable={msg.deliverable} />}

              {/* AI 訊息下方智能功能列 */}
              {msg.role === "assistant" && !msg.isStreaming && (
                <MessageActions
                  agentRole={getAgentRole(conversationId)}
                  messageId={msg.id}
                  messageContent={msg.content}
                  onAction={handleMessageAction}
                />
              )}
            </div>
          </div>
        ))}

        {/* 等待動畫 */}
        {isLoading && (
          <div className="flex justify-start">
            <div
              className={`w-8 h-8 rounded-full bg-gradient-to-br ${agentBg} flex items-center justify-center text-white font-bold text-xs mr-2 flex-shrink-0`}
            >
              {agentName[0]}
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[60%]">
              <WaitingAnimation elapsed={loadingElapsed} />
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
        <div className="flex items-end gap-2">
          {/* 附件按鈕 */}
          <button className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 active:bg-gray-100 flex-shrink-0 mb-0.5">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16.5 11.5l-7 7a4.95 4.95 0 0 1-7-7l7-7a3.5 3.5 0 0 1 4.95 4.95l-7 7a2 2 0 0 1-2.83-2.83l6.3-6.3" />
            </svg>
          </button>

          {/* 文字輸入 */}
          <div className="flex-1 bg-gray-100 rounded-2xl px-3.5 py-2 flex items-end gap-2 min-h-[40px]">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="輸入訊息..."
              rows={1}
              className="flex-1 bg-transparent text-sm resize-none focus:outline-none max-h-24 leading-5"
              style={{ minHeight: "20px" }}
            />
          </div>

          {/* 發送按鈕 */}
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="w-9 h-9 bg-gray-900 rounded-full flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform flex-shrink-0 shadow-sm shadow-gray-200"
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
