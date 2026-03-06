/**
 * AI Mobile Team - i18n Locales
 * 中英文翻譯檔案
 */

export const locales = {
  zh: {
    // Tab Bar
    tabs: {
      contacts: "聯絡人",
      chat: "聊天",
      assistant: "特助",
      tasks: "任務",
      profile: "我的",
    },
    
    // Contacts Page
    contacts: {
      title: "聯絡人",
      explore: "探索",
      myTeam: "我的團隊",
      invite: "邀請同事",
      search: "搜尋 AI 員工...",
      all: "全部",
      strategy: "策略",
      execution: "執行",
      training: "培訓",
      startChat: "開始對話",
      addToTeam: "加入團隊",
      noResults: "找不到符合條件的 AI 員工",
      createGroup: "建立工作群組",
      createGroupDesc: "將 AI 員工組成專屬團隊",
      inviteTitle: "邀請真實同事",
      inviteDesc: "邀請您的同事加入 SoWork AI Team，一起協作",
      emailPlaceholder: "輸入同事的電子郵件",
      inviteBtn: "邀請",
      shareLink: "或分享邀請連結",
      copy: "複製",
    },
    
    // Chat Page
    chat: {
      title: "聊天",
      noMessages: "沒有對話",
      startNew: "開始新對話",
    },
    
    // Assistant Page
    assistant: {
      title: "AI 特助",
      placeholder: "輸入您的問題...",
      send: "發送",
      thinking: "思考中...",
      welcome: "您好！我是您的 AI 特助，有什麼可以幫您的？",
    },
    
    // Tasks Page
    tasks: {
      title: "任務",
      all: "全部",
      pending: "待處理",
      inProgress: "進行中",
      completed: "已完成",
      noTasks: "沒有任務",
      createTask: "建立任務",
    },
    
    // Profile Page
    profile: {
      title: "我的",
      settings: "設定",
      language: "語言",
      logout: "登出",
      version: "版本",
    },
    
    // Common
    common: {
      loading: "載入中...",
      error: "發生錯誤",
      retry: "重試",
      cancel: "取消",
      confirm: "確認",
      save: "儲存",
      delete: "刪除",
      edit: "編輯",
      back: "返回",
    },
  },
  
  en: {
    // Tab Bar
    tabs: {
      contacts: "Contacts",
      chat: "Chat",
      assistant: "Assistant",
      tasks: "Tasks",
      profile: "Profile",
    },
    
    // Contacts Page
    contacts: {
      title: "Contacts",
      explore: "Explore",
      myTeam: "My Team",
      invite: "Invite",
      search: "Search AI employees...",
      all: "All",
      strategy: "Strategy",
      execution: "Execution",
      training: "Training",
      startChat: "Start Chat",
      addToTeam: "Add to Team",
      noResults: "No matching AI employees found",
      createGroup: "Create Work Group",
      createGroupDesc: "Assemble AI employees into your team",
      inviteTitle: "Invite Colleagues",
      inviteDesc: "Invite your colleagues to join SoWork AI Team",
      emailPlaceholder: "Enter colleague's email",
      inviteBtn: "Invite",
      shareLink: "Or share invite link",
      copy: "Copy",
    },
    
    // Chat Page
    chat: {
      title: "Chat",
      noMessages: "No conversations",
      startNew: "Start new conversation",
    },
    
    // Assistant Page
    assistant: {
      title: "AI Assistant",
      placeholder: "Type your question...",
      send: "Send",
      thinking: "Thinking...",
      welcome: "Hello! I'm your AI assistant. How can I help you?",
    },
    
    // Tasks Page
    tasks: {
      title: "Tasks",
      all: "All",
      pending: "Pending",
      inProgress: "In Progress",
      completed: "Completed",
      noTasks: "No tasks",
      createTask: "Create Task",
    },
    
    // Profile Page
    profile: {
      title: "Profile",
      settings: "Settings",
      language: "Language",
      logout: "Logout",
      version: "Version",
    },
    
    // Common
    common: {
      loading: "Loading...",
      error: "An error occurred",
      retry: "Retry",
      cancel: "Cancel",
      confirm: "Confirm",
      save: "Save",
      delete: "Delete",
      edit: "Edit",
      back: "Back",
    },
  },
} as const;

export type Locale = keyof typeof locales;
export type TranslationKeys = typeof locales.zh;
