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
import { scanKnowledgeBase, isConnected } from "./onedrive.js";
import { getKnowledgeContext as getDbKnowledgeContext } from "./knowledgeBase.js";

// 意圖類型
export type IntentType = 
  | "build_team"      // 組建團隊
  | "assign_task"     // 派發任務
  | "check_progress"  // 查看進度
  | "check_todo"      // 今日待辦
  | "knowledge_query" // 查詢知識庫
  | "general_chat"    // 一般對話
  | "unknown";

// 知識庫上下文緩存
let knowledgeCache: { docs: Array<{ name: string; content: string }>; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 分鐘緩存

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
 * 獲取知識庫上下文（整合 DB + OneDrive）
 */
async function getKnowledgeContext(
  userId: string = "dev-user-001",
  userQuery = ""
): Promise<string> {
  const parts: string[] = [];

  // 1. 從資料庫查詢 agent_knowledge_base
  if (userQuery) {
    try {
      const dbContext = await getDbKnowledgeContext(userQuery);
      if (dbContext) parts.push(dbContext);
    } catch (error) {
      console.error("Failed to fetch DB knowledge:", error);
    }
  }

  // 2. 從 OneDrive 查詢（如果已連接）
  if (isConnected(userId)) {
    const now = Date.now();
    if (knowledgeCache && now - knowledgeCache.timestamp < CACHE_TTL) {
      const oneDriveCtx = formatKnowledgeDocs(knowledgeCache.docs);
      if (oneDriveCtx) parts.push(oneDriveCtx);
    } else {
      try {
        const docs = await scanKnowledgeBase(userId);
        knowledgeCache = {
          docs: docs.map((d) => ({ name: d.name, content: d.content.slice(0, 2000) })),
          timestamp: now,
        };
        const oneDriveCtx = formatKnowledgeDocs(knowledgeCache.docs);
        if (oneDriveCtx) parts.push(oneDriveCtx);
      } catch (error) {
        console.error("Failed to fetch OneDrive knowledge:", error);
      }
    }
  }

  return parts.join("\n\n");
}

function formatKnowledgeDocs(docs: Array<{ name: string; content: string }>): string {
  if (docs.length === 0) return "";
  
  return `\n\n=== 公司知識庫 ===\n${docs.map(d => 
    `【${d.name}】\n${d.content}`
  ).join("\n\n---\n\n")}\n=== 知識庫結束 ===`;
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
  "intent": "build_team" | "assign_task" | "check_progress" | "check_todo" | "knowledge_query" | "general_chat",
  "taskDescription": "任務描述（如果有）",
  "skills": ["需要的技能1", "技能2"]
}

意圖說明：
- build_team: 用戶想組建團隊、找人、招募
- assign_task: 用戶想派發任務、分配工作
- check_progress: 用戶想查看進度、追蹤狀態
- check_todo: 用戶想看今日待辦、任務列表
- knowledge_query: 用戶詢問公司資料、文件、政策、規定、SOP、產品資訊等
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

// 公司背景上下文
export interface CompanyContext {
  company: string;
  industry: string;
  challenge: string;
  decisionMaker?: string;
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
    companyContext?: CompanyContext;
    knowledgeContext?: string;
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

  // 根據公司背景客製化回應
  if (context?.companyContext) {
    const { company, industry, challenge, decisionMaker } = context.companyContext;
    systemPrompt += `\n\n當前服務客戶：
- 公司：${company}
- 行業：${industry}
- 核心挑戰：${challenge}
${decisionMaker ? `- 決策者：${decisionMaker}` : ""}

請使用${industry}行業的專業術語，針對上述挑戰提供具體建議。`;
  }

  let contextInfo = "";

  if (intent === "build_team" && context?.recommendations) {
    contextInfo = `\n\n已為用戶推薦了以下 AI 員工：
${context.recommendations.map(r => `- ${r.name}（${r.title}）：${r.reason}`).join("\n")}`;
  }

  // 注入品牌知識庫上下文
  if (context?.knowledgeContext) {
    contextInfo += context.knowledgeContext;
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
 * 生成知識庫查詢回應
 */
async function generateKnowledgeResponse(
  message: string,
  knowledgeContext: string
): Promise<string> {
  const client = createClient();

  const systemPrompt = `你是「幕僚長」，SoWork 平台的 AI 主管助理。
用戶正在詢問公司相關資料。請根據知識庫中的內容回答。

回覆原則：
- 如果知識庫中有相關資訊，引用並回答
- 如果找不到相關資訊，誠實說明並建議其他方式
- 使用繁體中文
- 簡潔明瞭

${knowledgeContext || "（知識庫尚未連接，請先連接 OneDrive）"}`;

  const response = await client.chat.completions.create({
    model: getModelName(),
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: message }
    ],
    temperature: 0.5,
    max_tokens: 500,
  });

  return response.choices[0]?.message?.content || "抱歉，目前無法查詢知識庫。請確認已連接 OneDrive。";
}

/**
 * 主要對話處理函數
 */
export async function chat(
  userMessage: string,
  conversationHistory?: { role: "user" | "assistant"; content: string }[],
  companyContext?: CompanyContext
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

        // 獲取相關品牌知識（幫助 AI 理解任務背景）
        const knowledgeContext = await getKnowledgeContext("dev-user-001", userMessage);

        response.recommendations = recommendations;
        response.message = await generateResponse(userMessage, intent, {
          recommendations,
          taskDescription,
          companyContext,
          knowledgeContext,
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
        response.message = await generateResponse(userMessage, intent, { companyContext });
        response.suggestedActions = [
          { label: "查看所有進行中任務", action: "view_tasks", params: { status: "active" } },
          { label: "查看已完成任務", action: "view_tasks", params: { status: "completed" } },
        ];
        break;
      }

      case "check_todo": {
        response.message = await generateResponse(userMessage, intent, { companyContext });
        response.suggestedActions = [
          { label: "查看今日待辦", action: "view_todo" },
          { label: "新增任務", action: "create_task" },
        ];
        break;
      }

      case "knowledge_query": {
        // 獲取知識庫上下文（整合 DB + OneDrive）
        const knowledgeContext = await getKnowledgeContext("dev-user-001", userMessage);
        response.message = await generateKnowledgeResponse(userMessage, knowledgeContext);
        response.suggestedActions = [
          { label: "連接更多資料來源", action: "connect_onedrive" },
          { label: "搜尋知識庫", action: "search_knowledge" },
        ];
        break;
      }

      default: {
        response.message = await generateResponse(userMessage, intent, { companyContext });
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

// 審批狀態
export type ApprovalStatus = "pending" | "approved" | "rejected";

// 審批記錄
export interface ApprovalRecord {
  id: string;
  taskId: string;
  stageIndex: number;
  stageName: string;
  requestedAt: Date;
  respondedAt?: Date;
  status: ApprovalStatus;
  approverId: string;
  approverName: string;
  comment?: string;
  aiSummary?: string;     // AI 產出摘要
  deliverables?: {        // 交付物
    type: string;
    title: string;
    url?: string;
    preview?: string;
  }[];
}

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
    status: "pending" | "in_progress" | "completed" | "needs_approval";
    completedAt?: Date;
    requiresApproval?: boolean;  // 此階段是否需要人工審批
    approvalId?: string;         // 對應的審批記錄 ID
  }[];
  outputs?: {
    type: "document" | "report" | "analysis";
    title: string;
    url?: string;
  }[];
  // 新增：審批相關
  pendingApproval?: ApprovalRecord;  // 目前等待審批的記錄
  approvalHistory?: ApprovalRecord[]; // 審批歷史
}

// 內存存儲（之後可換成資料庫）
const tasks: Map<string, Task> = new Map();
const approvalRecords: Map<string, ApprovalRecord> = new Map();

/**
 * 請求審批 - 當 AI 完成階段工作後調用
 */
export async function requestApproval(
  taskId: string,
  stageIndex: number,
  aiSummary: string,
  deliverables?: ApprovalRecord["deliverables"]
): Promise<ApprovalRecord | null> {
  const task = tasks.get(taskId);
  if (!task) return null;
  
  const stage = task.stages[stageIndex];
  if (!stage) return null;
  
  const approvalId = `approval_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  
  const approval: ApprovalRecord = {
    id: approvalId,
    taskId,
    stageIndex,
    stageName: stage.name,
    requestedAt: new Date(),
    status: "pending",
    approverId: task.createdBy,  // 預設由任務建立者審批
    approverName: "CJ Wang",     // TODO: 從用戶資料庫獲取
    aiSummary,
    deliverables,
  };
  
  // 儲存審批記錄
  approvalRecords.set(approvalId, approval);
  
  // 更新任務狀態
  stage.status = "needs_approval";
  stage.requiresApproval = true;
  stage.approvalId = approvalId;
  task.pendingApproval = approval;
  task.status = "review";
  task.updatedAt = new Date();
  tasks.set(taskId, task);
  
  return approval;
}

/**
 * 處理審批結果
 */
export async function handleApproval(
  approvalId: string,
  decision: "approved" | "rejected",
  comment?: string
): Promise<{
  success: boolean;
  task?: Task;
  message: string;
}> {
  const approval = approvalRecords.get(approvalId);
  if (!approval) {
    return { success: false, message: "找不到此審批記錄" };
  }
  
  if (approval.status !== "pending") {
    return { success: false, message: "此審批已經處理過了" };
  }
  
  const task = tasks.get(approval.taskId);
  if (!task) {
    return { success: false, message: "找不到對應的任務" };
  }
  
  // 更新審批記錄
  approval.status = decision;
  approval.respondedAt = new Date();
  approval.comment = comment;
  approvalRecords.set(approvalId, approval);
  
  // 更新任務
  const stage = task.stages[approval.stageIndex];
  if (!stage) {
    return { success: false, message: "階段不存在" };
  }
  
  // 記錄審批歷史
  if (!task.approvalHistory) {
    task.approvalHistory = [];
  }
  task.approvalHistory.push(approval);
  task.pendingApproval = undefined;
  
  if (decision === "approved") {
    // 通過：完成當前階段，進入下一階段
    stage.status = "completed";
    stage.completedAt = new Date();
    
    // 檢查是否還有下一階段
    if (approval.stageIndex + 1 < task.stages.length) {
      task.currentStage = approval.stageIndex + 2; // +2 因為 currentStage 從 1 開始
      task.stages[approval.stageIndex + 1].status = "in_progress";
      task.status = "in_progress";
    } else {
      // 最後階段審批通過，任務完成
      task.status = "completed";
    }
    
    task.updatedAt = new Date();
    tasks.set(task.id, task);
    
    return {
      success: true,
      task,
      message: `✅ 已通過「${stage.name}」階段的審批${comment ? `\n備註：${comment}` : ""}`,
    };
  } else {
    // 駁回：階段保持，等待 AI 重做
    stage.status = "in_progress";
    task.status = "in_progress";
    task.updatedAt = new Date();
    tasks.set(task.id, task);
    
    return {
      success: true,
      task,
      message: `❌ 已駁回「${stage.name}」階段${comment ? `\n原因：${comment}` : ""}\n\nAI 將根據您的反饋重新處理。`,
    };
  }
}

/**
 * 獲取待審批列表
 */
export function getPendingApprovals(userId?: string): ApprovalRecord[] {
  const pending: ApprovalRecord[] = [];
  
  approvalRecords.forEach(record => {
    if (record.status === "pending") {
      if (!userId || record.approverId === userId) {
        pending.push(record);
      }
    }
  });
  
  return pending.sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());
}

/**
 * 獲取審批記錄
 */
export function getApprovalRecord(approvalId: string): ApprovalRecord | undefined {
  return approvalRecords.get(approvalId);
}

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
 * 現在會在關鍵階段觸發審批請求
 */
export async function simulateTaskProgress(taskId: string): Promise<{
  task: Task | undefined;
  needsApproval: boolean;
  approvalId?: string;
}> {
  const task = tasks.get(taskId);
  if (!task || task.status === "completed") {
    return { task, needsApproval: false };
  }

  // 每次調用推進一個階段
  if (task.currentStage < task.totalStages) {
    const currentStageIndex = task.currentStage - 1;
    const currentStage = task.stages[currentStageIndex];
    
    // 完成當前階段
    if (currentStage) {
      currentStage.status = "completed";
      currentStage.completedAt = new Date();
    }
    
    // 開始下一階段
    task.currentStage++;
    const nextStageIndex = task.currentStage - 1;
    const nextStage = task.stages[nextStageIndex];
    
    if (nextStage) {
      nextStage.status = "in_progress";
      
      // 關鍵階段需要審批（例如：產出報告、審核交付）
      const stagesNeedingApproval = ["產出報告", "審核交付", "方案審核", "最終確認"];
      
      if (stagesNeedingApproval.some(s => nextStage.name.includes(s))) {
        // 模擬 AI 完成工作後請求審批
        const aiSummary = `AI 已完成「${nextStage.name}」階段的工作。\n\n主要產出：\n• 分析報告已生成\n• 關鍵數據已整理\n• 建議方案已擬定\n\n請審閱後決定是否通過。`;
        
        const approval = await requestApproval(taskId, nextStageIndex, aiSummary, [
          { type: "pdf", title: `${task.title}_報告.pdf`, preview: "PDF 報告預覽..." },
          { type: "xlsx", title: `${task.title}_數據.xlsx`, preview: "Excel 數據表..." },
        ]);
        
        if (approval) {
          return { task: tasks.get(taskId), needsApproval: true, approvalId: approval.id };
        }
      }
    }
    
    // 檢查是否完成
    if (task.currentStage >= task.totalStages) {
      task.status = "review";
    }
    
    task.updatedAt = new Date();
    tasks.set(taskId, task);
  }
  
  return { task: tasks.get(taskId), needsApproval: false };
}
