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

// Talent Pool Router (人才庫)
const talentRouter = router({
  // 獲取人才列表
  list: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
      layer: z.number().min(1).max(5).optional(),
      search: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const { limit = 20, offset = 0, layer, search } = input || {};
      
      let sql = `
        SELECT id, talent_id, name, role, layer, avatar, expertise, description, platforms
        FROM cmo_talent_pool 
        WHERE is_active = 1
      `;
      const params: any[] = [];
      
      if (layer) {
        sql += ` AND layer = ?`;
        params.push(layer);
      }
      
      if (search) {
        sql += ` AND (name LIKE ? OR role LIKE ? OR expertise LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }
      
      sql += ` ORDER BY layer ASC, name ASC LIMIT ? OFFSET ?`;
      params.push(limit, offset);
      
      const talents = await query(sql, params);
      
      // 獲取總數
      let countSql = `SELECT COUNT(*) as total FROM cmo_talent_pool WHERE is_active = 1`;
      const countParams: any[] = [];
      if (layer) {
        countSql += ` AND layer = ?`;
        countParams.push(layer);
      }
      if (search) {
        countSql += ` AND (name LIKE ? OR role LIKE ? OR expertise LIKE ?)`;
        countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }
      
      const [countResult] = await query<{total: number}>(countSql, countParams);
      
      return {
        talents: talents.map((t: any) => ({
          id: t.id,
          talentId: t.talent_id,
          name: t.name,
          role: t.role,
          layer: t.layer,
          avatar: t.avatar,
          expertise: t.expertise ? JSON.parse(t.expertise) : [],
          description: t.description,
          platforms: t.platforms ? JSON.parse(t.platforms) : [],
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
        `SELECT * FROM cmo_talent_pool WHERE id = ? AND is_active = 1`,
        [input.id]
      );
      
      if (!talent) return null;
      
      return {
        id: talent.id,
        talentId: talent.talent_id,
        name: talent.name,
        role: talent.role,
        layer: talent.layer,
        avatar: talent.avatar,
        expertise: talent.expertise ? JSON.parse(talent.expertise) : [],
        description: talent.description,
        platforms: talent.platforms ? JSON.parse(talent.platforms) : [],
        caseStudy: talent.case_study ? JSON.parse(talent.case_study) : null,
        kpis: talent.kpis ? JSON.parse(talent.kpis) : null,
      };
    }),
    
  // 按層級統計
  stats: publicProcedure.query(async () => {
    const stats = await query(`
      SELECT layer, COUNT(*) as count 
      FROM cmo_talent_pool 
      WHERE is_active = 1 
      GROUP BY layer 
      ORDER BY layer ASC
    `);
    
    const [total] = await query<{total: number}>(`
      SELECT COUNT(*) as total FROM cmo_talent_pool WHERE is_active = 1
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
