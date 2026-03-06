/**
 * AI Mobile Team - tRPC Router
 * 定義所有 API endpoints
 */
import { initTRPC } from "@trpc/server";
import { z } from "zod";
import superjson from "superjson";

const t = initTRPC.create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Auth Router
const authRouter = router({
  me: publicProcedure.query(async () => {
    // TODO: 實作 session 驗證
    return null;
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
});

// Main App Router
export const appRouter = router({
  auth: authRouter,
  
  // Health check
  health: publicProcedure.query(() => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  })),
});

export type AppRouter = typeof appRouter;
