/**
 * 幕僚長 AI 服務
 * 負責：
 * 1. 理解用戶意圖
 * 2. 推薦 AI 員工組隊
 * 3. 派發任務
 * 4. 追蹤進度
 */
import OpenAI from "openai";
import { query } from "./db.js";

// 意圖類型
export type IntentType = 
  | "build_team"      // 組建團隊
  | "assign_task"     // 派發任務
  | "check_progress"  // 查看進度
  | "check_todo"      // 今日待辦
  | "general_chat"    // 一般對話
  | "unknown";

// AI 員工推薦
export interface AgentRecommendation {
  id: number;
  name: string;
  title: string;
  avatar: string | null;
  reason: string;
  role: "primary" | "support";
}

// 幕僚長回應
export interface ChiefOfStaffResponse {
  intent: IntentType;
  message: string;
  recommendations?: AgentRecommendation[];
  suggestedActions?: {
    label: string;
    action: string;
    params?: Record<string, any>;
  }[];
  taskCreated?: {
    id: string;
    title: string;
    assignedTo: string[];
  };
}

// 創建 OpenAI 客戶端（優先使用智譜，無地區限制）
function createClient(): OpenAI {
  // 優先使用智譜（無地區限制）
  if (process.env.ZHIPU_API_KEY) {
    return new OpenAI({
      apiKey: process.env.ZHIPU_API_KEY,
      baseURL: "https://open.bigmodel.cn/api/paas/v4",
    });
  }
  // 其次使用通義千問
  if (process.env.QIANWEN_API_KEY) {
    return new OpenAI({
      apiKey: process.env.QIANWEN_API_KEY,
      baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    });
  }
  // 最後使用 OpenAI（可能有地區限制）
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// 獲取模型名稱
function getModelName(): string {
  if (process.env.ZHIPU_API_KEY) return "glm-4-flash";
  if (process.env.QIANWEN_API_KEY) return "qwen-plus";
  return "gpt-4o-mini";
}

/**
 * 分析用戶意圖
 */
async function analyzeIntent(message: string): Promise<{
  intent: IntentType;
  taskDescription?: string;
  skills?: string[];
}> {
  const client = createClient();
  
  const response = await client.chat.completions.create({
    model: getModelName(),
    messages: [
      {
        role: "system",
        content: `你是一個意圖分析助手。分析用戶訊息並返回 JSON 格式：
{
  "intent": "build_team" | "assign_task" | "check_progress" | "check_todo" | "general_chat",
  "taskDescription": "任務描述（如果有）",
  "skills": ["需要的技能1", "技能2"]
}

意圖說明：
- build_team: 用戶想組建團隊、找人、招募
- assign_task: 用戶想派發任務、分配工作
- check_progress: 用戶想查看進度、追蹤狀態
- check_todo: 用戶想看今日待辦、任務列表
- general_chat: 一般對話、問答

只返回 JSON，不要其他內容。`
      },
      {
        role: "user",
        content: message
      }
    ],
    temperature: 0.3,
    max_tokens: 300,
  });

  try {
    const content = response.choices[0]?.message?.content || "{}";
    const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return { intent: "general_chat" };
  }
}

/**
 * 根據技能需求推薦 AI 員工
 */
async function recommendAgents(
  taskDescription: string,
  skills: string[] = []
): Promise<AgentRecommendation[]> {
  // 先從資料庫查詢匹配的 AI 員工
  const skillConditions = skills.length > 0
    ? skills.map(() => `(skills LIKE ? OR specialty LIKE ? OR title LIKE ?)`).join(" OR ")
    : "1=1";
  
  const params: any[] = [];
  skills.forEach(skill => {
    params.push(`%${skill}%`, `%${skill}%`, `%${skill}%`);
  });

  const agents = await query(
    `SELECT id, name, title, avatarUrl, bio, specialty, skills, layer
     FROM agents 
     WHERE isAvailable = 1 AND (${skillConditions})
     ORDER BY rating DESC, isFeatured DESC
     LIMIT 5`,
    params
  );

  if (agents.length === 0) {
    // 如果沒找到匹配的，返回評分最高的
    const topAgents = await query(
      `SELECT id, name, title, avatarUrl, bio, specialty, skills, layer
       FROM agents 
       WHERE isAvailable = 1
       ORDER BY rating DESC, isFeatured DESC
       LIMIT 3`
    );
    agents.push(...topAgents);
  }

  // 用 AI 分析最適合的人選
  const client = createClient();
  const agentList = agents.map((a: any) => ({
    id: a.id,
    name: a.name,
    title: a.title,
    specialty: a.specialty,
    skills: a.skills,
  }));

  const response = await client.chat.completions.create({
    model: getModelName(),
    messages: [
      {
        role: "system",
        content: `你是團隊組建專家。根據任務需求，從候選人中選出最適合的團隊。
返回 JSON 格式：
{
  "recommendations": [
    { "id": 數字, "role": "primary" | "support", "reason": "選擇原因（20字內）" }
  ]
}
最多選 3 人，第一人為 primary（主責），其他為 support（協助）。
只返回 JSON。`
      },
      {
        role: "user",
        content: `任務：${taskDescription}\n需要技能：${skills.join(", ") || "通用"}\n\n候選人：\n${JSON.stringify(agentList, null, 2)}`
      }
    ],
    temperature: 0.5,
    max_tokens: 500,
  });

  try {
    const content = response.choices[0]?.message?.content || "{}";
    const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
    const result = JSON.parse(cleaned);
    
    return (result.recommendations || []).map((rec: any) => {
      const agent = agents.find((a: any) => a.id === rec.id);
      return {
        id: rec.id,
        name: agent?.name || "未知",
        title: agent?.title || "",
        avatar: agent?.avatarUrl || null,
        reason: rec.reason,
        role: rec.role,
      };
    });
  } catch {
    // fallback: 返回前兩個候選人
    return agents.slice(0, 2).map((a: any, i: number) => ({
      id: a.id,
      name: a.name,
      title: a.title,
      avatar: a.avatarUrl,
      reason: i === 0 ? "專業匹配度高" : "可提供協助",
      role: i === 0 ? "primary" : "support" as const,
    }));
  }
}

/**
 * 生成幕僚長回應
 */
async function generateResponse(
  message: string,
  intent: IntentType,
  context?: {
    recommendations?: AgentRecommendation[];
    taskDescription?: string;
  }
): Promise<string> {
  const client = createClient();

  let systemPrompt = `你是「幕僚長」，SoWork 平台的 AI 主管助理。
你的職責是協助用戶組建團隊、派發任務、追蹤進度。

回覆風格：
- 專業但親切
- 簡潔有力（100字內）
- 主動提供下一步建議
- 使用繁體中文`;

  let contextInfo = "";
  
  if (intent === "build_team" && context?.recommendations) {
    contextInfo = `\n\n已為用戶推薦了以下 AI 員工：
${context.recommendations.map(r => `- ${r.name}（${r.title}）：${r.reason}`).join("\n")}`;
  }

  const response = await client.chat.completions.create({
    model: getModelName(),
    messages: [
      { role: "system", content: systemPrompt + contextInfo },
      { role: "user", content: message }
    ],
    temperature: 0.7,
    max_tokens: 300,
  });

  return response.choices[0]?.message?.content || "收到，讓我來協助你處理這件事。";
}

/**
 * 主要對話處理函數
 */
export async function chat(
  userMessage: string,
  conversationHistory?: { role: "user" | "assistant"; content: string }[]
): Promise<ChiefOfStaffResponse> {
  try {
    // 1. 分析意圖
    const { intent, taskDescription, skills } = await analyzeIntent(userMessage);

    let response: ChiefOfStaffResponse = {
      intent,
      message: "",
    };

    // 2. 根據意圖處理
    switch (intent) {
      case "build_team":
      case "assign_task": {
        // 推薦 AI 員工
        const recommendations = await recommendAgents(
          taskDescription || userMessage,
          skills
        );
        
        response.recommendations = recommendations;
        response.message = await generateResponse(userMessage, intent, {
          recommendations,
          taskDescription,
        });
        
        // 建議操作
        response.suggestedActions = [
          { label: "確認組隊", action: "confirm_team", params: { agents: recommendations.map(r => r.id) } },
          { label: "換人選", action: "change_team" },
          { label: "直接派發任務", action: "create_task" },
        ];
        break;
      }

      case "check_progress": {
        response.message = await generateResponse(userMessage, intent);
        response.suggestedActions = [
          { label: "查看所有進行中任務", action: "view_tasks", params: { status: "active" } },
          { label: "查看已完成任務", action: "view_tasks", params: { status: "completed" } },
        ];
        break;
      }

      case "check_todo": {
        response.message = await generateResponse(userMessage, intent);
        response.suggestedActions = [
          { label: "查看今日待辦", action: "view_todo" },
          { label: "新增任務", action: "create_task" },
        ];
        break;
      }

      default: {
        response.message = await generateResponse(userMessage, intent);
      }
    }

    return response;

  } catch (error) {
    console.error("ChiefOfStaff chat error:", error);
    return {
      intent: "unknown",
      message: "抱歉，我暫時無法處理這個請求。請稍後再試，或換個方式描述您的需求。",
    };
  }
}

// ============ 任務系統 ============

export interface Task {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "review" | "completed";
  currentStage: number;
  totalStages: number;
  assignedAgents: {
    id: number;
    name: string;
    title: string;
    avatar: string | null;
    role: "primary" | "support";
  }[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  stages: {
    name: string;
    status: "pending" | "in_progress" | "completed";
    completedAt?: Date;
  }[];
  outputs?: {
    type: "document" | "report" | "analysis";
    title: string;
    url?: string;
  }[];
}

// 內存存儲（之後可換成資料庫）
const tasks: Map<string, Task> = new Map();

/**
 * 確認團隊並建立任務
 */
export async function confirmTeam(
  agentIds: number[],
  taskTitle: string,
  taskDescription: string
): Promise<{
  success: boolean;
  taskId?: string;
  task?: Task;
  message: string;
}> {
  const taskId = `task_${Date.now()}`;
  
  // 獲取被選中的 AI 員工
  const agents = await query(
    `SELECT id, name, title, avatarUrl FROM agents WHERE id IN (${agentIds.map(() => "?").join(",")})`,
    agentIds
  );
  
  const assignedAgents = agents.map((a: any, i: number) => ({
    id: a.id,
    name: a.name,
    title: a.title,
    avatar: a.avatarUrl,
    role: i === 0 ? "primary" : "support" as const,
  }));

  // 默認 5 個階段
  const defaultStages = [
    { name: "任務啟動", status: "completed" as const, completedAt: new Date() },
    { name: "資料收集", status: "in_progress" as const },
    { name: "分析處理", status: "pending" as const },
    { name: "產出報告", status: "pending" as const },
    { name: "審核交付", status: "pending" as const },
  ];

  const task: Task = {
    id: taskId,
    title: taskTitle || "新任務",
    description: taskDescription,
    status: "in_progress",
    currentStage: 2,
    totalStages: 5,
    assignedAgents,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: "dev-user-001",
    stages: defaultStages,
  };

  // 保存任務
  tasks.set(taskId, task);

  const agentNames = assignedAgents.map(a => a.name);
  
  return {
    success: true,
    taskId,
    task,
    message: `已成功建立任務「${task.title}」！\n\n團隊成員：${agentNames.join("、")}\n\n${assignedAgents[0]?.name} 已開始執行，預計很快會有進度更新。`,
  };
}

/**
 * 獲取所有任務
 */
export function getTasks(filter?: {
  status?: "all" | "active" | "completed";
}): Task[] {
  const allTasks = Array.from(tasks.values());
  
  if (!filter || filter.status === "all") {
    return allTasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  if (filter.status === "active") {
    return allTasks
      .filter(t => t.status === "pending" || t.status === "in_progress" || t.status === "review")
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  if (filter.status === "completed") {
    return allTasks
      .filter(t => t.status === "completed")
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  return allTasks;
}

/**
 * 獲取單個任務
 */
export function getTask(taskId: string): Task | undefined {
  return tasks.get(taskId);
}

/**
 * 更新任務狀態
 */
export function updateTaskStatus(
  taskId: string,
  update: {
    status?: Task["status"];
    currentStage?: number;
    stageStatus?: { index: number; status: "pending" | "in_progress" | "completed" };
  }
): Task | undefined {
  const task = tasks.get(taskId);
  if (!task) return undefined;

  if (update.status) {
    task.status = update.status;
  }
  
  if (update.currentStage) {
    task.currentStage = update.currentStage;
  }
  
  if (update.stageStatus) {
    const { index, status } = update.stageStatus;
    if (task.stages[index]) {
      task.stages[index].status = status;
      if (status === "completed") {
        task.stages[index].completedAt = new Date();
      }
    }
  }
  
  task.updatedAt = new Date();
  tasks.set(taskId, task);
  
  return task;
}

/**
 * 模擬任務進度（用於演示）
 */
export function simulateTaskProgress(taskId: string): void {
  const task = tasks.get(taskId);
  if (!task || task.status === "completed") return;

  // 每次調用推進一個階段
  if (task.currentStage < task.totalStages) {
    // 完成當前階段
    if (task.stages[task.currentStage - 1]) {
      task.stages[task.currentStage - 1].status = "completed";
      task.stages[task.currentStage - 1].completedAt = new Date();
    }
    
    // 開始下一階段
    task.currentStage++;
    if (task.stages[task.currentStage - 1]) {
      task.stages[task.currentStage - 1].status = "in_progress";
    }
    
    // 檢查是否完成
    if (task.currentStage >= task.totalStages) {
      task.status = "review";
    }
    
    task.updatedAt = new Date();
    tasks.set(taskId, task);
  }
}
