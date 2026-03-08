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
import { generatePPTX, generateDOCX } from "./exportGenerators.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || true,
  credentials: true,
}));
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
  const { title = "報告", content = "", companyName = "SoWork AI", format = "pptx" } = req.body || {};

  try {
    if (format === "docx") {
      const buffer = await generateDOCX(title, content, companyName);
      const filename = encodeURIComponent(`${title}.docx`);
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );
      res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${filename}`);
      res.send(buffer);
    } else {
      const buffer = await generatePPTX(title, content, companyName);
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
