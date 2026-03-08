/**
 * AI Mobile Team - tRPC Router
 * 定義所有 API endpoints
 */
import { initTRPC } from "@trpc/server";
import { z } from "zod";
import superjson from "superjson";
import { query } from "./db.js";
import { 
  taskAgentMapping, 
  createTask, 
  TaskType, 
  aiOnboardingData,
  getUserNotifications,
  markNotificationRead,
  createNotification,
  Notification
} from "./taskRouting.js";
import {
  generateContent,
  getAvailableModels,
  getRecommendedModel,
  AIModel,
} from "./aiContentGenerator.js";
import {
  chat as chiefOfStaffChat,
  confirmTeam,
  getTasks,
  getTask,
  updateTaskStatus,
  simulateTaskProgress,
  requestApproval,
  handleApproval,
  getPendingApprovals,
  getApprovalRecord,
  ChiefOfStaffResponse,
  Task,
  ApprovalRecord,
  ApprovalStatus,
} from "./chiefOfStaff.js";
import { crawlWebsite, recommendAgentsForBrand, CrawlResult } from "./webCrawler.js";
import * as onedrive from "./onedrive.js";
import { executeAction, ActionType, ActionResult } from "./actionExecutor.js";
import { generateProfessionalPPT, getManusTaskStatus, waitForTaskCompletion } from "./manus.js";
import { DEMO_COMPANY, DEMO_DEPARTMENTS, DEMO_MEETINGS, DEMO_TASKS, DEMO_AGENTS, getAgentsByDepartment, getMeetingsByDepartment, getDemoTasks } from "./seedData.js";

const t = initTRPC.create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Auth Router
const authRouter = router({
  me: publicProcedure.query(async () => {
    // 開發模式：返回測試用戶
    return {
      id: "dev-user-001",
      email: "cj@sowork.ai",
      name: "CJ Wang",
      avatar: null,
      role: "admin",
    };
  }),
  
  logout: publicProcedure.mutation(async () => {
    // TODO: 實作登出
    return { success: true };
  }),
  
  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(6),
    }))
    .mutation(async ({ input }) => {
      // TODO: 實作登入
      return { success: true, user: null };
    }),
    
  register: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(6),
      name: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      // TODO: 實作註冊
      return { success: true, user: null };
    }),
});

// Talent Pool Router (人才庫) - 使用 agents 表
const talentRouter = router({
  // 獲取人才列表
  list: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
      layer: z.string().optional(),
      search: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const { limit = 20, offset = 0, layer, search } = input || {};
      
      let sql = `
        SELECT id, slug, name, englishName, title, layer, avatarUrl, bio, specialty, skills, rating
        FROM agents 
        WHERE isAvailable = 1
      `;
      const params: any[] = [];
      
      if (layer) {
        sql += ` AND layer = ?`;
        params.push(layer);
      }
      
      if (search) {
        sql += ` AND (name LIKE ? OR title LIKE ? OR specialty LIKE ? OR skills LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
      }
      
      sql += ` ORDER BY isFeatured DESC, rating DESC, name ASC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;
      
      const talents = await query(sql, params);
      
      // 獲取總數
      let countSql = `SELECT COUNT(*) as total FROM agents WHERE isAvailable = 1`;
      const countParams: any[] = [];
      if (layer) {
        countSql += ` AND layer = ?`;
        countParams.push(layer);
      }
      if (search) {
        countSql += ` AND (name LIKE ? OR title LIKE ? OR specialty LIKE ? OR skills LIKE ?)`;
        countParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
      }
      
      const [countResult] = await query<{total: number}>(countSql, countParams);
      
      // 解析 JSON 或逗號分隔的字串為陣列
      const parseSkills = (data: any) => {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        if (typeof data === 'string') {
          try {
            const parsed = JSON.parse(data);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return data.split(',').map((s: string) => s.trim()).filter(Boolean);
          }
        }
        return [];
      };
      
      return {
        talents: talents.map((t: any) => ({
          id: t.id,
          slug: t.slug,
          name: t.name,
          englishName: t.englishName,
          role: t.title,
          layer: t.layer,
          avatar: t.avatarUrl,
          expertise: parseSkills(t.skills),
          description: t.bio,
          specialty: t.specialty,
          rating: t.rating,
        })),
        total: countResult?.total || 0,
        hasMore: offset + limit < (countResult?.total || 0),
      };
    }),
    
  // 獲取單個人才詳情（支援 id 或 slug）
  get: publicProcedure
    .input(z.object({ 
      id: z.number().optional(),
      slug: z.string().optional(),
    }))
    .query(async ({ input }) => {
      let talent;
      if (input.id) {
        [talent] = await query(
          `SELECT * FROM agents WHERE id = ? AND isAvailable = 1`,
          [input.id]
        );
      } else if (input.slug) {
        [talent] = await query(
          `SELECT * FROM agents WHERE slug = ? AND isAvailable = 1`,
          [input.slug]
        );
      } else {
        return null;
      }
      
      if (!talent) return null;
      
      const parseArray = (data: any) => {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        if (typeof data === 'string') {
          try { return JSON.parse(data); } catch { return []; }
        }
        return [];
      };
      
      return {
        id: talent.id,
        slug: talent.slug,
        name: talent.name,
        englishName: talent.englishName,
        role: talent.title,
        layer: talent.layer,
        avatar: talent.avatarUrl,
        coverUrl: talent.coverUrl,
        bio: talent.bio,
        experienceDetail: talent.experienceDetail,
        specialty: talent.specialty,
        methodology: talent.methodology,
        knowledgeSources: parseArray(talent.knowledgeSources),
        expertise: parseArray(talent.skills),
        industries: parseArray(talent.industries),
        caseStudies: parseArray(talent.caseStudies),
        rating: talent.rating,
        reviewCount: talent.reviewCount,
        taskCount: talent.taskCount,
        priceMonthly: talent.priceMonthly,
        pricePerTask: talent.pricePerTask,
      };
    }),
    
  // 按層級統計
  stats: publicProcedure.query(async () => {
    const stats = await query(`
      SELECT layer, COUNT(*) as count 
      FROM agents 
      WHERE isAvailable = 1 
      GROUP BY layer 
      ORDER BY layer ASC
    `);
    
    const [total] = await query<{total: number}>(`
      SELECT COUNT(*) as total FROM agents WHERE isAvailable = 1
    `);
    
    return {
      byLayer: stats.map((s: any) => ({ layer: s.layer, count: s.count })),
      total: total?.total || 0,
    };
  }),
});

// AI Onboarding Router - AI 員工入職說明
const aiRouter = router({
  // 獲取 AI 員工入職說明
  getOnboarding: publicProcedure
    .input(z.object({ agentId: z.number() }))
    .query(async ({ input }) => {
      const onboarding = aiOnboardingData[input.agentId];
      
      if (!onboarding) {
        // 如果沒有預設資料，從 agents 表生成基本資料
        const [agent] = await query(
          `SELECT id, name, title, bio, methodology, specialty, skills, caseStudies
           FROM agents WHERE id = ?`,
          [input.agentId]
        );
        
        if (!agent) return null;
        
        const parseArray = (data: any) => {
          if (!data) return [];
          if (Array.isArray(data)) return data;
          if (typeof data === 'string') {
            try { return JSON.parse(data); } catch { return data.split(',').map((s: string) => s.trim()); }
          }
          return [];
        };
        
        return {
          id: agent.id,
          name: agent.name,
          role: agent.title,
          specialties: parseArray(agent.skills).slice(0, 4),
          methodology: agent.methodology || "專業、高效、以結果為導向",
          successCases: parseArray(agent.caseStudies).slice(0, 3),
          canHelp: [
            "自動處理例行任務",
            "生成專業報告",
            "提供決策建議",
            "追蹤任務進度"
          ],
          workingStyle: "我會主動完成能做的事，只在需要您決策時通知您。"
        };
      }
      
      return onboarding;
    }),
    
  // 標記用戶已看過某個 AI 的入職說明
  markOnboardingSeen: publicProcedure
    .input(z.object({ agentId: z.number() }))
    .mutation(async ({ input }) => {
      // TODO: 存入用戶設定
      return { success: true, agentId: input.agentId };
    }),
});

// Notification Router - 通知系統
const notificationRouter = router({
  // 獲取用戶的通知列表
  list: publicProcedure
    .input(z.object({
      unreadOnly: z.boolean().optional(),
      limit: z.number().min(1).max(50).default(20),
    }).optional())
    .query(async ({ input }) => {
      const { unreadOnly = false, limit = 20 } = input || {};
      
      // 使用 dev-user-001 作為測試用戶
      let notifications = getUserNotifications("dev-user-001");
      
      if (unreadOnly) {
        notifications = notifications.filter(n => !n.readAt);
      }
      
      return {
        notifications: notifications.slice(0, limit),
        unreadCount: notifications.filter(n => !n.readAt).length,
      };
    }),
    
  // 標記通知已讀
  markRead: publicProcedure
    .input(z.object({ 
      notificationId: z.string().optional(),
      markAllRead: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      if (input.markAllRead) {
        const notifications = getUserNotifications("dev-user-001");
        notifications.forEach(n => {
          if (!n.readAt) markNotificationRead(n.id);
        });
        return { success: true, markedCount: notifications.length };
      }
      
      if (input.notificationId) {
        markNotificationRead(input.notificationId);
        return { success: true };
      }
      
      return { success: false };
    }),
    
  // 獲取未讀數量
  unreadCount: publicProcedure.query(async () => {
    const notifications = getUserNotifications("dev-user-001");
    return {
      count: notifications.filter(n => !n.readAt).length,
    };
  }),
});

// Task Router - 任務自動路由系統
const taskRouter = router({
  // 獲取任務類型的 AI 員工配對
  getAgentMapping: publicProcedure
    .input(z.object({ taskType: z.string() }))
    .query(async ({ input }) => {
      const mapping = taskAgentMapping[input.taskType as TaskType];
      if (!mapping) return null;
      
      // 從 agents 表獲取完整的 AI 員工資訊
      const [primaryAgent] = await query(
        `SELECT id, name, englishName, title, avatarUrl, bio, methodology 
         FROM agents WHERE id = ?`,
        [mapping.primary.id]
      );
      
      let secondaryAgent = null;
      if (mapping.secondary) {
        const [agent] = await query(
          `SELECT id, name, englishName, title, avatarUrl, bio, methodology 
           FROM agents WHERE id = ?`,
          [mapping.secondary.id]
        );
        secondaryAgent = agent;
      }
      
      return {
        taskType: input.taskType,
        primary: primaryAgent ? {
          id: primaryAgent.id,
          name: primaryAgent.name,
          englishName: primaryAgent.englishName,
          title: primaryAgent.title,
          avatar: primaryAgent.avatarUrl,
          bio: primaryAgent.bio,
          methodology: primaryAgent.methodology,
        } : mapping.primary,
        secondary: secondaryAgent ? {
          id: secondaryAgent.id,
          name: secondaryAgent.name,
          englishName: secondaryAgent.englishName,
          title: secondaryAgent.title,
          avatar: secondaryAgent.avatarUrl,
          bio: secondaryAgent.bio,
        } : mapping.secondary,
        humanApprover: mapping.humanApprover,
      };
    }),
    
  // 獲取所有任務類型及其 AI 配對
  getAllMappings: publicProcedure.query(async () => {
    const result: any[] = [];
    
    for (const [taskType, mapping] of Object.entries(taskAgentMapping)) {
      // 獲取主要 AI 員工資訊
      const [primaryAgent] = await query(
        `SELECT id, name, title, avatarUrl FROM agents WHERE id = ?`,
        [mapping.primary.id]
      );
      
      result.push({
        taskType,
        primary: primaryAgent ? {
          id: primaryAgent.id,
          name: primaryAgent.name,
          title: primaryAgent.title,
          avatar: primaryAgent.avatarUrl,
        } : mapping.primary,
        humanApprover: mapping.humanApprover,
      });
    }
    
    return result;
  }),
  
  // 創建任務
  create: publicProcedure
    .input(z.object({
      type: z.string(),
      title: z.string(),
      stages: z.array(z.object({
        id: z.number(),
        name: z.string(),
        assignTo: z.enum(["ai", "human", "both"]),
      })),
    }))
    .mutation(async ({ input }) => {
      // 目前返回 mock 數據，實際會存入資料庫
      const task = createTask(
        input.type as TaskType,
        input.title,
        "dev-user-001", // 從 session 獲取
        input.stages
      );
      
      return task;
    }),
    
  // 獲取用戶的待辦任務
  myTasks: publicProcedure
    .input(z.object({
      status: z.enum(["all", "active", "completed"]).optional(),
    }).optional())
    .query(async ({ input }) => {
      // 返回 mock 數據，實際會從資料庫查詢
      return {
        myTasks: [], // 我發起的任務
        pendingApproval: [], // 等我審批的任務
        aiHandling: [], // AI 正在處理的任務
      };
    }),
    
  // 執行訊息旁的快捷動作
  executeAction: publicProcedure
    .input(z.object({
      actionId: z.string(),
      messageContent: z.string(),
      agentRole: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const result = await executeAction(
        input.actionId as any,
        input.messageContent,
        { agentRole: input.agentRole }
      );
      return result;
    }),
});

// Content Generation Router (AI 生成文件內容)
const contentRouter = router({
  // 生成文件內容
  generate: publicProcedure
    .input(z.object({
      taskType: z.string(),
      role: z.string().optional(),
      title: z.string(),
      context: z.string(),
      format: z.enum(["pdf", "doc", "ppt", "xls", "markdown", "code"]),
      language: z.enum(["zh", "en"]).optional(),
      model: z.enum(["openai", "qianwen", "zhipu", "perplexity", "google", "cohere"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const result = await generateContent({
        taskType: input.taskType,
        role: input.role,
        title: input.title,
        context: input.context,
        format: input.format,
        language: input.language,
        model: input.model as AIModel,
      });
      return result;
    }),

  // 獲取可用的 AI Models
  models: publicProcedure.query(() => {
    return getAvailableModels();
  }),

  // 獲取推薦的 AI Model
  recommendedModel: publicProcedure
    .input(z.object({
      taskType: z.string().optional(),
      role: z.string().optional(),
    }))
    .query(({ input }) => {
      return getRecommendedModel(input.taskType, input.role);
    }),
});

// Chief of Staff Router - 幕僚長 AI 對話 + 任務管理
const chiefOfStaffRouter = router({
  // 對話
  chat: publicProcedure
    .input(z.object({
      message: z.string().min(1),
      history: z.array(z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })).optional(),
    }))
    .mutation(async ({ input }) => {
      const response = await chiefOfStaffChat(input.message, input.history);
      return response;
    }),
    
  // 確認組隊並建立任務
  confirmTeam: publicProcedure
    .input(z.object({
      agentIds: z.array(z.number()),
      taskTitle: z.string(),
      taskDescription: z.string(),
    }))
    .mutation(async ({ input }) => {
      const result = await confirmTeam(
        input.agentIds,
        input.taskTitle,
        input.taskDescription
      );
      return result;
    }),
    
  // 獲取任務列表
  tasks: publicProcedure
    .input(z.object({
      status: z.enum(["all", "active", "completed"]).optional(),
    }).optional())
    .query(({ input }) => {
      return getTasks(input);
    }),
    
  // 獲取單個任務
  task: publicProcedure
    .input(z.object({ taskId: z.string() }))
    .query(({ input }) => {
      return getTask(input.taskId);
    }),
    
  // 更新任務狀態
  updateTask: publicProcedure
    .input(z.object({
      taskId: z.string(),
      status: z.enum(["pending", "in_progress", "review", "completed"]).optional(),
      currentStage: z.number().optional(),
    }))
    .mutation(({ input }) => {
      return updateTaskStatus(input.taskId, {
        status: input.status,
        currentStage: input.currentStage,
      });
    }),
    
  // 模擬任務進度（演示用）
  simulateProgress: publicProcedure
    .input(z.object({ taskId: z.string() }))
    .mutation(async ({ input }) => {
      const result = await simulateTaskProgress(input.taskId);
      return {
        task: result.task,
        needsApproval: result.needsApproval,
        approvalId: result.approvalId,
      };
    }),
    
  // ============ 審批功能 ============
  
  // 獲取待審批列表
  pendingApprovals: publicProcedure
    .input(z.object({ userId: z.string().optional() }).optional())
    .query(({ input }) => {
      const approvals = getPendingApprovals(input?.userId || "dev-user-001");
      return {
        approvals,
        count: approvals.length,
      };
    }),
    
  // 獲取單個審批記錄
  getApproval: publicProcedure
    .input(z.object({ approvalId: z.string() }))
    .query(({ input }) => {
      return getApprovalRecord(input.approvalId);
    }),
    
  // 審批通過
  approveTask: publicProcedure
    .input(z.object({
      approvalId: z.string(),
      comment: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return handleApproval(input.approvalId, "approved", input.comment);
    }),
    
  // 審批駁回
  rejectTask: publicProcedure
    .input(z.object({
      approvalId: z.string(),
      comment: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return handleApproval(input.approvalId, "rejected", input.comment);
    }),
    
  // 請求審批（由 AI 調用）
  requestApproval: publicProcedure
    .input(z.object({
      taskId: z.string(),
      stageIndex: z.number(),
      aiSummary: z.string(),
      deliverables: z.array(z.object({
        type: z.string(),
        title: z.string(),
        url: z.string().optional(),
        preview: z.string().optional(),
      })).optional(),
    }))
    .mutation(async ({ input }) => {
      const approval = await requestApproval(
        input.taskId,
        input.stageIndex,
        input.aiSummary,
        input.deliverables
      );
      
      if (approval) {
        return {
          success: true,
          approval,
          message: `已提交審批請求，等待審核。`,
        };
      }
      
      return {
        success: false,
        message: "無法建立審批請求",
      };
    }),
});

// ============ 群組系統 ============

interface BrandGroup {
  id: string;
  brandName: string;
  products: string[];
  members: {
    id: number;
    name: string;
    title: string;
    avatar: string | null;
    isAI: boolean;
  }[];
  createdAt: Date;
}

// 內存存儲群組
const brandGroups: Map<string, BrandGroup> = new Map();

// Company Router - 企業設定 + Web 爬取 + 群組管理
const companyRouter = router({
  // Web 爬取：從網站提取品牌和產品
  crawlWebsite: publicProcedure
    .input(z.object({
      url: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      return await crawlWebsite(input.url);
    }),
    
  // 為品牌建立群組並推薦 AI 員工
  createBrandGroups: publicProcedure
    .input(z.object({
      brands: z.array(z.object({
        name: z.string(),
        products: z.array(z.string()),
      })),
    }))
    .mutation(async ({ input }) => {
      const createdGroups: BrandGroup[] = [];
      
      // 獲取可用的 AI 員工
      const agents = await query(
        `SELECT id, name, title, specialty FROM agents LIMIT 100`
      );
      
      for (const brand of input.brands) {
        const groupId = `group_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        
        // AI 推薦員工
        const recommendedIds = await recommendAgentsForBrand(
          brand.name,
          brand.products,
          agents as any[]
        );
        
        // 獲取推薦員工的詳細資訊
        const members: BrandGroup["members"] = [];
        if (recommendedIds.length > 0) {
          const memberDetails = await query(
            `SELECT id, name, title, avatarUrl FROM agents WHERE id IN (${recommendedIds.join(",")})`
          );
          for (const m of memberDetails as any[]) {
            members.push({
              id: m.id,
              name: m.name,
              title: m.title,
              avatar: m.avatarUrl,
              isAI: true,
            });
          }
        }
        
        const group: BrandGroup = {
          id: groupId,
          brandName: brand.name,
          products: brand.products,
          members,
          createdAt: new Date(),
        };
        
        brandGroups.set(groupId, group);
        createdGroups.push(group);
      }
      
      return {
        success: true,
        groups: createdGroups,
        message: `已為 ${createdGroups.length} 個品牌建立群組，並推薦了 AI 員工`,
      };
    }),
    
  // 獲取所有品牌群組
  getBrandGroups: publicProcedure.query(() => {
    return Array.from(brandGroups.values());
  }),
  
  // 獲取單個群組
  getBrandGroup: publicProcedure
    .input(z.object({ groupId: z.string() }))
    .query(({ input }) => {
      return brandGroups.get(input.groupId);
    }),
    
  // 手動建立群組
  createGroup: publicProcedure
    .input(z.object({
      name: z.string().min(1),
      memberIds: z.array(z.number()),
    }))
    .mutation(async ({ input }) => {
      const groupId = `group_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      
      // 獲取成員詳細資訊
      const members: BrandGroup["members"] = [];
      if (input.memberIds.length > 0) {
        const memberDetails = await query(
          `SELECT id, name, title, avatarUrl FROM agents WHERE id IN (${input.memberIds.join(",")})`
        );
        for (const m of memberDetails as any[]) {
          members.push({
            id: m.id,
            name: m.name,
            title: m.title,
            avatar: m.avatarUrl,
            isAI: true,
          });
        }
      }
      
      const group: BrandGroup = {
        id: groupId,
        brandName: input.name,
        products: [],
        members,
        createdAt: new Date(),
      };
      
      brandGroups.set(groupId, group);
      
      return {
        success: true,
        group,
      };
    }),
});

// OneDrive Router - 知識庫整合
const onedriveRouter = router({
  // 獲取授權 URL (傳入 userId 以記錄 state)
  connect: publicProcedure
    .input(z.object({ userId: z.string().default("dev-user-001") }).optional())
    .mutation(async ({ input }) => {
      const userId = input?.userId || "dev-user-001";
      const url = await onedrive.getAuthUrl(userId);
      return { authUrl: url };
    }),

  // 向後兼容: getAuthUrl query
  getAuthUrl: publicProcedure
    .input(z.object({ userId: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const url = await onedrive.getAuthUrl(input?.userId || "dev-user-001");
      return { url };
    }),

  // 處理授權回調
  handleCallback: publicProcedure
    .input(z.object({ code: z.string(), userId: z.string() }))
    .mutation(async ({ input }) => {
      const success = await onedrive.handleCallback(input.code, input.userId);
      return { success };
    }),

  // 連接狀態（含用戶資訊）
  status: publicProcedure
    .input(z.object({ userId: z.string().optional() }).optional())
    .query(({ input }) => {
      const userId = input?.userId || "dev-user-001";
      return onedrive.getConnectionInfo(userId);
    }),

  // 列出文件
  listFiles: publicProcedure
    .input(z.object({ userId: z.string().optional(), folderId: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const userId = input?.userId || "dev-user-001";
      const files = await onedrive.listFiles(userId, input?.folderId);
      return { files };
    }),

  // 獲取文件內容
  getFile: publicProcedure
    .input(z.object({ userId: z.string().optional(), fileId: z.string() }))
    .query(async ({ input }) => {
      const userId = input?.userId || "dev-user-001";
      return onedrive.getFileContent(userId, input.fileId);
    }),

  // 搜索文件
  searchFiles: publicProcedure
    .input(z.object({ userId: z.string().optional(), query: z.string() }))
    .query(async ({ input }) => {
      const userId = input?.userId || "dev-user-001";
      const files = await onedrive.searchFiles(userId, input.query);
      return { files };
    }),

  // 掃描知識庫（供 AI 任務使用）
  scanKnowledge: publicProcedure
    .input(z.object({ userId: z.string().optional() }).optional())
    .mutation(async ({ input }) => {
      const userId = input?.userId || "dev-user-001";
      const docs = await onedrive.scanKnowledgeBase(userId);
      return { docs, count: docs.length };
    }),

  // 斷開連接
  disconnect: publicProcedure
    .input(z.object({ userId: z.string().optional() }).optional())
    .mutation(({ input }) => {
      const userId = input?.userId || "dev-user-001";
      onedrive.disconnect(userId);
      return { success: true };
    }),
});

// Manus Router - 專業 PPT 生成
const manusRouter = router({
  // 建立 PPT 生成任務
  createPPT: publicProcedure
    .input(z.object({
      title: z.string(),
      content: z.string(),
      style: z.enum(["business", "creative", "minimal"]).optional(),
      slides: z.number().min(3).max(30).optional(),
      language: z.enum(["zh", "en"]).optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const result = await generateProfessionalPPT({
          title: input.title,
          content: input.content,
          style: input.style,
          slides: input.slides,
          language: input.language,
        });
        return {
          success: true,
          taskId: result.taskId,
          taskUrl: result.taskUrl,
          message: "PPT 生成任務已建立，請稍候...",
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),
  
  // 查詢任務狀態
  getTaskStatus: publicProcedure
    .input(z.object({
      taskId: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        const status = await getManusTaskStatus(input.taskId);
        return {
          success: true,
          ...status,
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),
});

// Demo Router - 免登入體驗種子數據
const demoRouter = router({
  // 獲取演示公司資料
  company: publicProcedure.query(() => DEMO_COMPANY),
  
  // 獲取部門列表
  departments: publicProcedure.query(() => DEMO_DEPARTMENTS),
  
  // 獲取例行會議
  meetings: publicProcedure
    .input(z.object({ departmentId: z.string().optional() }).optional())
    .query(({ input }) => {
      if (input?.departmentId) {
        return getMeetingsByDepartment(input.departmentId);
      }
      return DEMO_MEETINGS;
    }),
  
  // 獲取演示任務
  tasks: publicProcedure
    .input(z.object({ 
      filter: z.enum(["all", "active", "completed"]).optional(),
      departmentId: z.string().optional(),
    }).optional())
    .query(({ input }) => {
      let tasks = getDemoTasks(input?.filter);
      if (input?.departmentId) {
        tasks = tasks.filter(t => t.department === input.departmentId);
      }
      return tasks;
    }),
  
  // 獲取 AI 員工
  agents: publicProcedure
    .input(z.object({ departmentId: z.string().optional() }).optional())
    .query(({ input }) => {
      if (input?.departmentId) {
        return getAgentsByDepartment(input.departmentId);
      }
      return DEMO_AGENTS;
    }),
});

// Main App Router
export const appRouter = router({
  auth: authRouter,
  talent: talentRouter,
  task: taskRouter,
  ai: aiRouter,
  notification: notificationRouter,
  content: contentRouter,
  chiefOfStaff: chiefOfStaffRouter,
  company: companyRouter,
  onedrive: onedriveRouter,
  manus: manusRouter,
  demo: demoRouter,
  
  // Health check
  health: publicProcedure.query(() => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  })),
});

export type AppRouter = typeof appRouter;
