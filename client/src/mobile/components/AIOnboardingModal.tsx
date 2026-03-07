/**
 * AI 入職說明彈窗 — 首次使用 AI 員工時顯示
 */
import { useState, useEffect } from "react";

interface AIAgent {
  id: number;
  name: string;
  englishName?: string;
  title: string;
  avatar?: string;
  bio?: string;
  methodology?: string;
  specialty?: string;
  skills?: string[];
}

interface Props {
  agent: AIAgent;
  isOpen: boolean;
  onClose: () => void;
  onStartChat: () => void;
}

export default function AIOnboardingModal({ agent, isOpen, onClose, onStartChat }: Props) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setStep(0);
      // 逐步顯示動畫
      const timer1 = setTimeout(() => setStep(1), 500);
      const timer2 = setTimeout(() => setStep(2), 1000);
      const timer3 = setTimeout(() => setStep(3), 1500);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm">
      <div 
        className="bg-white w-full max-w-lg rounded-t-3xl overflow-hidden animate-slide-up"
        style={{ maxHeight: "85vh" }}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-[#1C1C1E] to-[#3C3C43] px-6 pt-8 pb-12 text-center">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 text-white"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-[#E8611A] to-[#FF8A50] flex items-center justify-center shadow-lg overflow-hidden">
            {agent.avatar ? (
              <img src={agent.avatar} alt={agent.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-3xl font-bold">{agent.name?.charAt(0)}</span>
            )}
          </div>
          
          <h2 className="text-white text-xl font-bold mt-4">{agent.name}</h2>
          <p className="text-white/70 text-sm mt-1">{agent.title}</p>
          
          <div className="absolute bottom-0 left-0 right-0 h-6 bg-white rounded-t-3xl" />
        </div>

        {/* Content */}
        <div className="px-6 pb-6 overflow-y-auto" style={{ maxHeight: "50vh" }}>
          {/* 專長 */}
          <div className={`transition-all duration-500 ${step >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <div className="flex items-center gap-2 mb-2 mt-2">
              <div className="w-6 h-6 rounded-full bg-[#F2F2F7] flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1C1C1E" strokeWidth="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wide">專長領域</span>
            </div>
            <p className="text-[15px] text-[#1C1C1E] leading-relaxed pl-8">
              {agent.specialty || agent.bio || "多元領域專家"}
            </p>
          </div>

          {/* 方法論 */}
          <div className={`transition-all duration-500 delay-200 ${step >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <div className="flex items-center gap-2 mb-2 mt-6">
              <div className="w-6 h-6 rounded-full bg-[#F2F2F7] flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1C1C1E" strokeWidth="2">
                  <path d="M9 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5" />
                  <path d="M12 15l4 4-4 4" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wide">工作方法</span>
            </div>
            <p className="text-[15px] text-[#1C1C1E] leading-relaxed pl-8">
              {agent.methodology || "結合數據分析與專業判斷，提供精準建議。會主動詢問關鍵資訊，確保產出符合您的需求。"}
            </p>
          </div>

          {/* 能幫你做什麼 */}
          <div className={`transition-all duration-500 delay-400 ${step >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <div className="flex items-center gap-2 mb-2 mt-6">
              <div className="w-6 h-6 rounded-full bg-[#F2F2F7] flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1C1C1E" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wide">可以協助你</span>
            </div>
            <div className="pl-8 space-y-2">
              {(agent.skills || ["資料分析", "報告撰寫", "策略建議"]).slice(0, 4).map((skill, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1C1C1E]" />
                  <span className="text-[15px] text-[#1C1C1E]">{typeof skill === "string" ? skill : String(skill)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-2" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 20px) + 20px)" }}>
          <button
            onClick={onStartChat}
            className="w-full py-4 bg-[#1C1C1E] text-white rounded-xl font-semibold text-[17px] active:scale-98 transition-transform shadow-lg"
          >
            開始對話
          </button>
        </div>
      </div>
    </div>
  );
}
