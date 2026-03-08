/**
 * AI Mobile Team - Server Entry Point
 * Port 3001 (獨立於 main platform 的 3000)
 */
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import * as trpcExpress from "@trpc/server/adapters/express";
import { appRouter } from "./routers.js";
import * as onedrive from "./onedrive.js";
import { generatePPTX, generateDOCX, generateXLSX, generatePDF } from "./exportGenerators.js";
import { getFormatForRole } from "./formatMapping.js";
import { validateWebhookSignature, parseWebhookEvents, parseSchedulingPostback } from "./lineIntegration.js";
import { recordParticipantReplyByLineId, findSessionByLineUserId } from "./schedulingSession.js";

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
  } = req.body || {};

  try {
    const formatConfig = getFormatForRole(userRole);
    const maxSlides = formatConfig.pptSlides ?? 11;

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
      const buffer = await generatePPTX(title, content, companyName, { maxSlides });
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
