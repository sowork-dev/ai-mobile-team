/**
 * AI Mobile Team - Server Entry Point
 * Port 3001 (獨立於 main platform 的 3000)
 */
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import * as trpcExpress from "@trpc/server/adapters/express";
import { appRouter } from "./routers.js";
import * as onedrive from "./onedrive.js";
import { generatePPTX, generateDOCX, generateXLSX, generatePDF, extractPptxPrimaryColor, type PptTheme } from "./exportGenerators.js";
import { getFormatForRole } from "./formatMapping.js";
import { validateWebhookSignature, parseWebhookEvents, parseSchedulingPostback } from "./lineIntegration.js";
import { recordParticipantReplyByLineId, findSessionByLineUserId } from "./schedulingSession.js";
import {
  GoogleCalendarService,
  OutlookCalendarService,
  GmailService,
  OutlookMailService,
  findCommonSlots,
  createMeetingEvent,
  DEMO_UNREAD_EMAILS,
} from "./calendarIntegration.js";
import { getMicrosoftAuthUrl, handleMicrosoftCallback } from "./authMicrosoft.js";
import { getLatestTrends, getAdBenchmarks, getSocialBenchmarks, getKOLRankings } from "./marketData.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || true,
  credentials: true,
}));

// ── LINE Webhook（必須在 express.json() 之前，才能取得 raw body 做 signature 驗證）──
app.post("/webhook/line", express.raw({ type: "application/json" }), (req, res) => {
  const signature = req.headers["x-line-signature"] as string;
  const rawBody = req.body instanceof Buffer ? req.body.toString() : JSON.stringify(req.body);

  // 使用 LINE_CHANNEL_SECRET 驗證簽名（Channel Secret: 已設定）
  if (!validateWebhookSignature(rawBody, signature)) {
    console.warn("LINE webhook: invalid signature, rejecting request");
    return res.status(401).json({ error: "Invalid signature" });
  }

  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  const events = parseWebhookEvents(body);
  for (const event of events) {
    if (event.type === "message" && event.message?.type === "text") {
      const userId = event.source?.userId;
      const text = event.message.text;
      console.log(`📩 LINE message from ${userId}: ${text}`);
      // TODO: 將訊息轉入幕僚長聊天記錄
    } else if (event.type === "postback") {
      // 處理排程時間選擇 postback
      const userId = event.source?.userId;
      const data = event.postback?.data;
      if (userId && data) {
        const parsed = parseSchedulingPostback(data);
        if (parsed) {
          console.log(`📅 Scheduling postback from ${userId}: session=${parsed.sessionId} date=${parsed.date}`);
          // 累積選擇（用戶可能多次點選不同日期）
          const result = recordParticipantReplyByLineId(parsed.sessionId, userId, [parsed.date]);
          if (result) {
            if (result.allReplied) {
              const common = result.session.commonDates || [];
              console.log(`✅ All replied for session ${parsed.sessionId}. Common dates: ${common.join(", ")}`);
            }
          } else {
            // 嘗試透過 session 找到參與者（多次點選累積日期）
            const session = findSessionByLineUserId(userId);
            if (session) {
              const participant = session.participants.find((p) => p.lineUserId === userId);
              if (participant) {
                const updatedDates = Array.from(new Set([...participant.availableDates, parsed.date]));
                recordParticipantReplyByLineId(parsed.sessionId, userId, updatedDates);
              }
            }
          }
        }
      }
    } else if (event.type === "follow") {
      const userId = event.source?.userId;
      console.log(`✅ LINE follow event from ${userId}`);
    }
  }

  // LINE 要求 200 回應
  res.json({ status: "ok" });
});

app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ 
    status: "ok", 
    service: "ai-mobile-team", 
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// Microsoft OAuth 回調處理
app.get("/api/auth/callback/microsoft", async (req, res) => {
  const { code, state } = req.query;
  
  if (!code || typeof code !== "string") {
    return res.status(400).send("Missing authorization code");
  }
  
  try {
    // TODO: 從 state 獲取 userId，目前使用預設值
    const userId = "dev-user-001";
    const success = await onedrive.handleCallback(code, userId);
    
    if (success) {
      // 成功後關閉視窗並刷新父頁面
      res.send(`
        <html>
          <body>
            <script>
              window.opener?.postMessage({ type: 'onedrive-connected' }, '*');
              window.close();
            </script>
            <p>連接成功！此視窗即將關閉...</p>
          </body>
        </html>
      `);
    } else {
      res.status(500).send("連接失敗，請重試");
    }
  } catch (error) {
    console.error("OAuth callback error:", error);
    res.status(500).send("連接失敗：" + (error as Error).message);
  }
});

// ── 文件導出 API ────────────────────────────────────────────────
app.post("/api/export/pptx", async (req, res) => {
  const {
    title = "報告",
    content = "",
    companyName = "SoWork AI",
    format = "pptx",
    userRole = "",
    theme = "bcg",
    userId = "dev-user-001",
  } = req.body || {};

  try {
    const formatConfig = getFormatForRole(userRole);
    const maxSlides = formatConfig.pptSlides ?? 11;

    // 檢查是否有品牌自定義主色
    let customPrimary: string | undefined;
    const metaPath = path.join(process.cwd(), "uploads", "templates", String(userId), "meta.json");
    if (fs.existsSync(metaPath)) {
      try {
        const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
        if (meta.primaryColor) customPrimary = meta.primaryColor;
      } catch { /* ignore */ }
    }

    if (format === "pdf") {
      const buffer = await generatePDF(title, content, companyName);
      const filename = encodeURIComponent(`${title}.pdf`);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${filename}`);
      res.send(buffer);
    } else if (format === "docx") {
      const buffer = await generateDOCX(title, content, companyName);
      const filename = encodeURIComponent(`${title}.docx`);
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );
      res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${filename}`);
      res.send(buffer);
    } else if (format === "xlsx") {
      const buffer = await generateXLSX(title, content, companyName);
      const filename = encodeURIComponent(`${title}.xlsx`);
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${filename}`);
      res.send(buffer);
    } else {
      const buffer = await generatePPTX(title, content, companyName, {
        maxSlides,
        theme: theme as PptTheme,
        customPrimary,
      });
      const filename = encodeURIComponent(`${title}.pptx`);
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation"
      );
      res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${filename}`);
      res.send(buffer);
    }
  } catch (err) {
    console.error("Export error:", err);
    res.status(500).json({ error: "文件生成失敗", detail: (err as Error).message });
  }
});

// ── 品牌模板上傳 ───────────────────────────────────────────────
app.post("/api/template/upload", express.json({ limit: "20mb" }), async (req, res) => {
  const { base64, userId = "dev-user-001" } = req.body || {};
  if (!base64) return res.status(400).json({ error: "Missing base64 content" });

  try {
    const dir = path.join(process.cwd(), "uploads", "templates", String(userId));
    fs.mkdirSync(dir, { recursive: true });

    const buffer = Buffer.from(base64, "base64");
    fs.writeFileSync(path.join(dir, "template.pptx"), buffer);

    // 提取主色
    const primaryColor = await extractPptxPrimaryColor(buffer);

    // 儲存 metadata
    fs.writeFileSync(
      path.join(dir, "meta.json"),
      JSON.stringify({ primaryColor, uploadedAt: new Date().toISOString() })
    );

    res.json({ success: true, primaryColor });
  } catch (err) {
    console.error("Template upload error:", err);
    res.status(500).json({ error: "上傳失敗", detail: (err as Error).message });
  }
});

// ── 品牌模板狀態查詢 ───────────────────────────────────────────
app.get("/api/template/status", (req, res) => {
  const userId = String(req.query.userId || "dev-user-001");
  const metaPath = path.join(process.cwd(), "uploads", "templates", userId, "meta.json");
  if (fs.existsSync(metaPath)) {
    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
      res.json({ exists: true, ...meta });
    } catch {
      res.json({ exists: false });
    }
  } else {
    res.json({ exists: false });
  }
});

// ── Calendar API ─────────────────────────────────────────────────

/** Google Calendar OAuth URL */
app.get("/api/calendar/auth/google", (req, res) => {
  const redirectUri = `${req.protocol}://${req.get("host")}/api/calendar/callback/google`;
  const url = GoogleCalendarService.getAuthUrl(redirectUri);
  res.json({ url });
});

/** Microsoft Calendar OAuth URL */
app.get("/api/calendar/auth/microsoft", (req, res) => {
  const redirectUri = `${req.protocol}://${req.get("host")}/api/calendar/callback/microsoft`;
  const url = OutlookCalendarService.getAuthUrl(redirectUri);
  res.json({ url });
});

/** Google OAuth callback */
app.get("/api/calendar/callback/google", async (req, res) => {
  const { code } = req.query;
  if (!code || typeof code !== "string") return res.status(400).send("Missing code");
  const redirectUri = `${req.protocol}://${req.get("host")}/api/calendar/callback/google`;
  try {
    const result = await GoogleCalendarService.exchangeCode(code, redirectUri);
    // Demo：直接關閉視窗並通知父頁面
    res.send(`<html><body><script>
      window.opener?.postMessage({ type: 'calendar-connected', provider: 'google', email: '${result.email}' }, '*');
      window.close();
    </script><p>Google Calendar 已連接！此視窗即將關閉...</p></body></html>`);
  } catch (err) {
    res.status(500).send("連接失敗：" + (err as Error).message);
  }
});

/** Microsoft Calendar OAuth callback */
app.get("/api/calendar/callback/microsoft", async (req, res) => {
  const { code } = req.query;
  if (!code || typeof code !== "string") return res.status(400).send("Missing code");
  const redirectUri = `${req.protocol}://${req.get("host")}/api/calendar/callback/microsoft`;
  try {
    const result = await OutlookCalendarService.exchangeCode(code, redirectUri);
    res.send(`<html><body><script>
      window.opener?.postMessage({ type: 'calendar-connected', provider: 'microsoft', email: '${result.email}' }, '*');
      window.close();
    </script><p>Outlook Calendar 已連接！此視窗即將關閉...</p></body></html>`);
  } catch (err) {
    res.status(500).send("連接失敗：" + (err as Error).message);
  }
});

/** 取得用戶未來 N 天行程 */
app.get("/api/calendar/events", async (req, res) => {
  const days = parseInt(String(req.query.days ?? "7"), 10);
  const provider = String(req.query.provider ?? "google");
  try {
    const svc = provider === "microsoft" ? new OutlookCalendarService() : new GoogleCalendarService();
    const events = await svc.listEvents(days);
    res.json({ events });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/** 建立會議事件 */
app.post("/api/calendar/meeting", async (req, res) => {
  const { title, start, end, attendees, platform = "google" } = req.body ?? {};
  if (!title || !start || !end) return res.status(400).json({ error: "Missing required fields" });
  try {
    const event = await createMeetingEvent("demo-user", { title, start, end, attendees: attendees ?? [] }, platform);
    res.json({ event });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/** 找共同空檔 */
app.get("/api/calendar/availability", async (req, res) => {
  const date = String(req.query.date ?? new Date().toISOString().split("T")[0]);
  const participants = (req.query["participants[]"] ?? req.query.participants ?? []) as string[];
  const participantList = Array.isArray(participants) ? participants : [participants];
  const endDate = new Date(new Date(date).getTime() + 7 * 24 * 3600 * 1000).toISOString().split("T")[0];
  const slots = findCommonSlots("demo-user", participantList, { start: date, end: endDate });
  res.json({ slots });
});

// ── Microsoft Auth (SSO) ─────────────────────────────────────────

/** Microsoft 365 登入 — 跳轉 */
app.get("/api/auth/microsoft", (req, res) => {
  const redirectUri = `${req.protocol}://${req.get("host")}/api/auth/microsoft/callback`;
  const state = String(req.query.redirect ?? "/app");
  const url = getMicrosoftAuthUrl(redirectUri, state);
  res.redirect(url);
});

/** Microsoft 365 登入 callback */
app.get("/api/auth/microsoft/callback", async (req, res) => {
  const { code, state } = req.query;
  const redirectTo = (typeof state === "string" && state.startsWith("/")) ? state : "/app";
  if (!code || typeof code !== "string") return res.redirect(`${redirectTo}?error=missing_code`);
  const redirectUri = `${req.protocol}://${req.get("host")}/api/auth/microsoft/callback`;
  try {
    const result = await handleMicrosoftCallback(code, redirectUri);
    // Demo 模式：直接設定 session 並跳轉（生產環境需儲存到 DB + 發 JWT）
    res.send(`<html><body><script>
      localStorage.setItem('msUser', '${JSON.stringify({ email: result.user.email, name: result.user.displayName })}');
      window.location.href = '${redirectTo}';
    </script></body></html>`);
  } catch (err) {
    console.error("Microsoft auth callback error:", err);
    res.redirect(`${redirectTo}?error=auth_failed`);
  }
});

// ── Email API ─────────────────────────────────────────────────────

/** 取得未讀重要 email 摘要 */
app.get("/api/email/unread", async (req, res) => {
  const limit = parseInt(String(req.query.limit ?? "5"), 10);
  const provider = String(req.query.provider ?? "google");
  try {
    const svc = provider === "microsoft" ? new OutlookMailService() : new GmailService();
    const emails = await svc.listUnreadImportant(limit);
    res.json({ emails });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/** 起草回覆 */
app.post("/api/email/draft", async (req, res) => {
  const { emailId, instruction, provider = "google" } = req.body ?? {};
  if (!emailId || !instruction) return res.status(400).json({ error: "Missing emailId or instruction" });
  try {
    const svc = provider === "microsoft" ? new OutlookMailService() : new GmailService();
    const draft = await svc.draftReply(emailId, instruction);
    res.json({ draft });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/** 送出回覆 */
app.post("/api/email/send-reply", async (req, res) => {
  const { emailId, replyBody, provider = "google" } = req.body ?? {};
  if (!emailId || !replyBody) return res.status(400).json({ error: "Missing emailId or replyBody" });
  try {
    const svc = provider === "microsoft" ? new OutlookMailService() : new GmailService();
    const success = await svc.sendReply(emailId, replyBody);
    res.json({ success });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ── Market Data API ──────────────────────────────────────────────

app.get("/api/market-data/trends", async (_req, res) => {
  const data = await getLatestTrends();
  res.json({ data });
});

app.get("/api/market-data/benchmarks", async (req, res) => {
  const market = (req.query.market === "china" ? "china" : "taiwan") as "taiwan" | "china";
  const data = await getAdBenchmarks(market);
  res.json({ data });
});

app.get("/api/market-data/social", async (_req, res) => {
  const data = await getSocialBenchmarks();
  res.json({ data });
});

app.get("/api/market-data/kol", async (_req, res) => {
  const data = await getKOLRankings();
  res.json({ data });
});

// tRPC handler
app.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext: () => ({}),
  })
);

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  const publicPath = path.join(__dirname, "public");
  app.use(express.static(publicPath));
  
  // SPA fallback - exclude API routes
  app.get("*", (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith("/trpc") || req.path.startsWith("/api")) {
      return next();
    }
    res.sendFile(path.join(publicPath, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 AI Mobile Team server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
});
