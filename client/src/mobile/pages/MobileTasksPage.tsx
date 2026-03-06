/**
 * 任務頁面 — 任務模板系統 + 階段性檢查點
 * P0 功能：讓用戶真正完成任務並拿到交付物
 */
import { useState } from "react";
import { useLocation } from "wouter";
import MobileHeader from "../components/MobileHeader";
import { useI18n } from "@/i18n";
import { taskTemplates, TaskTemplate, TaskStage, categoryLabels } from "../components/TaskTemplates";
import { trpc } from "@/lib/trpc";

type TaskStatus = "pending" | "in_progress" | "completed" | "review";

interface Task {
  id: string;
  title: string;
  templateId: string;
  status: TaskStatus;
  currentStage: number;
  totalStages: number;
  agentName: string;
  agentAvatar: string;
  agentBg: string;
  createdAt: string;
  preview?: string;
}

const MOCK_TASKS: Task[] = [
  {
    id: "1",
    title: "新人入職 - 王小明",
    templateId: "employee-onboarding",
    status: "in_progress",
    currentStage: 3,
    totalStages: 5,
    agentName: "Rita Chu",
    agentAvatar: "R",
    agentBg: "from-green-400 to-green-600",
    createdAt: "今天 10:32",
    preview: "帳號已建立，正在準備系統培訓教材...",
  },
  {
    id: "2",
    title: "Q4 預算編制",
    templateId: "budget-planning",
    status: "review",
    currentStage: 4,
    totalStages: 5,
    agentName: "Jason Allen",
    agentAvatar: "J",
    agentBg: "from-blue-400 to-blue-600",
    createdAt: "昨天 15:20",
    preview: "預算草案已完成，等待財務長審核...",
  },
  {
    id: "3",
    title: "系統異常 - 登入服務",
    templateId: "system-incident",
    status: "completed",
    currentStage: 5,
    totalStages: 5,
    agentName: "IT Support AI",
    agentAvatar: "IT",
    agentBg: "from-orange-400 to-orange-600",
    createdAt: "週一 09:15",
    preview: "問題已修復，根因分析報告已歸檔...",
  },
];

const STATUS_CONFIG: Record<TaskStatus, { label: string; labelEn: string; color: string; dot: string }> = {
  pending: { label: "待處理", labelEn: "Pending", color: "text-gray-500", dot: "bg-gray-400" },
  in_progress: { label: "進行中", labelEn: "In Progress", color: "text-blue-600", dot: "bg-blue-500" },
  review: { label: "待審核", labelEn: "Review", color: "text-orange-600", dot: "bg-orange-500" },
  completed: { label: "已完成", labelEn: "Completed", color: "text-green-600", dot: "bg-green-500" },
};

export default function MobileTasksPage() {
  const [, navigate] = useLocation();
  const { locale, t } = useI18n();
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null);
  
  // 獲取選中模板的 AI 員工配對
  const { data: agentMapping } = trpc.task.getAgentMapping.useQuery(
    { taskType: selectedTemplate?.id || "" },
    { enabled: !!selectedTemplate }
  );

  const getTemplateIcon = (templateId: string) => {
    const template = taskTemplates.find(t => t.id === templateId);
    return template?.icon || "📋";
  };

  const handleSelectTemplate = (template: TaskTemplate) => {
    setSelectedTemplate(template);
  };

  const handleStartTask = () => {
    if (selectedTemplate) {
      // 實際會創建任務並導航到任務執行頁面
      navigate(`/task/new?template=${selectedTemplate.id}`);
      setShowTemplates(false);
      setSelectedTemplate(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <MobileHeader title={t("tasks.title")} />

      {/* 新增任務按鈕 */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-4 py-3">
        <button
          onClick={() => setShowTemplates(true)}
          className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-orange-500 to-orange-400 text-white rounded-xl font-semibold shadow-md shadow-orange-100 active:scale-[0.98] transition-transform"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M10 4v12M4 10h12"/>
          </svg>
          {locale === "zh" ? "建立新任務" : "Create New Task"}
        </button>
      </div>

      {/* 任務列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {MOCK_TASKS.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round">
                <rect x="4" y="6" width="24" height="20" rx="2"/>
                <path d="M4 12h24M12 6v6"/>
              </svg>
            </div>
            <p className="text-gray-500 text-sm">{t("tasks.noTasks")}</p>
            <p className="text-gray-400 text-xs mt-1">
              {locale === "zh" ? "點擊上方按鈕建立第一個任務" : "Click the button above to create your first task"}
            </p>
          </div>
        ) : (
          MOCK_TASKS.map((task) => {
            const statusCfg = STATUS_CONFIG[task.status];
            const progress = (task.currentStage / task.totalStages) * 100;
            return (
              <button
                key={task.id}
                onClick={() => navigate(`/task/${task.id}`)}
                className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-left active:bg-gray-50 transition-colors"
              >
                {/* 頂部：圖示 + 狀態 */}
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xl">{getTemplateIcon(task.templateId)}</span>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                    <span className={`text-xs font-medium ${statusCfg.color}`}>
                      {locale === "zh" ? statusCfg.label : statusCfg.labelEn}
                    </span>
                  </div>
                </div>

                {/* 標題 */}
                <p className="font-semibold text-gray-900 text-sm mb-1.5 line-clamp-2">{task.title}</p>

                {/* 預覽 */}
                {task.preview && (
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">{task.preview}</p>
                )}

                {/* 進度條 */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">
                      {locale === "zh" ? `階段 ${task.currentStage}/${task.totalStages}` : `Stage ${task.currentStage}/${task.totalStages}`}
                    </span>
                    <span className="text-xs text-gray-400">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* 底部：AI 員工 + 時間 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-full bg-gradient-to-br ${task.agentBg} flex items-center justify-center text-white text-[10px] font-bold`}
                    >
                      {task.agentAvatar}
                    </div>
                    <span className="text-xs text-gray-500">{task.agentName}</span>
                  </div>
                  <span className="text-xs text-gray-400">{task.createdAt}</span>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* 任務模板選擇 Modal */}
      {showTemplates && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          {/* Modal Header */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <button
              onClick={() => {
                setShowTemplates(false);
                setSelectedTemplate(null);
              }}
              className="text-gray-500 text-sm"
            >
              {locale === "zh" ? "取消" : "Cancel"}
            </button>
            <h2 className="font-semibold text-gray-900">
              {locale === "zh" ? "選擇任務模板" : "Choose Template"}
            </h2>
            <div className="w-10" />
          </div>

          {/* Template List or Detail */}
          <div className="flex-1 overflow-y-auto">
            {selectedTemplate ? (
              /* Template Detail View */
              <div className="p-4">
                {/* Template Header */}
                <div className="text-center mb-6">
                  <span className="text-4xl mb-3 block">{selectedTemplate.icon}</span>
                  <h3 className="font-bold text-lg text-gray-900">
                    {locale === "zh" ? selectedTemplate.name : selectedTemplate.nameEn}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {locale === "zh" ? selectedTemplate.description : selectedTemplate.descriptionEn}
                  </p>
                  <div className="flex items-center justify-center gap-3 mt-3">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      ⏱ {selectedTemplate.estimatedTime}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      📄 {selectedTemplate.outputFormats.map(f => f.toUpperCase()).join(", ")}
                    </span>
                  </div>
                </div>

                {/* AI 員工配對 */}
                {agentMapping && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 mb-6 border border-blue-100">
                    <h4 className="font-semibold text-gray-900 text-sm mb-3">
                      {locale === "zh" ? "🤖 AI 員工已就緒" : "🤖 AI Agent Ready"}
                    </h4>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold overflow-hidden">
                        {agentMapping.primary?.avatar ? (
                          <img src={agentMapping.primary.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          agentMapping.primary?.name?.charAt(0) || "AI"
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">
                          {agentMapping.primary?.name || agentMapping.primary?.englishName}
                        </p>
                        <p className="text-xs text-gray-500">{agentMapping.primary?.title}</p>
                      </div>
                    </div>
                    {agentMapping.humanApprover && (
                      <div className="mt-3 pt-3 border-t border-blue-100">
                        <p className="text-xs text-gray-600">
                          <span className="text-blue-600 font-medium">👤 {locale === "zh" ? "需要審批" : "Approval required"}: </span>
                          {agentMapping.humanApprover}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Stages */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 text-sm">
                    {locale === "zh" ? "執行階段" : "Execution Stages"}
                  </h4>
                  {selectedTemplate.stages.map((stage, index) => (
                    <div key={stage.id} className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">
                            {locale === "zh" ? stage.name : stage.nameEn}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {locale === "zh" ? stage.description : stage.descriptionEn}
                          </p>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {(locale === "zh" ? stage.checklist : stage.checklistEn).map((item, i) => (
                              <span key={i} className="text-[10px] bg-white text-gray-600 px-2 py-0.5 rounded-full border border-gray-200">
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Start Button */}
                <div className="mt-6 space-y-2">
                  <button
                    onClick={handleStartTask}
                    className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-orange-400 text-white rounded-xl font-semibold shadow-md active:scale-[0.98] transition-transform"
                  >
                    {locale === "zh" ? "開始任務" : "Start Task"}
                  </button>
                  <button
                    onClick={() => setSelectedTemplate(null)}
                    className="w-full py-3 text-gray-500 text-sm"
                  >
                    {locale === "zh" ? "返回選擇其他模板" : "Back to templates"}
                  </button>
                </div>
              </div>
            ) : (
              /* Template Grid */
              <div className="p-4 grid grid-cols-2 gap-3">
                {taskTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    className="bg-white rounded-2xl border border-gray-100 p-4 text-left active:bg-gray-50 transition-colors"
                  >
                    <span className="text-3xl mb-2 block">{template.icon}</span>
                    <p className="font-semibold text-gray-900 text-sm">
                      {locale === "zh" ? template.name : template.nameEn}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {locale === "zh" ? template.description : template.descriptionEn}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] text-gray-400">⏱ {template.estimatedTime}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
