/**
 * 一鍵 Regroup Conversation
 * AI 自動將對話按專案/事件分組，每組一句摘要，可歸檔
 */
import { useState, useEffect } from "react";
import { useI18n } from "@/i18n";

interface ConversationGroup {
  id: string;
  title: string;
  summary: string;
  messageCount: number;
  dateRange: string;
  isArchived: boolean;
  messages?: { id: string; content: string; sender: string; time: string }[];
}

interface Props {
  chatId: string;
  onClose: () => void;
}

export default function RegroupConversation({ chatId, onClose }: Props) {
  const { locale } = useI18n();
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [analyzeStep, setAnalyzeStep] = useState(0);
  const [groups, setGroups] = useState<ConversationGroup[]>([]);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  // 模擬 AI 分析對話
  useEffect(() => {
    const analyzeSteps = [
      locale === "zh" ? "讀取對話記錄..." : "Reading conversation...",
      locale === "zh" ? "識別討論主題..." : "Identifying topics...",
      locale === "zh" ? "分析關聯訊息..." : "Analyzing related messages...",
      locale === "zh" ? "生成摘要..." : "Generating summaries...",
    ];

    let step = 0;
    const interval = setInterval(() => {
      step++;
      setAnalyzeStep(step);
      if (step >= analyzeSteps.length) {
        clearInterval(interval);
        setTimeout(() => {
          setIsAnalyzing(false);
          // 模擬分組結果
          setGroups([
            {
              id: "g1",
              title: locale === "zh" ? "新人入職 - 王小明" : "Onboarding - Wang Xiaoming",
              summary: locale === "zh" 
                ? "討論入職日期和設備需求，已確認 3/15 報到" 
                : "Discussed start date and equipment needs, confirmed 3/15 start",
              messageCount: 12,
              dateRange: "3/5 - 3/6",
              isArchived: false,
            },
            {
              id: "g2",
              title: locale === "zh" ? "Q2 預算討論" : "Q2 Budget Discussion",
              summary: locale === "zh" 
                ? "財務部提出縮減 10%，待主管確認" 
                : "Finance proposed 10% cut, pending manager approval",
              messageCount: 8,
              dateRange: "3/4 - 3/6",
              isArchived: false,
            },
            {
              id: "g3",
              title: locale === "zh" ? "系統異常 - 登入問題" : "System Issue - Login Problem",
              summary: locale === "zh" 
                ? "已修復，根因是 SSL 憑證過期" 
                : "Fixed, root cause was SSL certificate expiry",
              messageCount: 5,
              dateRange: "3/6",
              isArchived: true,
            },
            {
              id: "g4",
              title: locale === "zh" ? "產品功能討論" : "Product Feature Discussion",
              summary: locale === "zh" 
                ? "新增匯出 PDF 功能，預計下週上線" 
                : "Adding PDF export feature, planned for next week",
              messageCount: 15,
              dateRange: "3/3 - 3/6",
              isArchived: false,
            },
          ]);
        }, 500);
      }
    }, 600);

    return () => clearInterval(interval);
  }, [locale]);

  const handleArchive = (groupId: string) => {
    setGroups(prev => prev.map(g => 
      g.id === groupId ? { ...g, isArchived: !g.isArchived } : g
    ));
  };

  const analyzeSteps = [
    locale === "zh" ? "讀取對話記錄..." : "Reading conversation...",
    locale === "zh" ? "識別討論主題..." : "Identifying topics...",
    locale === "zh" ? "分析關聯訊息..." : "Analyzing related messages...",
    locale === "zh" ? "生成摘要..." : "Generating summaries...",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={onClose}>
      <div 
        className="w-full bg-white rounded-t-3xl max-h-[90vh] flex flex-col animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 pt-3 pb-2 px-6 border-b border-gray-100">
          <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">
              {locale === "zh" ? "整理對話" : "Organize Conversation"}
            </h2>
            <button onClick={onClose} className="text-gray-400 p-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isAnalyzing ? (
            /* 分析動畫 */
            <div className="py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-900 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="60" strokeDashoffset="20"/>
                </svg>
              </div>
              <p className="font-semibold text-gray-900 mb-4">
                {locale === "zh" ? "AI 正在分析對話..." : "AI is analyzing conversation..."}
              </p>
              <div className="space-y-2 max-w-xs mx-auto">
                {analyzeSteps.map((step, index) => (
                  <div 
                    key={index}
                    className={`flex items-center gap-2 text-sm transition-all ${
                      index < analyzeStep 
                        ? "text-gray-900" 
                        : index === analyzeStep 
                        ? "text-gray-600" 
                        : "text-gray-300"
                    }`}
                  >
                    {index < analyzeStep ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : index === analyzeStep ? (
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="60" strokeDashoffset="20"/>
                      </svg>
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-gray-200" />
                    )}
                    {step}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* 分組結果 */
            <div className="space-y-3">
              <p className="text-sm text-gray-500 mb-4">
                {locale === "zh" 
                  ? `已識別 ${groups.length} 個討論主題` 
                  : `Identified ${groups.length} discussion topics`}
              </p>
              
              {groups.map(group => (
                <div 
                  key={group.id}
                  className={`rounded-2xl border transition-all ${
                    group.isArchived 
                      ? "bg-gray-50 border-gray-100 opacity-60" 
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        group.isArchived ? "bg-gray-200" : "bg-gray-900"
                      }`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={group.isArchived ? "#6B7280" : "#FFFFFF"} strokeWidth="2">
                          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                        </svg>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className={`font-semibold ${group.isArchived ? "text-gray-500" : "text-gray-900"}`}>
                            {group.title}
                          </h3>
                          {group.isArchived && (
                            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded flex-shrink-0">
                              {locale === "zh" ? "已歸檔" : "Archived"}
                            </span>
                          )}
                        </div>
                        <p className={`text-sm mt-1 ${group.isArchived ? "text-gray-400" : "text-gray-600"}`}>
                          "{group.summary}"
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <span>{group.messageCount} {locale === "zh" ? "則訊息" : "messages"}</span>
                          <span>·</span>
                          <span>{group.dateRange}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                      <button 
                        onClick={() => setExpandedGroup(expandedGroup === group.id ? null : group.id)}
                        className="flex-1 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        {locale === "zh" ? "查看訊息" : "View Messages"}
                      </button>
                      <button 
                        onClick={() => handleArchive(group.id)}
                        className={`flex-1 py-2 text-sm rounded-lg transition-colors ${
                          group.isArchived 
                            ? "text-gray-600 hover:text-gray-900" 
                            : "bg-gray-900 text-white"
                        }`}
                      >
                        {group.isArchived 
                          ? (locale === "zh" ? "取消歸檔" : "Unarchive")
                          : (locale === "zh" ? "歸檔" : "Archive")
                        }
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        {!isAnalyzing && (
          <div className="flex-shrink-0 border-t border-gray-100 p-4">
            <p className="text-xs text-gray-400 text-center">
              {locale === "zh" 
                ? "歸檔後的討論會收合顯示，方便找到進行中的對話" 
                : "Archived discussions will be collapsed for easier navigation"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
