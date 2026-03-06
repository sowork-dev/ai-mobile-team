/**
 * AI 員工入職說明彈窗
 * 首次使用某個 AI 員工時展示其專長、方法論、成功案例
 */
import { useI18n } from "@/i18n";

interface AIOnboarding {
  id: number;
  name: string;
  role: string;
  avatar?: string;
  specialties: string[];
  methodology: string;
  successCases: string[];
  canHelp: string[];
  workingStyle: string;
}

interface Props {
  onboarding: AIOnboarding;
  onClose: () => void;
  onStart: () => void;
}

export default function AIOnboardingModal({ onboarding, onClose, onStart }: Props) {
  const { locale } = useI18n();
  
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={onClose}>
      <div 
        className="w-full bg-white rounded-t-3xl max-h-[90vh] overflow-y-auto animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="sticky top-0 bg-white pt-3 pb-2 px-6">
          <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto" />
        </div>
        
        {/* Header */}
        <div className="px-6 pb-4 text-center border-b border-gray-100">
          <div className="w-20 h-20 rounded-full bg-gray-900 mx-auto flex items-center justify-center text-white text-3xl font-bold mb-3">
            {onboarding.name.charAt(0)}
          </div>
          <h2 className="text-xl font-bold text-gray-900">{onboarding.name}</h2>
          <p className="text-sm text-gray-500 mt-1">{onboarding.role}</p>
        </div>
        
        {/* Content */}
        <div className="px-6 py-4 space-y-5">
          {/* 專長 */}
          <section>
            <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              {locale === "zh" ? "專長領域" : "Specialties"}
            </h3>
            <div className="flex flex-wrap gap-2">
              {onboarding.specialties.map((s, i) => (
                <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                  {s}
                </span>
              ))}
            </div>
          </section>
          
          {/* 方法論 */}
          <section>
            <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4M12 8h.01"/>
              </svg>
              {locale === "zh" ? "工作方法" : "Methodology"}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {onboarding.methodology}
            </p>
          </section>
          
          {/* 能幫什麼忙 */}
          <section>
            <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              {locale === "zh" ? "我能幫您" : "I Can Help You"}
            </h3>
            <ul className="space-y-2">
              {onboarding.canHelp.map((h, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" className="flex-shrink-0 mt-0.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {h}
                </li>
              ))}
            </ul>
          </section>
          
          {/* 成功案例 */}
          <section>
            <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              {locale === "zh" ? "過往成績" : "Track Record"}
            </h3>
            <div className="space-y-2">
              {onboarding.successCases.map((c, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-2.5">
                  <span className="text-green-500 font-medium">✓</span>
                  {c}
                </div>
              ))}
            </div>
          </section>
          
          {/* 工作風格 */}
          <section className="bg-gray-900 text-white rounded-xl p-4">
            <p className="text-sm leading-relaxed">
              💬 「{onboarding.workingStyle}」
            </p>
          </section>
        </div>
        
        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4">
          <button
            onClick={onStart}
            className="w-full py-3.5 bg-gray-900 text-white rounded-xl font-semibold active:scale-[0.98] transition-transform"
          >
            {locale === "zh" ? "開始合作" : "Start Working Together"}
          </button>
        </div>
      </div>
    </div>
  );
}
