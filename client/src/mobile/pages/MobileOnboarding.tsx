/**
 * Mobile Onboarding — 品牌定位對話流程
 * Vivian 引導 5-6 個問題，每題提供 3 個選項
 * 完成後整理成結構化品牌定位卡片
 */
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

// ── 問題流程定義 ──────────────────────────────────────────────
interface OnboardingQuestion {
  id: string;
  question: string;
  options: string[];
  field: string;
}

const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
  {
    id: "industry",
    question: "您的品牌屬於哪個產業？",
    options: ["消費品 / 食品飲料", "時尚 / 美妝 / 生活風格", "科技 / SaaS / 數位服務"],
    field: "industry",
  },
  {
    id: "audience",
    question: "您的主要目標受眾是？",
    options: ["25-35 歲都會上班族", "18-28 歲 Z 世代學生", "35-50 歲中高收入家庭"],
    field: "targetAudience",
  },
  {
    id: "differentiation",
    question: "您的品牌最大的差異化優勢是？",
    options: ["品質與工藝感", "性價比與便利性", "創新與科技感"],
    field: "differentiation",
  },
  {
    id: "tone",
    question: "您希望品牌的溝通語調是？",
    options: ["專業權威、值得信賴", "親切溫暖、貼近生活", "活潑有趣、充滿活力"],
    field: "brandTone",
  },
  {
    id: "goal",
    question: "您目前最優先的行銷目標是？",
    options: ["提升品牌知名度", "增加產品銷售轉換", "建立社群忠誠度"],
    field: "marketingGoal",
  },
];

interface Message {
  role: "assistant" | "user";
  content: string;
  options?: string[];
  isCard?: boolean;
  cardData?: BrandPositioningCard;
}

interface BrandPositioningCard {
  brandName: string;
  industry: string;
  targetAudience: string;
  differentiation: string;
  brandTone: string;
  marketingGoal: string;
  tagline: string;
}

const VIVIAN_INTRO = `您好！我是 **Vivian**，您的品牌定位顧問。

接下來我會透過幾個簡單的問題，幫您梳理品牌的核心定位。整個過程大約需要 2-3 分鐘。

準備好了嗎？我們開始吧！`;

export default function MobileOnboarding() {
  const [, navigate] = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStep, setCurrentStep] = useState(-1); // -1 = intro
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [brandName, setBrandName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [showBrandNameInput, setShowBrandNameInput] = useState(false);
  const [nextStep, setNextStep] = useState<"find-agent" | "create-content" | "share" | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 初始化：顯示 Vivian 的開場白
    setTimeout(() => {
      setMessages([
        { role: "assistant", content: VIVIAN_INTRO },
      ]);
      // 詢問品牌名稱
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: "首先，請告訴我您的**品牌名稱**是什麼？",
        }]);
        setShowBrandNameInput(true);
      }, 800);
    }, 300);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleBrandNameSubmit = () => {
    if (!brandName.trim()) return;
    setShowBrandNameInput(false);
    setMessages(prev => [
      ...prev,
      { role: "user", content: brandName },
    ]);
    // 開始第一個問題
    setTimeout(() => {
      setCurrentStep(0);
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: `很棒！「**${brandName}**」是個好名字。\n\n${ONBOARDING_QUESTIONS[0].question}`,
          options: ONBOARDING_QUESTIONS[0].options,
        },
      ]);
    }, 500);
  };

  const handleOptionSelect = (option: string) => {
    const question = ONBOARDING_QUESTIONS[currentStep];
    const newAnswers = { ...answers, [question.field]: option };
    setAnswers(newAnswers);

    setMessages(prev => {
      // 移除最後一條訊息的 options（已選擇）
      const updated = prev.map((m, i) =>
        i === prev.length - 1 ? { ...m, options: undefined } : m
      );
      return [...updated, { role: "user", content: option }];
    });

    const nextStep = currentStep + 1;

    if (nextStep < ONBOARDING_QUESTIONS.length) {
      // 下一個問題
      setTimeout(() => {
        setCurrentStep(nextStep);
        setMessages(prev => [
          ...prev,
          {
            role: "assistant",
            content: ONBOARDING_QUESTIONS[nextStep].question,
            options: ONBOARDING_QUESTIONS[nextStep].options,
          },
        ]);
      }, 400);
    } else {
      // 所有問題回答完畢，生成品牌定位卡片
      setTimeout(() => {
        generatePositioningCard(newAnswers);
      }, 400);
    }
  };

  const generatePositioningCard = async (finalAnswers: Record<string, string>) => {
    setIsGenerating(true);
    setMessages(prev => [
      ...prev,
      {
        role: "assistant",
        content: "太好了！我已收集到所有資訊，正在為您整理品牌定位卡片...",
      },
    ]);

    // 根據答案生成 tagline
    const toneMap: Record<string, string> = {
      "專業權威、值得信賴": "以專業為基礎，建立信任",
      "親切溫暖、貼近生活": "讓生活更美好",
      "活潑有趣、充滿活力": "讓每天都充滿驚喜",
    };
    const goalMap: Record<string, string> = {
      "提升品牌知名度": "讓更多人認識您",
      "增加產品銷售轉換": "轉換每一個機會",
      "建立社群忠誠度": "凝聚品牌社群",
    };

    const card: BrandPositioningCard = {
      brandName,
      industry: finalAnswers.industry || "",
      targetAudience: finalAnswers.targetAudience || "",
      differentiation: finalAnswers.differentiation || "",
      brandTone: finalAnswers.brandTone || "",
      marketingGoal: finalAnswers.marketingGoal || "",
      tagline: `${toneMap[finalAnswers.brandTone] || ""}，${goalMap[finalAnswers.marketingGoal] || ""}`,
    };

    await new Promise(r => setTimeout(r, 1200));
    setIsGenerating(false);

    setMessages(prev => [
      ...prev,
      {
        role: "assistant",
        content: "您的品牌定位卡片已完成！請確認以下資訊是否正確：",
        isCard: true,
        cardData: card,
      },
    ]);
  };

  const handleConfirmCard = async () => {
    setIsConfirmed(true);
    setMessages(prev => [
      ...prev,
      { role: "user", content: "確認定案" },
      {
        role: "assistant",
        content: `太棒了！您的品牌定位已定案。\n\n接下來，您想做什麼？`,
        options: ["A. 找 AI 員工", "B. 生成第一份素材", "C. 分享定位卡片"],
      },
    ]);
  };

  const handleNextAction = (action: string) => {
    setMessages(prev => {
      const updated = prev.map((m, i) =>
        i === prev.length - 1 ? { ...m, options: undefined } : m
      );
      return [...updated, { role: "user", content: action }];
    });

    if (action.startsWith("A")) {
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            role: "assistant",
            content: "根據您的品牌定位，我為您推薦以下 AI 員工，正在跳轉到聯絡人頁面...",
          },
        ]);
        setTimeout(() => navigate("/contacts?onboarding=true"), 1200);
      }, 400);
    } else if (action.startsWith("B")) {
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          { role: "assistant", content: "正在跳轉到聊天頁面，您可以立即向 AI 員工發出第一個任務！" },
        ]);
        setTimeout(() => navigate("/chat"), 1200);
      }, 400);
    } else {
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          { role: "assistant", content: "分享功能即將上線！現在先帶您進入主頁面。" },
        ]);
        setTimeout(() => navigate("/chat"), 1200);
      }, 400);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Vivian 頭像 */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            V
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Vivian</p>
            <p className="text-xs text-gray-700">品牌定位顧問</p>
          </div>
        </div>
        <button
          onClick={() => navigate("/chat")}
          className="text-xs text-gray-400 px-3 py-1.5 rounded-full border border-gray-200"
        >
          跳過
        </button>
      </div>

      {/* 訊息列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-0.5">
                V
              </div>
            )}
            <div className={`max-w-[80%] ${msg.role === "user" ? "" : "space-y-3"}`}>
              {/* 訊息泡泡 */}
              {!msg.isCard && (
                <div
                  className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-gray-900 text-white rounded-tr-sm"
                      : "bg-gray-100 text-gray-900 rounded-tl-sm"
                  }`}
                >
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="mb-0">{children}</p>,
                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              )}

              {/* 品牌定位卡片 */}
              {msg.isCard && msg.cardData && (
                <div className="space-y-3">
                  <div className="bg-gray-100 text-gray-900 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm">
                    {msg.content}
                  </div>
                  <BrandPositioningCardView card={msg.cardData} />
                  {!isConfirmed && (
                    <button
                      onClick={handleConfirmCard}
                      className="w-full py-3 bg-gray-900 text-white rounded-xl font-semibold text-sm shadow-md shadow-gray-200 active:scale-95 transition-transform"
                    >
                      確認定案
                    </button>
                  )}
                </div>
              )}

              {/* 選項按鈕 */}
              {msg.options && (
                <div className="space-y-2 mt-2">
                  {msg.options.map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        if (isConfirmed) {
                          handleNextAction(option);
                        } else {
                          handleOptionSelect(option);
                        }
                      }}
                      className="w-full text-left px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 font-medium active:bg-gray-50 active:border-gray-300 transition-colors shadow-sm"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* 生成中動畫 */}
        {isGenerating && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0">
              V
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1.5 items-center h-4">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 品牌名稱輸入框 */}
      {showBrandNameInput && (
        <div className="flex-shrink-0 bg-white border-t border-gray-100 px-4 py-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleBrandNameSubmit()}
              placeholder="輸入您的品牌名稱..."
              className="flex-1 px-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              autoFocus
            />
            <button
              onClick={handleBrandNameSubmit}
              disabled={!brandName.trim()}
              className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 9h12M9 3l6 6-6 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 品牌定位卡片元件 ──────────────────────────────────────────
function BrandPositioningCardView({ card }: { card: BrandPositioningCard }) {
  const fields = [
    { label: "品牌名稱", value: card.brandName, icon: "🏷" },
    { label: "產業", value: card.industry, icon: "🏢" },
    { label: "目標受眾", value: card.targetAudience, icon: "👥" },
    { label: "差異化優勢", value: card.differentiation, icon: "✨" },
    { label: "品牌語調", value: card.brandTone, icon: "💬" },
    { label: "行銷目標", value: card.marketingGoal, icon: "🎯" },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Card Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-700 px-4 py-3">
        <p className="text-white text-xs font-medium opacity-80">品牌定位卡片</p>
        <p className="text-white font-bold text-base mt-0.5">{card.brandName}</p>
        {card.tagline && (
          <p className="text-gray-400 text-xs mt-1 italic">"{card.tagline}"</p>
        )}
      </div>
      {/* Card Body */}
      <div className="px-4 py-3 space-y-2.5">
        {fields.slice(1).map((field) => (
          <div key={field.label} className="flex items-start gap-2.5">
            <span className="text-base flex-shrink-0 mt-0.5">{field.icon}</span>
            <div>
              <p className="text-xs text-gray-400 font-medium">{field.label}</p>
              <p className="text-sm text-gray-800 font-medium">{field.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
