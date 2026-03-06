/**
 * AI Mobile Team - tRPC Router
 * 定義所有 API endpoints
 */
import { initTRPC } from "@trpc/server";
import { z } from "zod";
import superjson from "superjson";
import { query } from "./db.js";

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
      
      // 解析逗號分隔的字串為陣列
      const parseCommaSeparated = (str: string | null) => 
        str ? str.split(',').map(s => s.trim()).filter(Boolean) : [];
      
      return {
        talents: talents.map((t: any) => ({
          id: t.id,
          slug: t.slug,
          name: t.name,
          englishName: t.englishName,
          role: t.title,
          layer: t.layer,
          avatar: t.avatarUrl,
          expertise: parseCommaSeparated(t.skills),
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
      
      const parseCommaSeparated = (str: string | null) => 
        str ? str.split(',').map(s => s.trim()).filter(Boolean) : [];
      
      const tryParseJSON = (str: string | null) => {
        if (!str) return null;
        try { return JSON.parse(str); } catch { return str; }
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
        expertise: parseCommaSeparated(talent.skills),
        industries: parseCommaSeparated(talent.industries),
        caseStudies: tryParseJSON(talent.caseStudies),
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

// Main App Router
export const appRouter = router({
  auth: authRouter,
  talent: talentRouter,
  
  // Health check
  health: publicProcedure.query(() => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  })),
});

export type AppRouter = typeof appRouter;
