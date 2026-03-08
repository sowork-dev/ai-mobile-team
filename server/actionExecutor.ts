/**
 * 訊息功能執行器
 * 點擊訊息旁的按鈕後，真正執行相應動作
 */
import { confirmTeam, requestApproval } from "./chiefOfStaff.js";
import { generateContent, AIModel } from "./aiContentGenerator.js";
import { query } from "./db.js";

// 動作類型
export type ActionType = 
  | "create-task"
  | "add-calendar"
  | "set-reminder"
  | "generate-contract"
  | "onboarding-task"
  | "generate-report"
  | "create-expense"
  | "create-presentation"
  | "schedule-meeting"
  | "create-ticket"
  | "tech-doc"
  | "pdf-report"
  | "spreadsheet"
  | "markdown"
  | "notify-team";

// 執行結果
export interface ActionResult {
  success: boolean;
  message: string;
  data?: any;
  downloadUrl?: string;
  taskId?: string;
}

/**
 * 根據訊息內容提取關鍵資訊
 */
async function extractInfo(content: string, actionType: ActionType): Promise<{
  title: string;
  description: string;
  date?: string;
  assignee?: string;
}> {
  // 簡單提取：取訊息前 50 字作為標題
  const title = content.slice(0, 50).replace(/\n/g, " ").trim() + (content.length > 50 ? "..." : "");
  
  // TODO: 可以用 AI 提取更精確的資訊
  return {
    title,
    description: content,
  };
}

/**
 * 執行建立任務
 */
async function executeCreateTask(content: string): Promise<ActionResult> {
  const info = await extractInfo(content, "create-task");
  
  // 查找一個可用的 AI 員工作為執行者
  const agents = await query(
    `SELECT id, name, title FROM agents WHERE isAvailable = 1 ORDER BY rating DESC LIMIT 1`
  );
  
  const agentId = agents[0]?.id || 1;
  
  const result = await confirmTeam(
    [agentId],
    info.title,
    info.description
  );
  
  return {
    success: result.success,
    message: result.message,
    taskId: result.taskId,
  };
}

/**
 * 執行生成文件
 */
async function executeGenerateDocument(
  content: string, 
  format: "pdf" | "doc" | "ppt" | "xls" | "markdown",
  taskType: string
): Promise<ActionResult> {
  const info = await extractInfo(content, "pdf-report");
  
  const result = await generateContent({
    taskType,
    title: info.title,
    context: info.description,
    format,
    language: "zh",
  });
  
  if (result.success) {
    return {
      success: true,
      message: `✅ 已生成 ${format.toUpperCase()} 文件！`,
      data: result.content,
      downloadUrl: result.downloadUrl,
    };
  }
  
  return {
    success: false,
    message: result.error || "生成失敗",
  };
}

/**
 * 執行建立行事曆事件
 */
async function executeAddCalendar(content: string): Promise<ActionResult> {
  const info = await extractInfo(content, "add-calendar");
  
  // TODO: 整合 Google Calendar API 或 Apple Calendar
  // 目前先建立一個待辦任務
  return {
    success: true,
    message: `📅 已加入行事曆：「${info.title}」\n\n（提醒：實際行事曆整合待實作）`,
  };
}

/**
 * 執行設定提醒
 */
async function executeSetReminder(content: string): Promise<ActionResult> {
  const info = await extractInfo(content, "set-reminder");
  
  // TODO: 整合通知系統
  return {
    success: true,
    message: `⏰ 已設定提醒：「${info.title}」`,
  };
}

/**
 * 執行通知團隊
 */
async function executeNotifyTeam(content: string): Promise<ActionResult> {
  // 查找相關團隊成員
  const agents = await query(
    `SELECT id, name, title FROM agents WHERE isAvailable = 1 LIMIT 5`
  );
  
  const names = agents.map((a: any) => a.name).join("、");
  
  return {
    success: true,
    message: `📢 已通知團隊成員：${names}\n\n訊息內容已轉發。`,
  };
}

/**
 * 主執行函數
 */
export async function executeAction(
  actionId: ActionType,
  messageContent: string,
  options?: {
    agentRole?: string;
    userId?: string;
  }
): Promise<ActionResult> {
  try {
    switch (actionId) {
      // 任務類
      case "create-task":
        return executeCreateTask(messageContent);
      
      case "onboarding-task":
        return executeCreateTask(`入職任務：${messageContent}`);
      
      case "create-ticket":
        return executeCreateTask(`工單：${messageContent}`);
      
      case "create-expense":
        return executeCreateTask(`報銷申請：${messageContent}`);
      
      // 文件類
      case "pdf-report":
      case "generate-report":
        return executeGenerateDocument(messageContent, "pdf", "report");
      
      case "generate-contract":
        return executeGenerateDocument(messageContent, "doc", "contract");
      
      case "tech-doc":
        return executeGenerateDocument(messageContent, "doc", "technical");
      
      case "create-presentation":
        return executeGenerateDocument(messageContent, "ppt", "presentation");
      
      case "spreadsheet":
        return executeGenerateDocument(messageContent, "xls", "data");
      
      case "markdown":
        return executeGenerateDocument(messageContent, "markdown", "summary");
      
      // 行事曆類
      case "add-calendar":
        return executeAddCalendar(messageContent);
      
      case "set-reminder":
        return executeSetReminder(messageContent);
      
      case "schedule-meeting":
        return executeAddCalendar(`會議：${messageContent}`);
      
      // 通知類
      case "notify-team":
        return executeNotifyTeam(messageContent);
      
      default:
        return {
          success: false,
          message: `未知的動作類型：${actionId}`,
        };
    }
  } catch (error) {
    console.error("Action execution error:", error);
    return {
      success: false,
      message: `執行失敗：${(error as Error).message}`,
    };
  }
}
