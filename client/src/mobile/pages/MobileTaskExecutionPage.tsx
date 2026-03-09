/**
 * 任務執行頁面 — 階段性檢查點 + 一鍵導出
 * P0 功能：讓用戶按步驟完成任務並拿到交付物
 */
import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useI18n } from "@/i18n";
import { toast } from "sonner";
import { taskTemplates, TaskTemplate, TaskStage } from "../components/TaskTemplates";
import AIOnboardingModal from "../components/AIOnboardingModal";
import TaskStatusTracker, { TaskStatus } from "../components/TaskStatusTracker";
import QualityGate from "../components/QualityGate";
import { trpc } from "@/lib/trpc";
import { generateDocument, generateAllFormats, GenerateOptions } from "@/lib/documentGenerator";

interface StageProgress {
  stageId: number;
  completed: boolean;
  checklist: Record<string, boolean>;
  notes?: string;
}

interface ScanResult {
  item: string;
  found: boolean;
  fileName?: string;
  scanning?: boolean;
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
  const [showQualityGate, setShowQualityGate] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [scanComplete, setScanComplete] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [taskStatus, setTaskStatus] = useState<"preparing" | "ai_processing" | "human_required" | "completed">("preparing");
  const [showStageOverview, setShowStageOverview] = useState(false);
  
  // 獲取 AI 員工配對
  const { data: agentMapping } = trpc.task.getAgentMapping.useQuery({ taskType: templateId });
  
  // 獲取 AI 入職說明
  const { data: aiOnboarding } = trpc.ai.getOnboarding.useQuery(
    { agentId: agentMapping?.primary?.id || 0 },
    { enabled: !!agentMapping?.primary?.id }
  );
  
  // 檢查是否首次使用該 AI
  useEffect(() => {
    if (aiOnboarding && agentMapping?.primary) {
      const seenAIs = JSON.parse(localStorage.getItem("seenAIs") || "[]");
      if (!seenAIs.includes(agentMapping.primary.id)) {
        setShowOnboarding(true);
      }
    }
  }, [aiOnboarding, agentMapping]);
  
  const handleOnboardingClose = () => {
    if (agentMapping?.primary) {
      const seenAIs = JSON.parse(localStorage.getItem("seenAIs") || "[]");
      seenAIs.push(agentMapping.primary.id);
      localStorage.setItem("seenAIs", JSON.stringify(seenAIs));
    }
    setShowOnboarding(false);
    setTaskStatus("ai_processing");
  };

  // 模擬 AI 掃描知識庫
  const simulateKnowledgeScan = async () => {
    setIsScanning(true);
    setScanComplete(false);
    setScanResults([]);
    
    const checklist = locale === "zh" ? currentStageData.checklist : currentStageData.checklistEn;
    
    // 逐個項目掃描
    for (let i = 0; i < checklist.length; i++) {
      const item = checklist[i];
      
      // 先顯示掃描中
      setScanResults(prev => [...prev, { item, found: false, scanning: true }]);
      
      // 模擬掃描時間
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500));
      
      // 隨機決定是否找到（60% 找到）
      const found = Math.random() > 0.4;
      const mockFiles = [
        "company_policy_v2.pdf",
        "budget_template_2026.xlsx",
        "onboarding_checklist.docx",
        "performance_review_form.pdf",
        "expense_policy.pdf",
        "meeting_template.pptx",
      ];
      
      setScanResults(prev => 
        prev.map((r, idx) => 
          idx === i 
            ? { item, found, fileName: found ? mockFiles[Math.floor(Math.random() * mockFiles.length)] : undefined, scanning: false }
            : r
        )
      );
    }
    
    setIsScanning(false);
    setScanComplete(true);
  };

  // 當階段改變時，自動開始掃描
  useEffect(() => {
    simulateKnowledgeScan();
  }, [currentStage]);

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
      
      // 模擬 AI 處理 + 指派下一階段
      setIsProcessing(true);
      setTaskStatus("ai_processing");
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsProcessing(false);
      
      const nextStage = template.stages[currentStage];
      const nextAssignee = nextStage?.assignTo === "human" 
        ? agentMapping?.humanApprover 
        : agentMapping?.primary?.name;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (nextStage?.assignTo === "human" ? 3 : 1));
      
      // 顯示指派通知
      toast.success(
        locale === "zh"
          ? `已指派給 ${nextAssignee}，截止 ${dueDate.toLocaleDateString()}`
          : `Assigned to ${nextAssignee}, due ${dueDate.toLocaleDateString()}`
      );
      
      // 更新狀態
      if (nextStage?.assignTo === "human") {
        setTaskStatus("human_required");
      }
      
      // 顯示階段總覽
      setShowStageOverview(true);
    } else {
      // 最後一個階段：先顯示 QualityGate，審查通過後再顯示導出選項
      setStageProgress(prev => {
        const updated = [...prev];
        updated[currentStage - 1] = { ...updated[currentStage - 1], completed: true };
        return updated;
      });
      setTaskStatus("completed");
      setShowQualityGate(true);
    }
  };

  const handleExport = async (format: string) => {
    try {
      toast.loading(
        locale === "zh" 
          ? `正在生成 ${format.toUpperCase()} 檔案...` 
          : `Generating ${format.toUpperCase()} file...`
      );
      
      // 根據任務類型生成對應內容
      const options: GenerateOptions = {
        title: template.name,
        content: generateTaskContent(),
        author: agentMapping?.primary?.name || "AI 員工",
        date: new Date(),
        tableData: generateTableData(),
        slides: generateSlides(),
      };
      
      // 映射格式
      const formatMap: Record<string, "pdf" | "xls" | "ppt" | "doc" | "markdown"> = {
        pdf: "pdf",
        xls: "xls",
        ppt: "ppt",
        doc: "doc",
        markdown: "markdown",
      };
      
      await generateDocument(formatMap[format] || "pdf", options);
      
      toast.dismiss();
      toast.success(
        locale === "zh" 
          ? `${format.toUpperCase()} 檔案已下載！` 
          : `${format.toUpperCase()} file downloaded!`
      );
      
      setShowExportModal(false);
      navigate("/tasks");
    } catch (error) {
      toast.dismiss();
      toast.error(
        locale === "zh" 
          ? `生成失敗：${error}` 
          : `Generation failed: ${error}`
      );
    }
  };
  
  // 根據任務類型生成內容
  const generateTaskContent = (): string => {
    const completedChecks = stageProgress.flatMap((stage, i) => 
      Object.entries(stage.checklist)
        .filter(([_, done]) => done)
        .map(([item]) => `✓ ${item}`)
    );
    
    return `任務：${template.name}\n\n` +
      `完成日期：${new Date().toLocaleDateString()}\n` +
      `負責 AI：${agentMapping?.primary?.name || "AI 員工"}\n\n` +
      `完成項目：\n${completedChecks.join("\n")}\n\n` +
      `備註：任務已完成所有階段。`;
  };
  
  // 生成表格數據
  const generateTableData = () => {
    return {
      headers: ["階段", "狀態", "負責人", "完成日期"],
      rows: template.stages.map((stage, i) => [
        locale === "zh" ? stage.name : stage.nameEn,
        stageProgress[i]?.completed ? "✓ 完成" : "○ 待處理",
        stage.assignTo === "ai" ? (agentMapping?.primary?.name || "AI") : (agentMapping?.humanApprover || "主管"),
        stageProgress[i]?.completed ? new Date().toLocaleDateString() : "-",
      ]),
    };
  };
  
  // 生成簡報投影片
  const generateSlides = () => {
    return [
      {
        title: "任務概覽",
        content: [
          `任務名稱：${template.name}`,
          `完成階段：${stageProgress.filter(s => s.completed).length} / ${template.stages.length}`,
          `負責 AI：${agentMapping?.primary?.name || "AI 員工"}`,
        ],
      },
      ...template.stages.map((stage, i) => ({
        title: locale === "zh" ? stage.name : stage.nameEn,
        content: (locale === "zh" ? stage.checklist : stage.checklistEn).map(
          item => `${stageProgress[i]?.checklist[item] ? "✓" : "○"} ${item}`
        ),
      })),
      {
        title: "結論",
        content: [
          "任務已完成所有階段",
          `總耗時：約 ${template.estimatedTime}`,
          "下一步：歸檔或分享給相關人員",
        ],
      },
    ];
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
          {/* AI 員工頭像 + 狀態 */}
          {agentMapping?.primary && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center text-white text-sm font-bold">
                  {agentMapping.primary.name?.charAt(0) || "AI"}
                </div>
                <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                  taskStatus === "ai_processing" ? "bg-gray-900 animate-pulse" 
                  : taskStatus === "human_required" ? "bg-gray-500"
                  : taskStatus === "completed" ? "bg-gray-900"
                  : "bg-gray-400"
                }`} />
              </div>
            </div>
          )}
        </div>
        
        {/* Overall Progress - 單色 */}
        <div className="mt-3">
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gray-900 rounded-full transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* 當前階段指派資訊 */}
      {scanComplete && (
        <div className="flex-shrink-0 bg-gray-50 border-b border-gray-100 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-white text-xs font-bold">
                {agentMapping?.primary?.name?.charAt(0) || "AI"}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {agentMapping?.primary?.name || "AI 員工"}
                  <span className="text-gray-400 font-normal ml-1">
                    {locale === "zh" ? "處理中" : "Processing"}
                  </span>
                </p>
                <p className="text-xs text-gray-500">
                  {locale === "zh" ? "截止日期：" : "Due: "}
                  {new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">
                {locale === "zh" ? "下一位" : "Next"}
              </p>
              <p className="text-sm font-medium text-gray-700">
                {agentMapping?.humanApprover || (locale === "zh" ? "主管審批" : "Manager")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stage Tabs - 單色設計 */}
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
                    ? "bg-gray-900 text-white"
                    : isPast
                    ? "bg-gray-200 text-gray-700"
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
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4 animate-pulse">
              <svg className="w-8 h-8 text-gray-900 animate-spin" viewBox="0 0 24 24" fill="none">
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
                <div className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center text-lg font-bold">
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

            {/* 任務進度追蹤 */}
            <TaskStatusTracker
              stages={template.stages.map((stage, i) => ({
                id: stage.id,
                name: locale === "zh" ? stage.name : stage.nameEn,
                status: (stageProgress[i]?.completed
                  ? "completed"
                  : i + 1 === currentStage
                    ? (taskStatus === "ai_processing" ? "ai_processing" : taskStatus === "human_required" ? "waiting_approval" : "pending")
                    : i + 1 < currentStage ? "completed" : "pending") as TaskStatus,
                assignTo: stage.assignTo as "ai" | "human" | "both",
                aiAgent: agentMapping?.primary ? { id: 1, name: agentMapping.primary.name || "AI" } : undefined,
                humanApprover: agentMapping?.humanApprover,
              }))}
              currentStageIndex={currentStage - 1}
            />

            {/* AI 掃描結果 */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 text-sm">
                  {locale === "zh" ? "知識庫掃描結果" : "Knowledge Base Scan"}
                </h3>
                {isScanning && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="60" strokeDashoffset="20"/>
                    </svg>
                    {locale === "zh" ? "掃描中..." : "Scanning..."}
                  </span>
                )}
              </div>
              
              <div className="space-y-2">
                {scanResults.map((result, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      result.scanning
                        ? "border-gray-200 bg-gray-50"
                        : result.found 
                        ? "border-gray-300 bg-gray-50" 
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    {/* 狀態圖示 */}
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                      result.scanning
                        ? "bg-gray-200"
                        : result.found 
                        ? "bg-gray-900" 
                        : "bg-gray-400"
                    }`}>
                      {result.scanning ? (
                        <svg className="w-3 h-3 text-gray-500 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="60" strokeDashoffset="20"/>
                        </svg>
                      ) : result.found ? (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="white">
                          <path d="M10 3L4.5 8.5 2 6" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="white">
                          <path d="M6 3v4M6 9h.01" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
                        </svg>
                      )}
                    </div>
                    
                    {/* 內容 */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${
                        result.scanning ? "text-gray-500" : result.found ? "text-gray-900" : "text-gray-600"
                      }`}>
                        {result.item}
                      </p>
                      {result.found && result.fileName && (
                        <p className="text-xs text-gray-600 truncate flex items-center gap-1 mt-0.5">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14,2 14,8 20,8"/>
                          </svg>
                          {result.fileName}
                        </p>
                      )}
                      {!result.scanning && !result.found && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {locale === "zh" ? "未找到相關檔案" : "No file found"}
                        </p>
                      )}
                    </div>
                    
                    {/* 操作按鈕 - 只在未找到時顯示 */}
                    {!result.scanning && !result.found && (
                      <button className="text-xs bg-gray-900 text-white px-2.5 py-1 rounded-lg">
                        {locale === "zh" ? "上傳" : "Upload"}
                      </button>
                    )}
                  </div>
                ))}
                
                {/* 掃描中的佔位項目 */}
                {isScanning && scanResults.length < (locale === "zh" ? currentStageData.checklist : currentStageData.checklistEn).length && (
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50 opacity-50">
                    <div className="w-5 h-5 rounded-full bg-gray-200" />
                    <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                  </div>
                )}
              </div>
            </div>

            {/* AI 智能提示 - 根據掃描結果 */}
            {scanComplete && (
              <div className="bg-gray-900 rounded-2xl p-4 text-white">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 16v-4M12 8h.01"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {locale === "zh" ? "AI 掃描完成" : "Scan Complete"}
                    </p>
                    {(() => {
                      const missingItems = scanResults.filter(r => !r.found);
                      const foundItems = scanResults.filter(r => r.found);
                      
                      if (missingItems.length === 0) {
                        return (
                          <p className="text-xs text-white/70 mt-1">
                            {locale === "zh" 
                              ? `已從知識庫找到 ${foundItems.length} 項相關資料，可直接進入下一階段。`
                              : `Found ${foundItems.length} items from knowledge base. Ready to proceed.`
                            }
                          </p>
                        );
                      } else {
                        return (
                          <>
                            <p className="text-xs text-white/70 mt-1">
                              {locale === "zh" 
                                ? `已找到 ${foundItems.length} 項，尚缺 ${missingItems.length} 項：${missingItems.map(m => m.item).join("、")}`
                                : `Found ${foundItems.length} items. Missing ${missingItems.length}: ${missingItems.map(m => m.item).join(", ")}`
                              }
                            </p>
                            <p className="text-xs text-white/50 mt-2">
                              {locale === "zh" 
                                ? "請上傳缺少的檔案，或從知識庫選取其他相關文件。"
                                : "Please upload missing files or select from other knowledge base documents."
                              }
                            </p>
                          </>
                        );
                      }
                    })()}
                    
                    {/* 操作按鈕 */}
                    {scanResults.some(r => !r.found) && (
                      <div className="flex gap-2 mt-3">
                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-lg text-xs hover:bg-white/20 transition-colors">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                          </svg>
                          {locale === "zh" ? "批量上傳" : "Batch Upload"}
                        </button>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-lg text-xs hover:bg-white/20 transition-colors">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                          {locale === "zh" ? "自行填寫" : "Fill Manually"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Action */}
      {!isProcessing && !isScanning && (
        <div className="flex-shrink-0 bg-white border-t border-gray-100 p-4">
          {(() => {
            const allFound = scanComplete && scanResults.every(r => r.found);
            const missingCount = scanResults.filter(r => !r.found).length;
            
            return (
              <button
                onClick={handleNextStage}
                disabled={!allFound}
                className={`w-full py-3.5 rounded-xl font-semibold transition-all ${
                  allFound
                    ? "bg-gray-900 text-white shadow-md active:scale-[0.98]"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {!allFound
                  ? (locale === "zh" 
                      ? `尚有 ${missingCount} 項資料待補充` 
                      : `${missingCount} items still needed`)
                  : currentStage === template.stages.length
                  ? (locale === "zh" ? "完成並導出" : "Complete & Export")
                  : (locale === "zh" ? "下一階段" : "Next Stage")
                }
              </button>
            );
          })()}
        </div>
      )}

      {/* Stage Overview Modal - 階段完成後回顧 */}
      {showStageOverview && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={() => {
          setShowStageOverview(false);
          setCurrentStage(currentStage + 1);
        }}>
          <div className="w-full bg-white rounded-t-3xl p-6 animate-slide-up max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
            
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-gray-900 flex items-center justify-center mx-auto mb-3">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h2 className="font-bold text-xl text-gray-900">
                {locale === "zh" ? "階段完成！" : "Stage Complete!"}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {locale === "zh" 
                  ? `已完成 ${currentStage} / ${template.stages.length} 階段` 
                  : `Completed ${currentStage} / ${template.stages.length} stages`}
              </p>
            </div>
            
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gray-900 rounded-full transition-all duration-500"
                  style={{ width: `${(currentStage / template.stages.length) * 100}%` }}
                />
              </div>
            </div>
            
            {/* Stages List */}
            <div className="space-y-3 mb-6">
              {template.stages.map((stage, index) => {
                const isCompleted = index < currentStage;
                const isCurrent = index === currentStage;
                const isPending = index > currentStage;
                
                return (
                  <div 
                    key={stage.id}
                    className={`flex items-center gap-3 p-3 rounded-xl ${
                      isCompleted ? "bg-gray-100" : isCurrent ? "bg-gray-900 text-white" : "bg-gray-50"
                    }`}
                  >
                    {/* Step Number / Check */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isCompleted ? "bg-gray-900 text-white" : isCurrent ? "bg-white text-gray-900" : "bg-gray-200 text-gray-500"
                    }`}>
                      {isCompleted ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      ) : (
                        <span className="text-sm font-bold">{index + 1}</span>
                      )}
                    </div>
                    
                    {/* Stage Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${isCompleted ? "text-gray-600" : isCurrent ? "text-white" : "text-gray-500"}`}>
                        {locale === "zh" ? stage.name : stage.nameEn}
                      </p>
                      <p className={`text-xs truncate ${isCompleted ? "text-gray-400" : isCurrent ? "text-gray-300" : "text-gray-400"}`}>
                        {stage.assignTo === "ai" 
                          ? (locale === "zh" ? "AI 處理" : "AI handles")
                          : stage.assignTo === "human"
                          ? (locale === "zh" ? "真人處理" : "Human handles")
                          : (locale === "zh" ? "協作" : "Collaboration")}
                      </p>
                    </div>
                    
                    {/* Status Badge */}
                    {isCompleted && (
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {locale === "zh" ? "已完成" : "Done"}
                      </span>
                    )}
                    {isCurrent && (
                      <span className="text-xs bg-white/20 px-2 py-0.5 rounded flex-shrink-0">
                        {locale === "zh" ? "下一步" : "Next"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Action Button */}
            <button
              onClick={() => {
                setShowStageOverview(false);
                setCurrentStage(currentStage + 1);
              }}
              className="w-full py-3.5 bg-gray-900 text-white rounded-xl font-semibold active:scale-[0.98] transition-transform"
            >
              {locale === "zh" ? "繼續下一階段" : "Continue to Next Stage"}
            </button>
          </div>
        </div>
      )}

      {/* Quality Gate */}
      {showQualityGate && (
        <QualityGate
          taskTitle={locale === "zh" ? template.name : template.nameEn}
          agentName={agentMapping?.primary?.name || "AI 員工"}
          onApprove={() => {
            setShowQualityGate(false);
            // 檢查任務系統整合，顯示同步 toast
            try {
              const clickup = JSON.parse(localStorage.getItem("taskIntegration_clickup") || "null");
              const asana = JSON.parse(localStorage.getItem("taskIntegration_asana") || "null");
              const notion = JSON.parse(localStorage.getItem("taskIntegration_notion") || "null");
              const monday = JSON.parse(localStorage.getItem("taskIntegration_monday") || "null");
              const syncTarget = clickup?.connected ? "ClickUp"
                : asana?.connected ? "Asana"
                : notion?.connected ? "Notion"
                : monday?.connected ? "Monday.com"
                : null;
              if (syncTarget) {
                setTimeout(() => {
                  toast.success(
                    locale === "zh" ? `已同步到 ${syncTarget} ✓` : `Synced to ${syncTarget} ✓`,
                    { duration: 2000 }
                  );
                }, 300);
              }
            } catch { /* ignore */ }
            setShowExportModal(true);
          }}
          onReject={(reason) => {
            setShowQualityGate(false);
            toast.error(
              locale === "zh"
                ? `任務已退回：${reason || "需要修改"}`
                : `Task rejected: ${reason || "Changes required"}`
            );
            // Reset to last stage so user can redo
            setTaskStatus("ai_processing");
          }}
        />
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
            
            {/* 一鍵下載全部 */}
            <button
              onClick={async () => {
                try {
                  toast.loading(locale === "zh" ? "正在生成所有格式..." : "Generating all formats...");
                  const options: GenerateOptions = {
                    title: template.name,
                    content: generateTaskContent(),
                    author: agentMapping?.primary?.name || "AI 員工",
                    date: new Date(),
                    tableData: generateTableData(),
                    slides: generateSlides(),
                  };
                  await generateAllFormats(template.outputFormats as any[], options);
                  toast.dismiss();
                  toast.success(locale === "zh" ? "已下載 ZIP 檔案！" : "ZIP file downloaded!");
                  setShowExportModal(false);
                  navigate("/tasks");
                } catch (error) {
                  toast.dismiss();
                  toast.error(`${error}`);
                }
              }}
              className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold mb-4 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <span>📦</span>
              <span>{locale === "zh" ? "一鍵下載全部格式" : "Download All Formats"}</span>
            </button>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {template.outputFormats.map((format) => {
                const formatIcons: Record<string, React.ReactNode> = {
                  pdf: (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3C3C43" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                    </svg>
                  ),
                  ppt: (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3C3C43" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
                    </svg>
                  ),
                  doc: (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3C3C43" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" />
                    </svg>
                  ),
                  xls: (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3C3C43" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 3v18h18" /><path d="M7 16l4-4 4 4 6-6" />
                    </svg>
                  ),
                };
                return (
                  <button
                    key={format}
                    onClick={() => handleExport(format)}
                    className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl border border-gray-100 active:bg-gray-100"
                  >
                    {formatIcons[format] || formatIcons.doc}
                    <span className="font-semibold text-gray-900">{format.toUpperCase()}</span>
                  </button>
                );
              })}
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
      
      {/* AI Onboarding Modal */}
      {showOnboarding && aiOnboarding && (
        <AIOnboardingModal
          onboarding={aiOnboarding}
          onClose={handleOnboardingClose}
          onStart={handleOnboardingClose}
        />
      )}
    </div>
  );
}
