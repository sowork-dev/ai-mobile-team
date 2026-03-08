/**
 * 種子數據 — 免登入體驗
 * 模擬公司：創智科技 InnoTech Solutions (52人)
 */

// 部門定義
export const DEMO_DEPARTMENTS = [
  { id: "product", name: "產品部", nameEn: "Product", icon: "🚀", headcount: 12 },
  { id: "sales", name: "業務部", nameEn: "Sales", icon: "💼", headcount: 10 },
  { id: "marketing", name: "行銷部", nameEn: "Marketing", icon: "📣", headcount: 8 },
  { id: "hr", name: "人資部", nameEn: "HR", icon: "👤", headcount: 6 },
  { id: "finance", name: "財務部", nameEn: "Finance", icon: "💰", headcount: 5 },
  { id: "it", name: "IT 部", nameEn: "IT", icon: "💻", headcount: 6 },
  { id: "operations", name: "營運部", nameEn: "Operations", icon: "⚙️", headcount: 4 },
];

// 模擬公司
export const DEMO_COMPANY = {
  id: "demo-company",
  name: "創智科技",
  nameEn: "InnoTech Solutions",
  industry: "B2B SaaS",
  headcount: 52,
  founded: "2023",
  description: "企業級軟體解決方案提供商",
};

// 例行會議
export const DEMO_MEETINGS = [
  {
    id: "meeting-1",
    department: "product",
    title: "產品週會",
    titleEn: "Product Weekly",
    schedule: "每週一 10:00",
    scheduleEn: "Mon 10:00",
    agenda: ["Sprint 回顧", "本週優先級", "技術障礙", "下週規劃"],
    outputs: ["會議紀錄", "進度報表", "任務清單", "Roadmap"],
  },
  {
    id: "meeting-2",
    department: "sales",
    title: "業績檢討會",
    titleEn: "Sales Review",
    schedule: "每週五 16:00",
    scheduleEn: "Fri 16:00",
    agenda: ["本週成交", "Pipeline 更新", "客戶反饋", "下週目標"],
    outputs: ["業績週報", "客戶清單", "成交摘要", "拜訪計畫"],
  },
  {
    id: "meeting-3",
    department: "marketing",
    title: "行銷週會",
    titleEn: "Marketing Weekly",
    schedule: "每週二 14:00",
    scheduleEn: "Tue 14:00",
    agenda: ["廣告成效", "內容排程", "活動進度", "預算使用"],
    outputs: ["行銷週報", "內容行事曆", "活動企劃", "社群貼文"],
  },
  {
    id: "meeting-4",
    department: "hr",
    title: "人資週會",
    titleEn: "HR Weekly",
    schedule: "每週三 09:00",
    scheduleEn: "Wed 09:00",
    agenda: ["招募進度", "新人報到", "離職處理", "員工關係"],
    outputs: ["招募表", "入職清單", "面談紀錄", "HR 報告"],
  },
  {
    id: "meeting-5",
    department: "finance",
    title: "財務月會",
    titleEn: "Finance Monthly",
    schedule: "每月第一週三 10:00",
    scheduleEn: "1st Wed 10:00",
    agenda: ["上月收支", "現金流", "應收帳款", "預算執行"],
    outputs: ["財務月報", "收支表", "預算分析", "現金流預測"],
  },
  {
    id: "meeting-6",
    department: "it",
    title: "技術週會",
    titleEn: "Tech Weekly",
    schedule: "每週四 11:00",
    scheduleEn: "Thu 11:00",
    agenda: ["系統狀態", "資安報告", "待辦工單", "採購需求"],
    outputs: ["系統週報", "工單清單", "資安報告", "採購單"],
  },
  {
    id: "meeting-7",
    department: "operations",
    title: "營運週會",
    titleEn: "Ops Weekly",
    schedule: "每週五 10:00",
    scheduleEn: "Fri 10:00",
    agenda: ["跨部門協調", "專案進度", "品質問題", "流程優化"],
    outputs: ["營運週報", "進度表", "品質報告", "改善提案"],
  },
];

// 模擬任務（已完成的示範）
export const DEMO_TASKS = [
  {
    id: "demo-task-1",
    title: "Q1 業績檢討報告",
    department: "sales",
    status: "completed",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    assignedAgents: ["銷售總監 AI", "數據分析師 AI"],
    outputs: [
      { type: "pdf", name: "Q1業績報告.pdf", size: "2.3MB" },
      { type: "xls", name: "客戶清單.xlsx", size: "156KB" },
      { type: "ppt", name: "業績簡報.pptx", size: "4.1MB" },
    ],
  },
  {
    id: "demo-task-2",
    title: "新員工入職流程",
    department: "hr",
    status: "completed",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    assignedAgents: ["HR 專員 AI", "IT 支援 AI"],
    outputs: [
      { type: "pdf", name: "入職清單.pdf", size: "512KB" },
      { type: "doc", name: "勞動合約.docx", size: "89KB" },
    ],
  },
  {
    id: "demo-task-3",
    title: "產品發布會企劃",
    department: "marketing",
    status: "in_progress",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    assignedAgents: ["行銷經理 AI", "設計師 AI", "PM AI"],
    currentStage: 2,
    totalStages: 4,
    stages: [
      { name: "企劃構思", status: "completed" },
      { name: "內容製作", status: "in_progress" },
      { name: "視覺設計", status: "pending" },
      { name: "最終審核", status: "pending" },
    ],
  },
  {
    id: "demo-task-4",
    title: "月度財務結算",
    department: "finance",
    status: "review",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    assignedAgents: ["財務長 AI", "會計 AI"],
    currentStage: 3,
    totalStages: 4,
  },
];

// 模擬 AI 員工（對應部門）
export const DEMO_AGENTS = [
  // 產品部
  { id: "agent-pm-1", name: "Karen", title: "資深 PM", department: "product", avatar: "👩‍💼" },
  { id: "agent-pm-2", name: "Leo", title: "技術 PM", department: "product", avatar: "👨‍💻" },
  { id: "agent-dev-1", name: "Kevin", title: "後端工程師", department: "product", avatar: "🧑‍💻" },
  
  // 業務部
  { id: "agent-sales-1", name: "David", title: "業務總監", department: "sales", avatar: "👔" },
  { id: "agent-sales-2", name: "Amy", title: "業務代表", department: "sales", avatar: "👩‍💼" },
  
  // 行銷部
  { id: "agent-mkt-1", name: "Vivian", title: "行銷經理", department: "marketing", avatar: "📢" },
  { id: "agent-mkt-2", name: "Luna", title: "設計師", department: "marketing", avatar: "🎨" },
  
  // 人資部
  { id: "agent-hr-1", name: "Rita", title: "HR 經理", department: "hr", avatar: "👤" },
  { id: "agent-hr-2", name: "Cindy", title: "招募專員", department: "hr", avatar: "📋" },
  
  // 財務部
  { id: "agent-fin-1", name: "Jason", title: "財務長", department: "finance", avatar: "💰" },
  { id: "agent-fin-2", name: "Emily", title: "會計", department: "finance", avatar: "📊" },
  
  // IT 部
  { id: "agent-it-1", name: "Max", title: "IT 主管", department: "it", avatar: "💻" },
  { id: "agent-it-2", name: "Tom", title: "系統工程師", department: "it", avatar: "🔧" },
  
  // 營運部
  { id: "agent-ops-1", name: "Lara", title: "營運經理", department: "operations", avatar: "⚙️" },
];

/**
 * 獲取部門的 AI 員工
 */
export function getAgentsByDepartment(departmentId: string) {
  return DEMO_AGENTS.filter(a => a.department === departmentId);
}

/**
 * 獲取部門的例行會議
 */
export function getMeetingsByDepartment(departmentId: string) {
  return DEMO_MEETINGS.filter(m => m.department === departmentId);
}

/**
 * 獲取演示任務
 */
export function getDemoTasks(filter?: "all" | "active" | "completed") {
  if (!filter || filter === "all") return DEMO_TASKS;
  if (filter === "active") return DEMO_TASKS.filter(t => t.status !== "completed");
  return DEMO_TASKS.filter(t => t.status === "completed");
}
