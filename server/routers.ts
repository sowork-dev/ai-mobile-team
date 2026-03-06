/**
 * AI Mobile Team - tRPC Router
 * 定義所有 API endpoints
 */
import { initTRPC } from "@trpc/server";
import { z } from "zod";
import superjson from "superjson";
import { query } from "./db.js";
import { taskAgentMapping, createTask, TaskType } from "./taskRouting.js";

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
    
  // 獲取單個人才詳情
  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const [talent] = await query(
        `SELECT * FROM agents WHERE id = ? AND isAvailable = 1`,
        [input.id]
      );
      
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
});

// Main App Router
export const appRouter = router({
  auth: authRouter,
  talent: talentRouter,
  task: taskRouter,
  
  // Health check
  health: publicProcedure.query(() => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  })),
});

export type AppRouter = typeof appRouter;
