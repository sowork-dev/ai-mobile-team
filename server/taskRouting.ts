/**
 * 任務自動路由系統
 * 根據任務類型自動匹配 AI 員工，並在需要時通知真人
 */

// 任務類型定義
export type TaskType = 
  | "employee-onboarding"  // 新人入職
  | "performance-review"   // 績效考核
  | "expense-report"       // 費用報銷
  | "budget-planning"      // 預算編制
  | "project-kickoff"      // 專案啟動
  | "weekly-standup"       // 週會管理
  | "vendor-management"    // 供應商管理
  | "system-incident"      // 系統異常
  | "custom";              // 自訂流程

// AI 員工入職說明
export interface AIOnboarding {
  id: number;
  name: string;
  role: string;
  avatar?: string;
  specialties: string[];      // 專長
  methodology: string;        // 方法論
  successCases: string[];     // 成功案例
  canHelp: string[];          // 能幫什麼忙
  workingStyle: string;       // 工作風格
}

// AI 員工入職說明資料
export const aiOnboardingData: Record<number, AIOnboarding> = {
  90046: {
    id: 90046,
    name: "Rita Chu",
    role: "HR Business Partner",
    specialties: ["人才招聘", "員工關係", "績效管理", "組織發展"],
    methodology: "以員工為中心的人力資源策略，結合數據分析與人性化管理",
    successCases: [
      "協助完成 50+ 新人入職流程",
      "設計績效考核體系，員工滿意度提升 30%",
      "優化招聘流程，平均招聘週期縮短 40%"
    ],
    canHelp: [
      "自動準備入職文件和培訓計畫",
      "追蹤新人適應期狀況",
      "生成績效報告和改進建議",
      "處理員工常見問題"
    ],
    workingStyle: "我會主動收集必要資料，只在需要決策時通知您。"
  },
  180554: {
    id: 180554,
    name: "Jason Allen",
    role: "執行副總裁兼首席財務官",
    specialties: ["財務規劃", "預算管理", "投資分析", "風險控制"],
    methodology: "數據驅動的財務決策，平衡成長與穩健",
    successCases: [
      "優化年度預算流程，節省 20% 編制時間",
      "建立財務預警系統",
      "協助完成多輪融資財務準備"
    ],
    canHelp: [
      "自動彙整各部門預算需求",
      "生成財務分析報告",
      "識別異常支出並預警",
      "準備投資人財務資料"
    ],
    workingStyle: "我會定期更新財務狀況，重大決策需要您確認。"
  },
  180565: {
    id: 180565,
    name: "Karen Lewis",
    role: "Azure 數位營運副總裁",
    specialties: ["專案管理", "數位轉型", "團隊協作", "流程優化"],
    methodology: "敏捷式專案管理，快速迭代、持續改進",
    successCases: [
      "成功交付 100+ 專案",
      "建立跨部門協作流程",
      "專案準時交付率提升至 95%"
    ],
    canHelp: [
      "自動建立專案計畫和里程碑",
      "追蹤任務進度並預警延遲",
      "生成週報和專案狀態報告",
      "協調跨部門資源"
    ],
    workingStyle: "我會每日更新專案狀態，重要決策點會提醒您。"
  },
  90072: {
    id: 90072,
    name: "IT Support AI",
    role: "IT Support Specialist",
    specialties: ["系統維護", "故障排除", "安全監控", "技術支援"],
    methodology: "預防為主、快速響應、持續優化",
    successCases: [
      "平均故障響應時間 5 分鐘內",
      "系統可用性維持 99.9%",
      "自動化處理 80% 常見問題"
    ],
    canHelp: [
      "自動診斷系統問題",
      "執行標準修復程序",
      "監控系統健康狀態",
      "生成故障報告和改進建議"
    ],
    workingStyle: "我會 24/7 監控系統，緊急問題立即通知您。"
  },
  90045: {
    id: 90045,
    name: "Lara Chung",
    role: "Operations Manager",
    specialties: ["會議管理", "日程協調", "行政流程", "團隊溝通"],
    methodology: "高效、有序、以結果為導向",
    successCases: [
      "優化會議效率，平均會議時間減少 25%",
      "建立標準化會議紀錄模板",
      "自動化行政流程節省 40% 時間"
    ],
    canHelp: [
      "自動準備會議議程",
      "生成會議紀錄和行動項目",
      "追蹤待辦事項進度",
      "協調跨團隊日程"
    ],
    workingStyle: "我會提前準備好一切，您只需專注於決策。"
  },
  180564: {
    id: 180564,
    name: "Jonathan Garcia",
    role: "執行副總裁兼營運長",
    specialties: ["供應商管理", "採購策略", "成本優化", "合約談判"],
    methodology: "建立長期合作關係，追求雙贏",
    successCases: [
      "優化供應商組合，成本降低 15%",
      "建立供應商評估體系",
      "縮短採購週期 30%"
    ],
    canHelp: [
      "自動比較供應商報價",
      "追蹤合約到期和續約",
      "生成供應商績效報告",
      "準備談判資料"
    ],
    workingStyle: "我會持續監控供應商表現，關鍵決策需要您確認。"
  },
  180568: {
    id: 180568,
    name: "Jessica Hall",
    role: "Create with Copilot 產品副總裁",
    specialties: ["產品設計", "用戶體驗", "創新策略", "AI 整合"],
    methodology: "用戶為中心的設計思維，數據驅動迭代",
    successCases: [
      "主導 Microsoft Copilot 產品設計",
      "用戶滿意度提升 40%",
      "產品上線週期縮短 50%"
    ],
    canHelp: [
      "分析用戶需求和痛點",
      "設計產品原型和流程",
      "評估功能優先級",
      "準備產品發布材料"
    ],
    workingStyle: "我會快速產出方案，讓您做最終決策。"
  },
};

// AI 員工配對表（從 agents 表）
export const taskAgentMapping: Record<TaskType, {
  primary: { id: number; name: string; role: string };
  secondary?: { id: number; name: string; role: string };
  humanApprover?: string; // 需要真人審批的角色
}> = {
  "employee-onboarding": {
    primary: { id: 90046, name: "Rita Chu", role: "HR Business Partner" },
    humanApprover: "HR 主管",
  },
  "performance-review": {
    primary: { id: 90046, name: "Rita Chu", role: "HR Business Partner" },
    humanApprover: "直屬主管",
  },
  "expense-report": {
    primary: { id: 90061, name: "Finance AI", role: "Finance & Admin Executive" },
    secondary: { id: 180556, name: "Timothy Jones", role: "企業副總裁 - 財務" },
    humanApprover: "部門主管",
  },
  "budget-planning": {
    primary: { id: 180554, name: "Jason Allen", role: "執行副總裁兼首席財務官" },
    secondary: { id: 180556, name: "Timothy Jones", role: "企業副總裁 - 財務" },
    humanApprover: "財務長",
  },
  "project-kickoff": {
    primary: { id: 180565, name: "Karen Lewis", role: "Azure 數位營運副總裁" },
    secondary: { id: 180568, name: "Jessica Hall", role: "Create with Copilot 產品副總裁" },
    humanApprover: "專案發起人",
  },
  "weekly-standup": {
    primary: { id: 90045, name: "Lara Chung", role: "Operations Manager" },
    humanApprover: "會議主持人",
  },
  "vendor-management": {
    primary: { id: 180564, name: "Jonathan Garcia", role: "執行副總裁兼營運長" },
    humanApprover: "採購主管",
  },
  "system-incident": {
    primary: { id: 90072, name: "IT Support AI", role: "IT Support Specialist" },
    secondary: { id: 180435, name: "Emily Smith", role: "DevOps 工程師" },
    humanApprover: "IT 主管",
  },
  "custom": {
    primary: { id: 180568, name: "Jessica Hall", role: "Create with Copilot 產品副總裁" },
    humanApprover: "任務發起人",
  },
};

// 任務階段狀態
export type StageStatus = "pending" | "ai_processing" | "human_required" | "completed";

// 任務實例
export interface TaskInstance {
  id: string;
  type: TaskType;
  title: string;
  createdBy: string;        // 發起人 user ID
  createdAt: Date;
  currentStage: number;
  totalStages: number;
  status: "active" | "completed" | "cancelled";
  assignedAI: {
    id: number;
    name: string;
    role: string;
  };
  humanApprover?: {
    role: string;
    userId?: string;
    status: "pending" | "approved" | "rejected";
  };
  stages: {
    id: number;
    name: string;
    status: StageStatus;
    assignTo: "ai" | "human" | "both";
    completedAt?: Date;
    notes?: string;
  }[];
}

// 創建任務並自動分配 AI 員工
export function createTask(
  type: TaskType,
  title: string,
  createdBy: string,
  stages: { id: number; name: string; assignTo: "ai" | "human" | "both" }[]
): TaskInstance {
  const mapping = taskAgentMapping[type];
  
  return {
    id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    title,
    createdBy,
    createdAt: new Date(),
    currentStage: 1,
    totalStages: stages.length,
    status: "active",
    assignedAI: mapping.primary,
    humanApprover: mapping.humanApprover ? {
      role: mapping.humanApprover,
      status: "pending",
    } : undefined,
    stages: stages.map((s) => ({
      ...s,
      status: s.id === 1 ? (s.assignTo === "ai" ? "ai_processing" : "pending") : "pending",
    })),
  };
}

// 獲取用戶的待辦任務（根據角色）
export function getUserTasks(userId: string, userRole: string): {
  myTasks: TaskInstance[];      // 我發起的任務
  pendingApproval: TaskInstance[]; // 等我審批的任務
  aiHandling: TaskInstance[];   // AI 正在處理的任務
} {
  // 這裡會從資料庫查詢，現在返回空陣列作為示例
  return {
    myTasks: [],
    pendingApproval: [],
    aiHandling: [],
  };
}

// 通知類型
export type NotificationType = 
  | "task_assigned"       // 任務被分配
  | "stage_complete"      // 階段完成
  | "approval_required"   // 需要審批
  | "approval_result"     // 審批結果
  | "task_complete"       // 任務完成
  | "ai_question";        // AI 有問題需要確認

// 通知實例
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  taskId: string;
  taskTitle: string;
  fromAI?: { id: number; name: string };
  toUserId?: string;
  toRole?: string;
  createdAt: Date;
  readAt?: Date;
  actionRequired: boolean;
  actionUrl?: string;
}

// 內存通知存儲（實際應該用資料庫）
const notifications: Notification[] = [];

// 創建通知
export function createNotification(
  type: NotificationType,
  task: TaskInstance,
  options: {
    title: string;
    message: string;
    toUserId?: string;
    toRole?: string;
    actionRequired?: boolean;
  }
): Notification {
  const notification: Notification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    title: options.title,
    message: options.message,
    taskId: task.id,
    taskTitle: task.title,
    fromAI: task.assignedAI,
    toUserId: options.toUserId,
    toRole: options.toRole,
    createdAt: new Date(),
    actionRequired: options.actionRequired ?? false,
    actionUrl: `/task/${task.id}`,
  };
  
  notifications.push(notification);
  return notification;
}

// 獲取用戶的通知
export function getUserNotifications(userId: string): Notification[] {
  return notifications
    .filter(n => n.toUserId === userId || !n.toUserId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

// 標記通知已讀
export function markNotificationRead(notificationId: string): void {
  const notification = notifications.find(n => n.id === notificationId);
  if (notification) {
    notification.readAt = new Date();
  }
}

// 通知真人審批
export async function notifyHumanApprover(task: TaskInstance, stage: number): Promise<Notification> {
  const stageData = task.stages.find(s => s.id === stage);
  
  const notification = createNotification("approval_required", task, {
    title: `需要您審批：${task.title}`,
    message: `${task.assignedAI.name} 已完成「${stageData?.name || '階段'}」，等待您的審核。`,
    toRole: task.humanApprover?.role,
    actionRequired: true,
  });
  
  console.log(`[Notification] ${notification.title} - ${notification.message}`);
  return notification;
}

// AI 完成階段後的處理
export async function onAIStageComplete(task: TaskInstance, stageId: number): Promise<TaskInstance> {
  const stage = task.stages.find(s => s.id === stageId);
  if (!stage) return task;
  
  stage.status = "completed";
  stage.completedAt = new Date();
  
  // 查找下一個階段
  const nextStage = task.stages.find(s => s.id === stageId + 1);
  if (nextStage) {
    task.currentStage = nextStage.id;
    
    if (nextStage.assignTo === "human") {
      nextStage.status = "human_required";
      await notifyHumanApprover(task, nextStage.id);
    } else if (nextStage.assignTo === "ai") {
      nextStage.status = "ai_processing";
      // TODO: 觸發 AI 處理
    } else {
      nextStage.status = "pending";
    }
  } else {
    // 所有階段完成
    task.status = "completed";
  }
  
  return task;
}

export default {
  taskAgentMapping,
  createTask,
  getUserTasks,
  onAIStageComplete,
  notifyHumanApprover,
};
