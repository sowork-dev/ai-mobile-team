/**
 * Sprint 3 — Demo 功能展示資料
 * 每家 Demo 公司的 AI 團隊、群組對話、任務、幕僚長歡迎訊息
 */

export interface DemoAgent {
  id: string;
  name: string;
  title: string;
  avatar: string; // emoji
  status: "online" | "executing";
}

export interface DemoBrandGroup {
  id: string;
  brandName: string;
  lastMessage: string;
  lastMessageTime: Date;
  members: { name: string }[];
  unread: number;
}

export interface DemoTask {
  id: string;
  title: string;
  description?: string;
  status: "pending" | "in_progress" | "completed";
  currentStage: number;
  totalStages: number;
  assignedAgents: { id: string; name: string }[];
  createdAt: Date;
}

export interface RecentConversation {
  time: string;
  role: "user" | "assistant";
  message: string;
}

export interface DemoAssistantContext {
  welcomeMessage: string;
  quickActions: { label: string; prompt: string }[];
  completedToday: number;
  timeSavedHours: number;
  recentConversations?: RecentConversation[];
}

export interface DemoData {
  agentTeam: DemoAgent[];
  brandGroups: DemoBrandGroup[];
  tasks: DemoTask[];
  assistantContext: DemoAssistantContext;
  calendarConnected?: boolean;
  calendarProvider?: "google" | "microsoft";
  emailConnected?: boolean;
}

const m = (mins: number) => new Date(Date.now() - mins * 60 * 1000);
const h = (hours: number) => new Date(Date.now() - hours * 60 * 60 * 1000);
const d = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

const DEMO_DATA_MAP: Record<string, DemoData> = {
  "groupm-digital": {
    calendarConnected: true,
    calendarProvider: "google",
    emailConnected: true,
    agentTeam: [
      { id: "alex", name: "Alex", title: "創意總監 AI", avatar: "🎯", status: "online" },
      { id: "maya", name: "Maya", title: "文案撰寫師 AI", avatar: "✍️", status: "executing" },
      { id: "ryan", name: "Ryan", title: "數位廣告專家 AI", avatar: "📊", status: "online" },
      { id: "lena", name: "Lena", title: "品牌策略師 AI", avatar: "💡", status: "executing" },
    ],
    brandGroups: [
      {
        id: "groupm-nike",
        brandName: "Nike APAC",
        lastMessage: "Ryan：W42 競品監測完成，Adidas 本週大幅增加短影音投放，建議調整 Nike 策略",
        lastMessageTime: m(5),
        members: [{ name: "Alex" }, { name: "Ryan" }, { name: "Maya" }],
        unread: 2,
      },
      {
        id: "groupm-unilever",
        brandName: "Unilever 全球提案",
        lastMessage: "Lena：品牌定位分析初稿完成，請 Sarah 審閱後確認策略方向，預計 3 個修改點",
        lastMessageTime: m(23),
        members: [{ name: "Lena" }, { name: "Alex" }],
        unread: 1,
      },
      {
        id: "groupm-pg",
        brandName: "P&G 亞太季度報告",
        lastMessage: "Maya：Q4 廣告文案已完成，共 8 個語言版本，等待 Sarah 最終審批後可交付",
        lastMessageTime: h(2),
        members: [{ name: "Maya" }, { name: "Ryan" }],
        unread: 0,
      },
    ],
    tasks: [
      {
        id: "groupm-t1",
        title: "Nike 品牌 24hr 社群響應策略",
        description: "為 Nike APAC 制定社群即時響應 SOP 與內容範本，覆蓋 8 個亞太市場",
        status: "completed",
        currentStage: 4,
        totalStages: 4,
        assignedAgents: [{ id: "alex", name: "Alex" }, { id: "maya", name: "Maya" }],
        createdAt: d(3),
      },
      {
        id: "groupm-t2",
        title: "Q4 全球品牌活動 Pitch 文件",
        description: "為客戶制作完整的 Q4 活動提案，含策略、創意概念、預算分配",
        status: "in_progress",
        currentStage: 2,
        totalStages: 4,
        assignedAgents: [{ id: "lena", name: "Lena" }, { id: "alex", name: "Alex" }],
        createdAt: d(1),
      },
      {
        id: "groupm-t3",
        title: "競品廣告監測週報 W42",
        description: "監測 Nike、Unilever 主要競品廣告策略變化，生成洞察報告",
        status: "completed",
        currentStage: 3,
        totalStages: 3,
        assignedAgents: [{ id: "ryan", name: "Ryan" }],
        createdAt: d(5),
      },
      {
        id: "groupm-t4",
        title: "亞太區廣告效益年報",
        description: "整合 12 個亞太市場廣告投放數據，生成 ROI 分析年度報告",
        status: "pending",
        currentStage: 0,
        totalStages: 4,
        assignedAgents: [{ id: "ryan", name: "Ryan" }, { id: "maya", name: "Maya" }],
        createdAt: d(0),
      },
    ],
    assistantContext: {
      welcomeMessage:
        "您好，我是 GroupM Digital 的幕僚長。\n\n您的 AI 創意團隊今天持續運作中：\n• Alex 正在主導 Q4 Pitch 的策略框架（進行到第 2 階段）\n• Maya 完成了 P&G 8 個語言廣告文案，等待您審批\n• Ryan 剛完成競品監測，發現 Adidas 大量增加短影音投放\n• Lena 正在趕製 Unilever 全球提案初稿\n\n✅ ClickUp 同步：Nike 品牌 24hr 社群響應策略已完成，Alex 的任務狀態已自動更新為「完成」，並觸發了下一個 Subtask 分配給 Ryan。\n\n📅 Google Calendar 已連接，下週有 3 個會議待確認時間：Nike APAC 週例會（週一 10:00）、Unilever 提案簡報（週二 14:00）、Q4 Pitch 策略會議（週三 9:30）。\n\n📧 郵件彙報：您有 3 封未讀重要郵件，其中 Nike 客戶詢問提案時間需要回覆，我已準備好草稿。\n\n最需要您關注：Q4 Pitch 已到策略方向確認關卡，需要您拍板後才能繼續推進。",
      quickActions: [
        { label: "Q4 Pitch 進度", prompt: "Q4 全球品牌活動 Pitch 目前進度如何？需要我做什麼？" },
        { label: "幫我約 Nike 開會", prompt: "幫我約 Nike 客戶 Annie、James、Leo 本週開線上會議" },
        { label: "下載 Unilever PPT", prompt: "幫我把 Unilever 提案匯出成 PPT 報告" },
        { label: "P&G 文案審批", prompt: "P&G Q4 廣告文案有哪些亮點？我需要注意什麼？" },
      ],
      completedToday: 3,
      timeSavedHours: 18,
      recentConversations: [
        {
          time: "2 分鐘前",
          role: "assistant",
          message: "📧 郵件彙報：您有 3 封未讀重要郵件：\n1. Nike 客戶 Annie 詢問提案時間（需回覆）\n2. 法務部 Unilever 合約需要簽名（本週五前）\n3. P&G 廣告文案反饋（日文版需調整）\n需要我幫您起草回覆嗎？",
        },
        {
          time: "5 分鐘前",
          role: "assistant",
          message: "Nike APAC 競品監測完成：Adidas 本週短影音投放量增加 38%，建議調整 Nike W43 策略，我已標記 2 個需要您確認的決策點。",
        },
        {
          time: "28 分鐘前",
          role: "user",
          message: "幫我約 Nike 客戶 Annie、James、Leo 本週開會",
        },
        {
          time: "29 分鐘前",
          role: "assistant",
          message: "已查詢您的 Google Calendar 空檔。本週共同空檔：週三 14:00-16:00、週四 10:00-12:00。已透過 LINE 傳送給三位，等待回覆。Annie 已確認週四 10:00，Google Meet 連結已建立：meet.google.com/abc-defg-hij",
        },
        {
          time: "1 小時前",
          role: "user",
          message: "P&G Q4 文案審批進度？",
        },
        {
          time: "剛才",
          role: "assistant",
          message: "✅ ClickUp 同步完成：Nike 品牌 24hr 社群響應策略已標記為完成，Alex 在 ClickUp 的任務狀態已自動更新，下一步「競品分析跟進」已指派給 Ryan，截止日期 2026/03/12。您不需要手動更新任務系統。",
        },
      ],
    },
  },

  "loreal-apac": {
    calendarConnected: true,
    calendarProvider: "google",
    emailConnected: true,
    agentTeam: [
      { id: "belle", name: "Belle", title: "美妝行銷顧問 AI", avatar: "💄", status: "online" },
      { id: "zara", name: "Zara", title: "內容在地化專家 AI", avatar: "🌏", status: "executing" },
      { id: "iris", name: "Iris", title: "社群媒體經理 AI", avatar: "📱", status: "executing" },
      { id: "kai", name: "Kai", title: "KOL 合作協調員 AI", avatar: "⭐", status: "online" },
    ],
    brandGroups: [
      {
        id: "loreal-paris-tw",
        brandName: "L'Oréal Paris 台灣",
        lastMessage: "Iris：雙十一 IG 故事排程完成，10/9 至 11/11 共 45 則貼文已就緒",
        lastMessageTime: m(12),
        members: [{ name: "Iris" }, { name: "Belle" }, { name: "Kai" }],
        unread: 3,
      },
      {
        id: "loreal-lancome",
        brandName: "Lancôme APAC",
        lastMessage: "Zara：韓文、泰文在地化完成，日文版本預計今晚完成，共剩 3 個市場",
        lastMessageTime: h(1),
        members: [{ name: "Zara" }, { name: "Belle" }],
        unread: 1,
      },
      {
        id: "loreal-maybelline",
        brandName: "Maybelline 社群策略",
        lastMessage: "Belle：TikTok 新品上市策略報告已產出，附競品 Charlotte Tilbury 分析，待審閱",
        lastMessageTime: h(3),
        members: [{ name: "Belle" }, { name: "Iris" }],
        unread: 0,
      },
    ],
    tasks: [
      {
        id: "loreal-t1",
        title: "台灣雙十一行銷方案",
        description: "L'Oréal Paris 台灣雙十一完整行銷計畫，含社群、KOL、電商",
        status: "completed",
        currentStage: 4,
        totalStages: 4,
        assignedAgents: [{ id: "belle", name: "Belle" }, { id: "iris", name: "Iris" }],
        createdAt: d(4),
      },
      {
        id: "loreal-t2",
        title: "12市場在地化內容包",
        description: "新品訊息在地化成 12 個亞太市場語言版本",
        status: "in_progress",
        currentStage: 1,
        totalStages: 3,
        assignedAgents: [{ id: "zara", name: "Zara" }, { id: "belle", name: "Belle" }],
        createdAt: d(1),
      },
      {
        id: "loreal-t3",
        title: "KOL 合作效益 Q3 分析",
        description: "分析 Q3 所有 KOL 合作 ROI，生成下季合作建議",
        status: "completed",
        currentStage: 3,
        totalStages: 3,
        assignedAgents: [{ id: "kai", name: "Kai" }],
        createdAt: d(6),
      },
      {
        id: "loreal-t4",
        title: "新品上市社群活動企劃",
        description: "為新品系列設計 IG + TikTok 上市活動與 hashtag 策略",
        status: "pending",
        currentStage: 0,
        totalStages: 4,
        assignedAgents: [{ id: "iris", name: "Iris" }, { id: "belle", name: "Belle" }],
        createdAt: d(0),
      },
    ],
    assistantContext: {
      welcomeMessage:
        "您好，我是 L'Oréal Asia Pacific 的幕僚長。\n\n您的 AI 行銷團隊今天相當忙碌：\n• Iris 已完成台灣雙十一 45 則社群排程，橫跨 10/9 至 11/11\n• Zara 正在趕完最後幾個市場的在地化版本\n• Belle 完成了 Maybelline TikTok 新品策略報告\n\n🍽️ 新功能：您說「幫我約品牌長、行銷總監、通路長三人吃飯討論 Q4 計劃」，我已透過 LINE 詢問大家時間，共同空檔為週五 12:30，已幫您訂位信義區的 日式料理（inline.app）。\n\n最需要您關注：12 市場在地化進行中，預計今晚完成。",
      quickActions: [
        { label: "在地化進度", prompt: "12個市場在地化目前完成了幾個？還剩哪些？" },
        { label: "幫我訂餐廳", prompt: "幫我約品牌長和行銷總監週五午餐，找信義區日式餐廳" },
        { label: "下載行銷報告 PDF", prompt: "把 Q3 KOL 效益分析匯出成 PDF 報告格式" },
        { label: "新品上市規劃", prompt: "新品上市社群活動要如何開始啟動？" },
      ],
      completedToday: 3,
      timeSavedHours: 26,
      recentConversations: [
        {
          time: "8 分鐘前",
          role: "assistant",
          message: "📧 郵件彙報：您有 2 封重要未讀郵件：\n1. Lancôme 亞太區總部詢問台灣市場 Q4 計畫進度\n2. KOL 合作代理商提供秋季合作提案\n需要我幫您起草回覆嗎？",
        },
        {
          time: "12 分鐘前",
          role: "assistant",
          message: "台灣雙十一 45 則社群排程已全部完成，涵蓋 10/9 至 11/11，包含 IG Stories 與 Reels，請您確認後即可正式上線。",
        },
        {
          time: "35 分鐘前",
          role: "user",
          message: "幫我約品牌長和行銷總監週五午餐",
        },
        {
          time: "36 分鐘前",
          role: "assistant",
          message: "已查詢您的 Google Calendar 空檔。共同空檔：週五 12:30，已在信義區預訂日式料理餐廳（inline.app）。Google Calendar 邀請已建立，等您確認後送出。",
        },
        {
          time: "2 小時前",
          role: "user",
          message: "Zara 在地化進度更新？",
        },
      ],
    },
  },

  "bcg-taipei": {
    calendarConnected: true,
    calendarProvider: "google",
    emailConnected: true,
    agentTeam: [
      { id: "rex", name: "Rex", title: "研究分析師 AI", avatar: "🔍", status: "executing" },
      { id: "nina", name: "Nina", title: "商業策略顧問 AI", avatar: "♟️", status: "online" },
      { id: "otto", name: "Otto", title: "資料視覺化專家 AI", avatar: "📈", status: "executing" },
      { id: "sara", name: "Sara", title: "提案撰寫師 AI", avatar: "📝", status: "online" },
    ],
    brandGroups: [
      {
        id: "bcg-retail",
        brandName: "零售客戶 Alpha",
        lastMessage: "Sara：30頁競爭力分析 Pitch 第二稿完成，已標記需要 David 確認的 3 個策略方向",
        lastMessageTime: m(8),
        members: [{ name: "Sara" }, { name: "Otto" }, { name: "Nina" }],
        unread: 2,
      },
      {
        id: "bcg-finance",
        brandName: "金融客戶 Beta",
        lastMessage: "Nina：東南亞市場可行性分析完成，建議優先進入泰國、越南、印尼三國",
        lastMessageTime: m(45),
        members: [{ name: "Nina" }, { name: "Rex" }],
        unread: 0,
      },
      {
        id: "bcg-tech",
        brandName: "科技客戶 Gamma",
        lastMessage: "Rex：Benchmarking 資料蒐集完成，正在進行視覺化，預計明早完成",
        lastMessageTime: h(2),
        members: [{ name: "Rex" }, { name: "Otto" }],
        unread: 0,
      },
    ],
    tasks: [
      {
        id: "bcg-t1",
        title: "零售業數位轉型白皮書",
        description: "台灣零售客戶數位轉型現況、趨勢與建議報告",
        status: "completed",
        currentStage: 4,
        totalStages: 4,
        assignedAgents: [{ id: "rex", name: "Rex" }, { id: "nina", name: "Nina" }],
        createdAt: d(5),
      },
      {
        id: "bcg-t2",
        title: "競爭力分析 Pitch（30頁）",
        description: "為新客戶製作行業競爭格局分析與策略建議 PPT",
        status: "in_progress",
        currentStage: 2,
        totalStages: 4,
        assignedAgents: [{ id: "sara", name: "Sara" }, { id: "otto", name: "Otto" }],
        createdAt: d(2),
      },
      {
        id: "bcg-t3",
        title: "市場進入可行性分析",
        description: "評估客戶進入東南亞市場的可行性與風險分析",
        status: "completed",
        currentStage: 3,
        totalStages: 3,
        assignedAgents: [{ id: "nina", name: "Nina" }, { id: "rex", name: "Rex" }],
        createdAt: d(7),
      },
      {
        id: "bcg-t4",
        title: "Benchmarking 分析報告",
        description: "對標國際最佳實務，生成客戶與競品的 KPI benchmarking",
        status: "pending",
        currentStage: 0,
        totalStages: 3,
        assignedAgents: [{ id: "rex", name: "Rex" }, { id: "otto", name: "Otto" }],
        createdAt: d(0),
      },
    ],
    assistantContext: {
      welcomeMessage:
        "您好，我是 BCG Taipei 的幕僚長。\n\n您的 AI 顧問團隊今天的進度：\n• Sara 完成了 30 頁競爭力分析 Pitch 第二稿，標記了 3 個需要您確認的策略方向\n• Nina 完成東南亞市場可行性分析，建議優先進入泰、越、印三國\n• Rex 正在完成 Benchmarking 視覺化，預計明早交付\n\n📊 新功能：東南亞市場分析報告已按您的職位（顧問）自動產出 8 頁 BCG 風格 PPT，可直接下載後交付客戶。\n\n優先事項：零售客戶 Alpha 的 Pitch 需要您審閱並確認策略方向，這是推進到下一階段的關卡。",
      quickActions: [
        { label: "審閱 Pitch 稿", prompt: "零售客戶 Alpha 的 Pitch 第二稿有哪 3 個地方需要我確認？" },
        { label: "下載 8 頁 PPT", prompt: "把東南亞市場分析匯出成 8 頁顧問風格 PPT" },
        { label: "幫我約客戶開會", prompt: "幫我約零售客戶 Alpha 的 CEO 和 CFO 下週做策略回顧會議" },
        { label: "新提案啟動", prompt: "我需要為新客戶啟動一個行業分析提案" },
      ],
      completedToday: 3,
      timeSavedHours: 22,
      recentConversations: [
        {
          time: "5 分鐘前",
          role: "assistant",
          message: "📧 郵件彙報：您有 2 封重要未讀郵件：\n1. 零售客戶 Alpha CFO 詢問下週策略回顧時間\n2. BCG 全球總部傳來新版 Pitch 範本\n需要我幫您起草回覆嗎？",
        },
        {
          time: "8 分鐘前",
          role: "assistant",
          message: "零售客戶 Alpha 的競爭力分析 Pitch 第二稿已完成（30頁），我標記了第 12、18、24 頁需要您確認的 3 個策略方向，請審閱後告知。",
        },
        {
          time: "40 分鐘前",
          role: "user",
          message: "幫我約零售客戶 Alpha CEO 和 CFO 下週做策略回顧",
        },
        {
          time: "41 分鐘前",
          role: "assistant",
          message: "已查詢您的 Google Calendar。本週共同空檔：週三 10:00-12:00、週四 15:00-16:30。已透過 LINE 傳給 CEO 和 CFO，CEO 已確認週三 10:00，Google Meet 連結已建立。",
        },
        {
          time: "3 小時前",
          role: "user",
          message: "東南亞市場分析 PPT 下載",
        },
      ],
    },
  },

  "hillhouse-capital": {
    calendarConnected: true,
    calendarProvider: "microsoft",
    emailConnected: true,
    agentTeam: [
      { id: "morgan", name: "Morgan", title: "市場分析師 AI", avatar: "📉", status: "executing" },
      { id: "tara", name: "Tara", title: "GTM 策略師 AI", avatar: "🚀", status: "online" },
      { id: "felix", name: "Felix", title: "品牌顧問 AI", avatar: "🏷️", status: "online" },
      { id: "vera", name: "Vera", title: "投資人關係 AI", avatar: "🤝", status: "executing" },
    ],
    brandGroups: [
      {
        id: "hillhouse-gtm",
        brandName: "Portfolio GTM 計畫",
        lastMessage: "Tara：B2B SaaS A公司 6個月 GTM 計畫第一稿完成，含渠道策略與月度里程碑",
        lastMessageTime: m(15),
        members: [{ name: "Tara" }, { name: "Morgan" }],
        unread: 2,
      },
      {
        id: "hillhouse-lp",
        brandName: "LP 季度報告",
        lastMessage: "Vera：Q3 LP 報告完成，共 28 頁，請 Kevin 確認後即可發送給所有 LP",
        lastMessageTime: h(2),
        members: [{ name: "Vera" }],
        unread: 1,
      },
      {
        id: "hillhouse-brand",
        brandName: "品牌健診專案",
        lastMessage: "Felix：5家 Portfolio 品牌健診報告完成，C公司品牌辨識度最弱，建議優先處理",
        lastMessageTime: d(1),
        members: [{ name: "Felix" }, { name: "Tara" }],
        unread: 0,
      },
    ],
    tasks: [
      {
        id: "hillhouse-t1",
        title: "Portfolio 公司品牌健診",
        description: "針對 5 個 Portfolio 公司進行品牌評估，提供改善優先序建議",
        status: "completed",
        currentStage: 3,
        totalStages: 3,
        assignedAgents: [{ id: "felix", name: "Felix" }, { id: "tara", name: "Tara" }],
        createdAt: d(6),
      },
      {
        id: "hillhouse-t2",
        title: "新投資標 GTM 加速計畫",
        description: "為新投資的 B2B SaaS 設計 6 個月 GTM 執行計畫",
        status: "in_progress",
        currentStage: 1,
        totalStages: 4,
        assignedAgents: [{ id: "tara", name: "Tara" }, { id: "morgan", name: "Morgan" }],
        createdAt: d(2),
      },
      {
        id: "hillhouse-t3",
        title: "LP 基金季報 + IRR 分析模型",
        description: "整合 Q4 Portfolio 財務數據，生成 PE 級 Excel（IRR/TVPI/DPI/MOIC），按 vintage year 分頁，供 LP 參閱",
        status: "completed",
        currentStage: 4,
        totalStages: 4,
        assignedAgents: [{ id: "vera", name: "Vera" }],
        createdAt: d(4),
      },
      {
        id: "hillhouse-t4",
        title: "行業趨勢 Due Diligence",
        description: "針對擬投資標的行業，生成深度趨勢分析 DD 報告",
        status: "pending",
        currentStage: 0,
        totalStages: 4,
        assignedAgents: [{ id: "morgan", name: "Morgan" }, { id: "felix", name: "Felix" }],
        createdAt: d(0),
      },
    ],
    assistantContext: {
      welcomeMessage:
        "您好，我是 Hillhouse Capital 的幕僚長。\n\nPlatform Team 的 AI 今天成效：\n• Vera 完成了 Q4 LP 季報 + IRR 分析模型，Excel 已更新 IRR/TVPI/DPI/MOIC，按 vintage year 分頁（2018–2024）\n• Felix 完成 5 家 Portfolio 品牌健診，C公司需要優先處理品牌問題\n• Tara 正在趕製 B2B SaaS 投資標的 GTM 計畫\n\n📊 PE 級財務 Excel 已就緒：Portfolio Summary / Vintage Year Analysis / Cash Flow Waterfall 三張分頁，含 Benchmark 對比（Preqin Top Quartile），可直接下載發送給 LP。\n\n需要您決策：Q4 LP 報告已就緒，您確認後可立即發送給所有 LP，請優先審閱。",
      quickActions: [
        { label: "LP 報告審閱", prompt: "Q3 LP 報告有哪些重點需要我特別注意？" },
        { label: "下載財務 Excel", prompt: "把 Q3 Portfolio 財務數據匯出成 Excel 報表" },
        { label: "幫我約 LP 溝通", prompt: "幫我約三個主要 LP 下週做 Q3 電話溝通" },
        { label: "新 DD 分析", prompt: "開始一個新投資標的的 Due Diligence 分析" },
      ],
      completedToday: 3,
      timeSavedHours: 34,
      recentConversations: [
        {
          time: "10 分鐘前",
          role: "assistant",
          message: "📧 Outlook 郵件彙報：您有 3 封重要未讀郵件：\n1. LP-A 詢問 Q3 Portfolio 某公司的退出時間表\n2. B2B SaaS 投資標的 CEO 提供最新財務數據\n3. 法律顧問傳來新投資標的盡調文件\n需要我幫您起草回覆嗎？",
        },
        {
          time: "15 分鐘前",
          role: "assistant",
          message: "Q3 LP 投資報告（28頁）已就緒，財務數據 Excel 也已按 LP 格式匯出，包含 Portfolio 各公司 P&L 摘要，請確認後可立即發送給 12 位 LP。",
        },
        {
          time: "45 分鐘前",
          role: "user",
          message: "幫我約主要 LP 下週做 Q3 電話溝通",
        },
        {
          time: "46 分鐘前",
          role: "assistant",
          message: "已查詢您的 Outlook Calendar 空檔。與三位 LP 共同空檔：週一 09:00（LP-A 已確認）。Teams 會議連結已建立，等 LP-B 和 LP-C 回覆後立即發送邀請。",
        },
        {
          time: "2 小時前",
          role: "user",
          message: "C 公司品牌問題怎麼處理比較好？",
        },
      ],
    },
  },

  "microsoft-taiwan": {
    calendarConnected: true,
    calendarProvider: "microsoft",
    emailConnected: true,
    agentTeam: [
      { id: "evan", name: "Evan", title: "產品行銷經理 AI", avatar: "🎯", status: "executing" },
      { id: "chloe", name: "Chloe", title: "內容策略師 AI", avatar: "📝", status: "online" },
      { id: "tyler", name: "Tyler", title: "銷售賦能專家 AI", avatar: "💼", status: "online" },
      { id: "amy", name: "Amy", title: "數位行銷分析師 AI", avatar: "📊", status: "executing" },
      { id: "max", name: "Max", title: "活動企劃師 AI", avatar: "🎪", status: "online" },
    ],
    brandGroups: [
      {
        id: "msft-azure",
        brandName: "Azure 產品線",
        lastMessage: "Evan：10月行銷內容包完成，含 5 個客戶案例、3 個產品功能介紹、2 個促銷訊息",
        lastMessageTime: m(3),
        members: [{ name: "Evan" }, { name: "Chloe" }, { name: "Amy" }],
        unread: 3,
      },
      {
        id: "msft-sales",
        brandName: "銷售賦能計畫",
        lastMessage: "Tyler：vs AWS 競品比較 Playbook 已更新，新增 Copilot vs ChatGPT Enterprise 比較頁",
        lastMessageTime: m(30),
        members: [{ name: "Tyler" }, { name: "Evan" }],
        unread: 1,
      },
      {
        id: "msft-ignite",
        brandName: "Ignite 台灣場",
        lastMessage: "Max：場地確認大直威斯汀 11/19，預計 500 人，開始設計邀請材料與議程",
        lastMessageTime: h(4),
        members: [{ name: "Max" }, { name: "Chloe" }],
        unread: 0,
      },
    ],
    tasks: [
      {
        id: "msft-t1",
        title: "Azure 月度行銷內容包",
        description: "Azure 本月重點功能介紹、客戶案例與促銷訊息內容包",
        status: "completed",
        currentStage: 3,
        totalStages: 3,
        assignedAgents: [{ id: "evan", name: "Evan" }, { id: "chloe", name: "Chloe" }],
        createdAt: d(2),
      },
      {
        id: "msft-t2",
        title: "銷售賦能教材（競品比較）",
        description: "製作對抗 AWS、Google Cloud 的競品比較材料與 Playbook",
        status: "in_progress",
        currentStage: 2,
        totalStages: 3,
        assignedAgents: [{ id: "tyler", name: "Tyler" }, { id: "evan", name: "Evan" }],
        createdAt: d(1),
      },
      {
        id: "msft-t3",
        title: "年度行銷績效分析報告",
        description: "整合全年各產品線行銷數據，生成績效分析與明年預算建議",
        status: "completed",
        currentStage: 4,
        totalStages: 4,
        assignedAgents: [{ id: "amy", name: "Amy" }],
        createdAt: d(5),
      },
      {
        id: "msft-t4",
        title: "Ignite 大會台灣場活動企劃",
        description: "Microsoft Ignite 台灣分場活動完整企劃，含議程、邀請、現場體驗",
        status: "pending",
        currentStage: 0,
        totalStages: 4,
        assignedAgents: [{ id: "max", name: "Max" }, { id: "chloe", name: "Chloe" }],
        createdAt: d(0),
      },
    ],
    assistantContext: {
      welcomeMessage:
        "您好，我是 Microsoft Taiwan 的幕僚長。\n\n您的 AI 行銷團隊今天動態：\n• Evan 完成了 Azure 10月行銷內容包（5客戶案例 + 3功能介紹）\n• Tyler 更新了競品比較 Playbook，加入最新 AI 產品對比分析\n• Max 確認了 Ignite 台灣場場地，11/19 大直威斯汀 500 人規模\n\n📞 新功能：您與 AWS 客戶的電話通話已自動整理成摘要——提取出 3 個待辦事項，已建立對應任務並分配給 Tyler 跟進。\n\n待處理：銷售賦能教材進行到第 2 階段，需要您確認競品定位策略。",
      quickActions: [
        { label: "競品策略確認", prompt: "Azure 對抗 AWS 和 Google Cloud 的主要差異化策略是什麼？" },
        { label: "整理剛剛的通話", prompt: "我剛剛跟客戶通話完畢，幫我整理摘要並建立後續任務" },
        { label: "幫我約 Ignite 媒體", prompt: "幫我約科技媒體 iThome、TechNews 三個記者下週做 Ignite 媒體說明" },
        { label: "下載競品 PDF 報告", prompt: "把 Azure vs AWS vs Google Cloud 競品分析匯出成 PDF 報告" },
      ],
      completedToday: 4,
      timeSavedHours: 30,
      recentConversations: [
        {
          time: "3 分鐘前",
          role: "assistant",
          message: "📧 Outlook 郵件彙報：您有 2 封重要未讀郵件：\n1. iThome 記者確認 Ignite 媒體說明時間（需回覆）\n2. AWS 客戶傳來競品比較問題清單（Tyler 已收到副本）\n需要我幫您起草回覆嗎？",
        },
        {
          time: "8 分鐘前",
          role: "assistant",
          message: "Azure 10月行銷內容包已完成：5個客戶案例、3個功能介紹、2個促銷訊息，已按格式整理好，可直接交給各渠道使用。",
        },
        {
          time: "25 分鐘前",
          role: "user",
          message: "幫我約科技媒體記者下週媒體說明",
        },
        {
          time: "26 分鐘前",
          role: "assistant",
          message: "已查詢您的 Outlook Calendar。共同空檔：週二 14:00-16:00。Teams 會議連結已建立。iThome 和 TechNews 記者已收到邀請，等待確認。",
        },
        {
          time: "1 小時前",
          role: "user",
          message: "Ignite 台灣場邀請媒體進度？",
        },
      ],
    },
  },

  "huawei-global-ops": {
    agentTeam: [
      { id: "felix", name: "Felix", title: "全球營運協調 AI", avatar: "🌐", status: "online" },
      { id: "nora", name: "Nora", title: "政策合規分析師 AI", avatar: "⚖️", status: "executing" },
      { id: "leo", name: "Leo", title: "多市場數據分析 AI", avatar: "📊", status: "online" },
      { id: "diana", name: "Diana", title: "跨部門溝通協調 AI", avatar: "🤝", status: "executing" },
    ],
    brandGroups: [
      {
        id: "huawei-apac",
        title: "APAC 區域協調群",
        members: [{ name: "Felix" }, { name: "Leo" }],
      },
      {
        id: "huawei-compliance",
        title: "合規審批流程群",
        members: [{ name: "Nora" }, { name: "Felix" }],
      },
      {
        id: "huawei-product",
        title: "新品上市跨市場協調",
        members: [{ name: "Leo" }, { name: "Diana" }],
      },
    ],
    tasks: [
      {
        id: "huawei-t1",
        title: "APAC 12國季度同步報告",
        status: "executing" as const,
        assignedAgents: [{ id: "felix", name: "Felix" }, { id: "leo", name: "Leo" }],
      },
      {
        id: "huawei-t2",
        title: "德國 / 法國市場合規文件更新",
        status: "waiting_approval" as const,
        assignedAgents: [{ id: "nora", name: "Nora" }],
      },
      {
        id: "huawei-t3",
        title: "Mate 60 亞太行銷素材統一包",
        status: "completed" as const,
        assignedAgents: [{ id: "diana", name: "Diana" }, { id: "leo", name: "Leo" }],
      },
      {
        id: "huawei-t4",
        title: "台灣市場競品監測週報",
        status: "executing" as const,
        assignedAgents: [{ id: "leo", name: "Leo" }],
      },
    ],
    assistantContext: {
      userName: "David Zhang",
      companyName: "Huawei Global Ops",
      welcomeMessage: "David，早安。今天有 3 件跨市場事項需要確認：\n\n1. 德國合規文件 Nora 已完成初審，等待您批准\n2. APAC 同步報告涵蓋 12 國，Felix 正在整合\n3. 台灣媒體有詢問 Mate 60 上市行程，需要您確認回應口徑",
      recentActivity: "APAC 報告整合中",
    },
    recentConversations: [
      {
        time: "剛才",
        role: "assistant",
        message: "Felix 已彙整 APAC 12 國本季 KPI：整體達成率 87%，其中台灣 92%、日本 85%、東南亞 78%。東南亞需要重點關注，我已標記三個市場的落後原因供您審閱。",
      },
      {
        time: "32 分鐘前",
        role: "user",
        message: "德國合規問題進度？",
      },
      {
        time: "32 分鐘前",
        role: "assistant",
        message: "Nora 完成 GDPR 合規更新：共 4 份文件，主要修改隱私條款第 3.2 和 5.1 條。法務已初簽，等待 Global Head 最終批准。預計 3 月 15 日前完成，不影響產品上市時程。",
      },
      {
        time: "1 小時前",
        role: "user",
        message: "台灣媒體詢問如何回應",
      },
      {
        time: "1 小時前",
        role: "assistant",
        message: "已準備 3 個版本的媒體回應口徑：(1) 官方聲明版、(2) 技術亮點版、(3) 市場策略版。建議選用技術亮點版，強調 5.5G 創新，迴避政策敏感話題。是否需要翻譯成日文和韓文版本？",
      },
    ],
  },

  "single-market-agency": {
    agentTeam: [
      { id: "emma", name: "Emma", title: "客戶服務協調 AI", avatar: "💼", status: "online" },
      { id: "jack", name: "Jack", title: "創意內容製作 AI", avatar: "🎨", status: "executing" },
      { id: "sophie", name: "Sophie", title: "數位廣告投放 AI", avatar: "📱", status: "online" },
      { id: "tom", name: "Tom", title: "數據分析報告 AI", avatar: "📈", status: "online" },
    ],
    brandGroups: [
      {
        id: "agency-brand-a",
        brandName: "品牌 A — 台灣飲料",
        lastMessage: "Jack：雙十一 KV 3 個草稿完成，建議選(2)年輕活力風，META 廣告圖 1200×628 / 1080×1080 均備妥",
        lastMessageTime: m(15),
        members: [{ name: "Emma" }, { name: "Jack" }],
        unread: 2,
      },
      {
        id: "agency-brand-b",
        brandName: "品牌 B — 美妝保養",
        lastMessage: "Tom：10月廣告月報完成 — META ROAS 2.8x / TikTok 4.1x（+28%），已生成客戶版報告",
        lastMessageTime: m(3),
        members: [{ name: "Sophie" }, { name: "Tom" }],
        unread: 1,
      },
      {
        id: "agency-brand-c",
        brandName: "品牌 C — 電商促銷",
        lastMessage: "Tom：電商優化報告完成，結帳棄單率 67%，建議 3 項改善方案",
        lastMessageTime: h(2),
        members: [{ name: "Jack" }, { name: "Sophie" }],
        unread: 0,
      },
    ],
    tasks: [
      {
        id: "agency-t1",
        title: "品牌 A 雙十一 KV 創意提案",
        description: "為品牌 A 台灣飲料製作雙十一主視覺 KV 提案，含 META 廣告圖規格：1200×628（橫幅）、1080×1080（方形）、1080×1920（限時動態）。3 個創意方向草稿，供客戶選擇。",
        status: "in_progress" as const,
        currentStage: 2,
        totalStages: 3,
        assignedAgents: [{ id: "jack", name: "Jack" }, { id: "emma", name: "Emma" }],
        createdAt: d(2),
      },
      {
        id: "agency-t2",
        title: "品牌 B META + TikTok 廣告月報",
        description: "品牌 B 美妝保養 10 月廣告成效月報：META ROAS 2.8x（預算 NT$42,000）、TikTok ROAS 4.1x（+28%，預算 NT$28,000）、Google ROAS 3.4x（預算 NT$35,000）。建議下月將 NT$10,000 從 META 轉移至 TikTok，預估整體 ROAS 可提升至 3.8x。",
        status: "completed" as const,
        currentStage: 3,
        totalStages: 3,
        assignedAgents: [{ id: "tom", name: "Tom" }, { id: "sophie", name: "Sophie" }],
        createdAt: d(1),
      },
      {
        id: "agency-t3",
        title: "品牌 C 電商優化建議報告",
        description: "品牌 C 電商結帳流程分析：第 3 步棄單率 67%，建議加入進度條、減少必填欄位、加入信任徽章。預估改善後轉換率可提升 15-25%。",
        status: "completed" as const,
        currentStage: 3,
        totalStages: 3,
        assignedAgents: [{ id: "tom", name: "Tom" }],
        createdAt: d(5),
      },
      {
        id: "agency-t4",
        title: "3 家品牌 Q4 提案簡報",
        description: "整合品牌 A、B、C 的 Q4 行銷策略，製作完整提案簡報。包含各品牌廣告預算分配、KPI 目標設定、創意方向建議。",
        status: "pending" as const,
        currentStage: 0,
        totalStages: 4,
        assignedAgents: [{ id: "emma", name: "Emma" }, { id: "jack", name: "Jack" }],
        createdAt: d(0),
      },
    ],
    assistantContext: {
      welcomeMessage: "Vivian，今天有 2 件客戶等待回覆：\n• 品牌 B 詢問本月廣告成效報告進度（Tom 已完成，META ROAS 2.8x / TikTok 4.1x）\n• 品牌 A 需要雙十一 KV 初稿確認\n\n本月三品牌廣告總預算 NT$105,000，整體 ROAS 3.4x。TikTok 表現最強（+28%），建議下月增加預算。\n\n需要我幫您生成品牌 B 的客戶分享連結嗎？",
      quickActions: [
        { label: "品牌 B 報告", prompt: "品牌 B 廣告月報重點是什麼？建議如何跟客戶說明？" },
        { label: "生成分享連結", prompt: "幫我生成品牌 B 報告的客戶分享連結" },
        { label: "品牌 A KV 進度", prompt: "品牌 A 雙十一 KV 目前進度如何？" },
        { label: "下載廣告月報", prompt: "幫我把品牌 B 廣告月報匯出成 PDF" },
      ],
      completedToday: 2,
      timeSavedHours: 8,
      recentConversations: [
        {
          time: "剛才",
          role: "assistant",
          message: "Tom 完成品牌 B 10月廣告報告：META ROAS 2.8x / TikTok 4.1x（+28%），建議下月將預算從 META 轉移 NT$10,000 到 TikTok。報告已生成，是否分享給品牌 B？",
        },
        {
          time: "5 分鐘前",
          role: "user",
          message: "幫我生成品牌 B 報告的客戶分享連結",
        },
        {
          time: "5 分鐘前",
          role: "assistant",
          message: "✅ 已分享給客戶！\n\n分享連結：https://dev-mobileteam.sowork.ai/share/ABC123\n\n品牌 B 客戶無需登入，點擊連結可直接查看完整廣告月報。連結有效期 7 天。",
        },
        {
          time: "45 分鐘前",
          role: "user",
          message: "品牌 A KV 進度？",
        },
        {
          time: "45 分鐘前",
          role: "assistant",
          message: "Jack 已完成 3 個 KV 方向草稿：(1) 溫暖家庭風、(2) 年輕活力風、(3) 節慶限定風。建議選(2)，最符合品牌 A 今年的年輕化策略。META 廣告圖尺規（1200×628 橫幅、1080×1080 方形）均已備妥。",
        },
      ],
    },
  },
};

export function getDemoData(personaId: string): DemoData | null {
  return DEMO_DATA_MAP[personaId] ?? null;
}
