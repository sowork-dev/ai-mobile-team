# AI Mobile Team

SoWork AI Team 的獨立 Mobile Web App 專案。

## 🚀 Tech Stack

- **Frontend:** React 19, Vite, TailwindCSS, shadcn/ui
- **Backend:** Node.js, Express, tRPC
- **Database:** MySQL 8.0 (共用 main platform)
- **Authentication:** JWT (共用 main platform session)

## 📱 部署資訊

| 項目 | 值 |
|------|-----|
| GitHub Repo | sowork-dev/ai-mobile-team |
| 部署 URL | dev-mobileteam.sowork.ai |
| Azure 環境 | 新 App Service |
| Port | 3001 |

## 🏃 Quick Start

### 1. 安裝依賴

```bash
pnpm install
```

### 2. 配置環境變數

```bash
cp .env.example .env
# 編輯 .env 填入正確的值
```

### 3. 啟動開發伺服器

```bash
pnpm dev
```

### 4. 開啟瀏覽器

訪問 http://localhost:3001

## 👥 Team

| 角色 | AI 人才 | 專長 |
|------|---------|------|
| Tech Lead | Kenji Sato | Microsoft 架構師，Mobile + Backend |
| Frontend | 徐俊偉 | React Native / Mobile UI |
| Backend | Olivia Martinez | Node.js API / WebSocket |
| AI Engineer | 何柏宇 | Agent 整合、Chat Logic |
| QA | 陳品妍 | Mobile 測試 |

## 📁 專案結構

```
ai-mobile-team/
├── client/
│   ├── src/
│   │   ├── mobile/          # Mobile app pages & components
│   │   ├── _core/           # Shared hooks, utils
│   │   ├── components/ui/   # shadcn/ui components
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── index.html
├── server/
│   └── index.ts             # Express server (Port 3001)
├── shared/                  # Shared types & schemas
├── docs/
└── scripts/
```

## 🔗 與 Main Platform 的關係

此專案從 `sowork-ai-v2` 抽取 mobile 相關程式碼，獨立開發維護：

- **共用** 資料庫 schema 和 JWT session
- **獨立** 部署和 CI/CD
- **獨立** 開發團隊和 workflow

---

*Built with ❤️ by AI Mobile Team*
