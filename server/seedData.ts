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

// ============ 5大目標客戶 Persona ============

export interface DemoPersona {
  id: string;
  company: string;
  industry: string;
  teamSize: number;
  challenge: string;
  budget: string;
  decisionMaker: {
    name: string;
    role: string;
    email: string;
  };
  expectedBenefit: string;
  icon: string;
  colorFrom: string;
  colorTo: string;
  recommendedAgents: {
    name: string;
    title: string;
    avatar: string;
    reason: string;
  }[];
  sampleTasks: {
    id: string;
    title: string;
    description: string;
    assignedAgents: string[];
    status: "pending" | "in_progress" | "completed";
    outputs?: { type: string; name: string; size: string }[];
  }[];
}

export const DEMO_PERSONAS: DemoPersona[] = [
  {
    id: "groupm-digital",
    company: "GroupM Digital",
    industry: "廣告集團",
    teamSize: 2500,
    challenge: "全球品牌客戶要求 24hr 即時響應，但創意人員分布不均",
    budget: "$2M/年數位轉型",
    decisionMaker: {
      name: "Sarah Chen",
      role: "Global CDO",
      email: "sarah.chen@groupm-demo.com",
    },
    expectedBenefit: "每個 AI Agent 省一個資深創意總監，響應時間縮短 80%",
    icon: "🏢",
    colorFrom: "from-blue-600",
    colorTo: "to-indigo-700",
    recommendedAgents: [
      { name: "Alex", title: "創意總監 AI", avatar: "🎯", reason: "品牌策略與創意方向制定" },
      { name: "Maya", title: "文案撰寫師 AI", avatar: "✍️", reason: "多語言廣告文案創作" },
      { name: "Ryan", title: "數位廣告專家 AI", avatar: "📊", reason: "媒體投放分析與優化" },
      { name: "Lena", title: "品牌策略師 AI", avatar: "💡", reason: "品牌定位與競品研究" },
    ],
    sampleTasks: [
      {
        id: "groupm-task-1",
        title: "Nike 品牌 24hr 社群響應策略",
        description: "為 Nike APAC 制定社群即時響應 SOP 與內容範本",
        assignedAgents: ["Alex 創意總監 AI", "Maya 文案撰寫師 AI"],
        status: "completed",
        outputs: [
          { type: "pdf", name: "響應策略SOP.pdf", size: "1.2MB" },
          { type: "doc", name: "內容範本庫.docx", size: "856KB" },
        ],
      },
      {
        id: "groupm-task-2",
        title: "Q4 全球品牌活動 Pitch 文件",
        description: "為客戶制作完整的 Q4 活動提案，含策略、創意概念、預算",
        assignedAgents: ["Lena 品牌策略師 AI", "Alex 創意總監 AI"],
        status: "in_progress",
      },
      {
        id: "groupm-task-3",
        title: "競品廣告監測週報",
        description: "監測主要競品廣告策略變化，自動生成洞察報告",
        assignedAgents: ["Ryan 數位廣告專家 AI"],
        status: "completed",
        outputs: [
          { type: "pdf", name: "競品監測週報_W42.pdf", size: "2.1MB" },
        ],
      },
      {
        id: "groupm-task-4",
        title: "亞太區廣告效益年報",
        description: "整合 12 個亞太市場廣告投放數據，生成 ROI 分析報告",
        assignedAgents: ["Ryan 數位廣告專家 AI", "Maya 文案撰寫師 AI"],
        status: "pending",
      },
    ],
  },
  {
    id: "loreal-apac",
    company: "L'Oréal Asia Pacific",
    industry: "美妝集團",
    teamSize: 800,
    challenge: "12個亞太市場，每個需要在地化內容，速度趕不上社群節奏",
    budget: "$800K/年 MarTech",
    decisionMaker: {
      name: "Michelle Liu",
      role: "VP Digital Marketing APAC",
      email: "michelle.liu@loreal-demo.com",
    },
    expectedBenefit: "AI 團隊同時處理 50+ 市場在地化內容，速度提升 10x",
    icon: "💄",
    colorFrom: "from-pink-500",
    colorTo: "to-rose-600",
    recommendedAgents: [
      { name: "Belle", title: "美妝行銷顧問 AI", avatar: "💄", reason: "美妝趨勢與消費者洞察" },
      { name: "Zara", title: "內容在地化專家 AI", avatar: "🌏", reason: "多市場語言與文化在地化" },
      { name: "Iris", title: "社群媒體經理 AI", avatar: "📱", reason: "IG/TikTok/小紅書內容策略" },
      { name: "Kai", title: "KOL 合作協調員 AI", avatar: "⭐", reason: "KOL 篩選、提案與效益追蹤" },
    ],
    sampleTasks: [
      {
        id: "loreal-task-1",
        title: "台灣雙十一行銷方案",
        description: "L'Oréal Paris 台灣雙十一完整行銷計畫，含社群、KOL、電商",
        assignedAgents: ["Belle 美妝行銷顧問 AI", "Iris 社群媒體經理 AI"],
        status: "completed",
        outputs: [
          { type: "ppt", name: "雙十一行銷提案.pptx", size: "5.3MB" },
          { type: "xls", name: "KOL清單&預算.xlsx", size: "234KB" },
        ],
      },
      {
        id: "loreal-task-2",
        title: "12市場在地化內容包",
        description: "新品訊息在地化成 12 個亞太市場語言版本",
        assignedAgents: ["Zara 內容在地化專家 AI", "Belle 美妝行銷顧問 AI"],
        status: "in_progress",
      },
      {
        id: "loreal-task-3",
        title: "KOL 合作效益 Q3 分析",
        description: "分析 Q3 所有 KOL 合作 ROI，生成下季合作建議",
        assignedAgents: ["Kai KOL 合作協調員 AI"],
        status: "completed",
        outputs: [
          { type: "pdf", name: "KOL_ROI分析_Q3.pdf", size: "1.8MB" },
        ],
      },
      {
        id: "loreal-task-4",
        title: "新品上市社群活動企劃",
        description: "為新品系列設計 IG + TikTok 上市活動與 hashtag 策略",
        assignedAgents: ["Iris 社群媒體經理 AI", "Belle 美妝行銷顧問 AI"],
        status: "pending",
      },
    ],
  },
  {
    id: "bcg-taipei",
    company: "Boston Consulting Group Taipei",
    industry: "管理顧問",
    teamSize: 150,
    challenge: "提案品質要求高但時間壓力大，初級顧問產出不穩定",
    budget: "$300K/年 AI Tools",
    decisionMaker: {
      name: "David Wang",
      role: "Managing Partner",
      email: "david.wang@bcg-demo.com",
    },
    expectedBenefit: "資深顧問專注高價值策略，AI 處理執行層，非核心時間節省 60%",
    icon: "📊",
    colorFrom: "from-green-600",
    colorTo: "to-emerald-700",
    recommendedAgents: [
      { name: "Rex", title: "研究分析師 AI", avatar: "🔍", reason: "二手研究與競品分析整理" },
      { name: "Nina", title: "商業策略顧問 AI", avatar: "♟️", reason: "策略框架應用與洞察生成" },
      { name: "Otto", title: "資料視覺化專家 AI", avatar: "📈", reason: "圖表設計與數據故事化" },
      { name: "Sara", title: "提案撰寫師 AI", avatar: "📝", reason: "顧問報告與 PPT 撰寫" },
    ],
    sampleTasks: [
      {
        id: "bcg-task-1",
        title: "零售業數位轉型白皮書",
        description: "台灣零售客戶數位轉型現況、趨勢與建議報告",
        assignedAgents: ["Rex 研究分析師 AI", "Nina 商業策略顧問 AI"],
        status: "completed",
        outputs: [
          { type: "pdf", name: "台灣零售數位轉型白皮書.pdf", size: "3.2MB" },
          { type: "ppt", name: "客戶簡報版.pptx", size: "4.7MB" },
        ],
      },
      {
        id: "bcg-task-2",
        title: "競爭力分析 Pitch（30頁）",
        description: "為新客戶製作行業競爭格局分析與策略建議 PPT",
        assignedAgents: ["Sara 提案撰寫師 AI", "Otto 資料視覺化專家 AI"],
        status: "in_progress",
      },
      {
        id: "bcg-task-3",
        title: "市場進入可行性分析",
        description: "評估客戶進入東南亞市場的可行性與風險分析",
        assignedAgents: ["Nina 商業策略顧問 AI", "Rex 研究分析師 AI"],
        status: "completed",
        outputs: [
          { type: "pdf", name: "東南亞市場可行性分析.pdf", size: "2.9MB" },
        ],
      },
      {
        id: "bcg-task-4",
        title: "Benchmarking 分析報告",
        description: "對標國際最佳實務，生成客戶與競品的 KPI benchmarking",
        assignedAgents: ["Rex 研究分析師 AI", "Otto 資料視覺化專家 AI"],
        status: "pending",
      },
    ],
  },
  {
    id: "hillhouse-capital",
    company: "Hillhouse Capital",
    industry: "私募基金",
    teamSize: 200,
    challenge: "50+投資組合公司都需要品牌行銷支援，Platform Team只有10人",
    budget: "$500K/年 Portfolio Services",
    decisionMaker: {
      name: "Kevin Lin",
      role: "Operating Partner",
      email: "kevin.lin@hillhouse-demo.com",
    },
    expectedBenefit: "Portfolio 公司 GTM 加速，平均上市縮短 40%，投資報酬率提升",
    icon: "💰",
    colorFrom: "from-amber-500",
    colorTo: "to-orange-600",
    recommendedAgents: [
      { name: "Morgan", title: "市場分析師 AI", avatar: "📉", reason: "市場趨勢與投資標的研究" },
      { name: "Tara", title: "GTM 策略師 AI", avatar: "🚀", reason: "產品上市策略與渠道規劃" },
      { name: "Felix", title: "品牌顧問 AI", avatar: "🏷️", reason: "投資組合公司品牌建立" },
      { name: "Vera", title: "投資人關係 AI", avatar: "🤝", reason: "LP 報告與溝通材料製作" },
    ],
    sampleTasks: [
      {
        id: "hillhouse-task-1",
        title: "Portfolio 公司品牌健診",
        description: "針對 5 個 Portfolio 公司進行品牌評估，提供改善優先序建議",
        assignedAgents: ["Felix 品牌顧問 AI", "Tara GTM 策略師 AI"],
        status: "completed",
        outputs: [
          { type: "pdf", name: "品牌健診報告_Portfolio5家.pdf", size: "4.1MB" },
        ],
      },
      {
        id: "hillhouse-task-2",
        title: "新投資標 GTM 加速計畫",
        description: "為新投資的 B2B SaaS 設計 6 個月 GTM 執行計畫",
        assignedAgents: ["Tara GTM 策略師 AI", "Morgan 市場分析師 AI"],
        status: "in_progress",
      },
      {
        id: "hillhouse-task-3",
        title: "LP 季度投資報告 Q3",
        description: "整理 Q3 Portfolio 公司進展，撰寫 LP 報告",
        assignedAgents: ["Vera 投資人關係 AI"],
        status: "completed",
        outputs: [
          { type: "pdf", name: "LP_Q3投資報告.pdf", size: "2.5MB" },
          { type: "ppt", name: "LP_Q3簡報.pptx", size: "3.8MB" },
        ],
      },
      {
        id: "hillhouse-task-4",
        title: "行業趨勢 Due Diligence",
        description: "針對擬投資標的行業，生成深度趨勢分析 DD 報告",
        assignedAgents: ["Morgan 市場分析師 AI", "Felix 品牌顧問 AI"],
        status: "pending",
      },
    ],
  },
  {
    id: "microsoft-taiwan",
    company: "Microsoft Taiwan",
    industry: "科技",
    teamSize: 500,
    challenge: "Azure, M365, Dynamics, Power Platform... 每條產品線都需要行銷內容",
    budget: "$600K/年 Regional Marketing",
    decisionMaker: {
      name: "Jennifer Wu",
      role: "Marketing Director Taiwan",
      email: "jennifer.wu@microsoft-demo.com",
    },
    expectedBenefit: "AI 團隊覆蓋所有產品線內容產出，行銷效率提升 3x",
    icon: "🚀",
    colorFrom: "from-sky-500",
    colorTo: "to-cyan-600",
    recommendedAgents: [
      { name: "Evan", title: "產品行銷經理 AI", avatar: "🎯", reason: "科技產品定位與差異化策略" },
      { name: "Chloe", title: "內容策略師 AI", avatar: "📝", reason: "技術內容簡化與行銷化" },
      { name: "Tyler", title: "銷售賦能專家 AI", avatar: "💼", reason: "銷售材料與競品比較製作" },
      { name: "Amy", title: "數位行銷分析師 AI", avatar: "📊", reason: "行銷數據追蹤與 ROI 優化" },
      { name: "Max", title: "活動企劃師 AI", avatar: "🎪", reason: "企業活動與 Webinar 策劃" },
    ],
    sampleTasks: [
      {
        id: "msft-task-1",
        title: "Azure 月度行銷內容包",
        description: "Azure 本月重點功能介紹、客戶案例與促銷訊息內容包",
        assignedAgents: ["Evan 產品行銷經理 AI", "Chloe 內容策略師 AI"],
        status: "completed",
        outputs: [
          { type: "doc", name: "Azure行銷內容包_Oct.docx", size: "1.5MB" },
          { type: "ppt", name: "客戶簡報版.pptx", size: "3.2MB" },
        ],
      },
      {
        id: "msft-task-2",
        title: "銷售賦能教材（競品比較）",
        description: "製作對抗 AWS、Google Cloud 的競品比較材料與 Playbook",
        assignedAgents: ["Tyler 銷售賦能專家 AI", "Evan 產品行銷經理 AI"],
        status: "in_progress",
      },
      {
        id: "msft-task-3",
        title: "年度行銷績效分析報告",
        description: "整合全年各產品線行銷數據，生成績效分析與明年預算建議",
        assignedAgents: ["Amy 數位行銷分析師 AI"],
        status: "completed",
        outputs: [
          { type: "pdf", name: "2024年度行銷績效報告.pdf", size: "3.7MB" },
          { type: "xls", name: "行銷數據明細.xlsx", size: "892KB" },
        ],
      },
      {
        id: "msft-task-4",
        title: "Ignite 大會台灣場活動企劃",
        description: "Microsoft Ignite 台灣分場活動完整企劃，含議程、邀請、現場體驗",
        assignedAgents: ["Max 活動企劃師 AI", "Chloe 內容策略師 AI"],
        status: "pending",
      },
    ],
  },
];

export function getDemoPersona(personaId: string): DemoPersona | undefined {
  return DEMO_PERSONAS.find(p => p.id === personaId);
}

export function getAllPersonas(): DemoPersona[] {
  return DEMO_PERSONAS;
}
