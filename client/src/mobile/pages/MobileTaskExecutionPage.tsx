/**
 * 任務執行頁面 — 階段性檢查點 + 一鍵導出
 * P0 功能：讓用戶按步驟完成任務並拿到交付物
 */
import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useI18n } from "@/i18n";
import { taskTemplates, TaskTemplate, TaskStage } from "../components/TaskTemplates";

interface StageProgress {
  stageId: number;
  completed: boolean;
  checklist: Record<string, boolean>;
  notes?: string;
}

export default function MobileTaskExecutionPage() {
  const [, navigate] = useLocation();
  const params = useParams();
  const { locale } = useI18n();
  
  // 從 URL 獲取模板 ID
  const templateId = new URLSearchParams(window.location.search).get("template") || "custom";
  const template = taskTemplates.find(t => t.id === templateId) || taskTemplates[taskTemplates.length - 1];
  
  const [currentStage, setCurrentStage] = useState(1);
  const [stageProgress, setStageProgress] = useState<StageProgress[]>(
    template.stages.map(stage => ({
      stageId: stage.id,
      completed: false,
      checklist: (locale === "zh" ? stage.checklist : stage.checklistEn).reduce((acc, item) => {
        acc[item] = false;
        return acc;
      }, {} as Record<string, boolean>),
    }))
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const currentStageData = template.stages[currentStage - 1];
  const currentProgress = stageProgress[currentStage - 1];
  const totalChecked = Object.values(currentProgress.checklist).filter(Boolean).length;
  const totalItems = Object.keys(currentProgress.checklist).length;
  const stageComplete = totalChecked === totalItems;

  const handleCheckItem = (item: string) => {
    setStageProgress(prev => {
      const updated = [...prev];
      updated[currentStage - 1] = {
        ...updated[currentStage - 1],
        checklist: {
          ...updated[currentStage - 1].checklist,
          [item]: !updated[currentStage - 1].checklist[item],
        },
      };
      return updated;
    });
  };

  const handleNextStage = async () => {
    if (currentStage < template.stages.length) {
      // 標記當前階段完成
      setStageProgress(prev => {
        const updated = [...prev];
        updated[currentStage - 1] = { ...updated[currentStage - 1], completed: true };
        return updated;
      });
      
      // 模擬 AI 處理
      setIsProcessing(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsProcessing(false);
      
      setCurrentStage(currentStage + 1);
    } else {
      // 最後一個階段，顯示導出選項
      setStageProgress(prev => {
        const updated = [...prev];
        updated[currentStage - 1] = { ...updated[currentStage - 1], completed: true };
        return updated;
      });
      setShowExportModal(true);
    }
  };

  const handleExport = (format: string) => {
    // 模擬導出
    alert(locale === "zh" 
      ? `正在生成 ${format.toUpperCase()} 檔案...` 
      : `Generating ${format.toUpperCase()} file...`
    );
    setShowExportModal(false);
    navigate("/tasks");
  };

  const overallProgress = (stageProgress.filter(s => s.completed).length / template.stages.length) * 100;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/tasks")}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round">
              <path d="M10 12L6 8l4-4"/>
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="font-semibold text-gray-900 text-sm">
              {locale === "zh" ? template.name : template.nameEn}
            </h1>
            <p className="text-xs text-gray-500">
              {locale === "zh" 
                ? `階段 ${currentStage}/${template.stages.length}` 
                : `Stage ${currentStage}/${template.stages.length}`}
            </p>
          </div>
          <span className="text-2xl">{template.icon}</span>
        </div>
        
        {/* Overall Progress */}
        <div className="mt-3">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stage Tabs */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-4 py-2">
        <div className="flex gap-1 overflow-x-auto scrollbar-none">
          {template.stages.map((stage, index) => {
            const progress = stageProgress[index];
            const isActive = currentStage === index + 1;
            const isPast = progress.completed;
            return (
              <button
                key={stage.id}
                onClick={() => isPast && setCurrentStage(index + 1)}
                disabled={!isPast && !isActive}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isActive
                    ? "bg-orange-500 text-white"
                    : isPast
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {isPast ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                    <path d="M10 3L4.5 8.5 2 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <span>{index + 1}</span>
                )}
                <span className="hidden sm:inline">
                  {locale === "zh" ? stage.name : stage.nameEn}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stage Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mb-4 animate-pulse">
              <svg className="w-8 h-8 text-orange-500 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="60" strokeDashoffset="20"/>
              </svg>
            </div>
            <p className="font-semibold text-gray-900">
              {locale === "zh" ? "AI 正在處理中..." : "AI is processing..."}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {locale === "zh" ? "請稍候，這可能需要幾秒鐘" : "Please wait, this may take a few seconds"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Stage Header */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-500 flex items-center justify-center text-lg font-bold">
                  {currentStage}
                </div>
                <div className="flex-1">
                  <h2 className="font-bold text-gray-900">
                    {locale === "zh" ? currentStageData.name : currentStageData.nameEn}
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {locale === "zh" ? currentStageData.description : currentStageData.descriptionEn}
                  </p>
                </div>
              </div>
            </div>

            {/* Checklist */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <h3 className="font-semibold text-gray-900 text-sm mb-3">
                {locale === "zh" ? "檢查清單" : "Checklist"} ({totalChecked}/{totalItems})
              </h3>
              <div className="space-y-2">
                {(locale === "zh" ? currentStageData.checklist : currentStageData.checklistEn).map((item, index) => {
                  const isChecked = currentProgress.checklist[item];
                  return (
                    <button
                      key={index}
                      onClick={() => handleCheckItem(item)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        isChecked 
                          ? "border-green-200 bg-green-50" 
                          : "border-gray-100 bg-gray-50"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        isChecked 
                          ? "border-green-500 bg-green-500" 
                          : "border-gray-300"
                      }`}>
                        {isChecked && (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="white">
                            <path d="M10 3L4.5 8.5 2 6" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <span className={`text-sm ${isChecked ? "text-green-700" : "text-gray-700"}`}>
                        {item}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AI Assistant Card */}
            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl p-4 text-white">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-xl">🤖</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {locale === "zh" ? "AI 助手提示" : "AI Assistant Tip"}
                  </p>
                  <p className="text-xs text-white/80 mt-1">
                    {currentStage === 1 
                      ? (locale === "zh" 
                          ? "請先確認任務的基本資訊和目標，這將幫助我更好地為您服務。" 
                          : "Please confirm basic info and goals first. This helps me serve you better.")
                      : currentStage === template.stages.length
                      ? (locale === "zh"
                          ? "最後一步了！完成檢查清單後，您可以選擇導出格式下載成品。"
                          : "Final step! After completing the checklist, you can choose export format.")
                      : (locale === "zh"
                          ? "勾選完成的項目，我會根據您的輸入持續優化產出。"
                          : "Check completed items. I'll keep optimizing based on your input.")
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action */}
      {!isProcessing && (
        <div className="flex-shrink-0 bg-white border-t border-gray-100 p-4">
          <button
            onClick={handleNextStage}
            disabled={!stageComplete}
            className={`w-full py-3.5 rounded-xl font-semibold transition-all ${
              stageComplete
                ? "bg-gradient-to-r from-orange-500 to-orange-400 text-white shadow-md active:scale-[0.98]"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            {currentStage === template.stages.length
              ? (locale === "zh" ? "完成並導出" : "Complete & Export")
              : (locale === "zh" ? "下一階段" : "Next Stage")
            }
          </button>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50">
          <div className="w-full bg-white rounded-t-3xl p-6 animate-slide-up">
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
            <div className="text-center mb-6">
              <span className="text-4xl">🎉</span>
              <h2 className="font-bold text-xl text-gray-900 mt-2">
                {locale === "zh" ? "任務完成！" : "Task Complete!"}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {locale === "zh" ? "選擇導出格式下載您的成品" : "Choose export format to download your deliverable"}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              {template.outputFormats.map((format) => (
                <button
                  key={format}
                  onClick={() => handleExport(format)}
                  className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl border border-gray-100 active:bg-gray-100"
                >
                  <span className="text-2xl">
                    {format === "pdf" ? "📕" : format === "ppt" ? "📊" : format === "doc" ? "📝" : "📈"}
                  </span>
                  <span className="font-semibold text-gray-900">{format.toUpperCase()}</span>
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setShowExportModal(false)}
              className="w-full py-3 text-gray-500 text-sm"
            >
              {locale === "zh" ? "稍後再說" : "Maybe later"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
