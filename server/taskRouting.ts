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

// 通知真人審批
export async function notifyHumanApprover(task: TaskInstance, stage: number): Promise<void> {
  // TODO: 發送通知（Slack、Email、Push Notification）
  console.log(`[Task ${task.id}] Stage ${stage} requires human approval from ${task.humanApprover?.role}`);
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
