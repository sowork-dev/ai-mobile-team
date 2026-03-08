# Target Customers - $100M ARR 路徑

## 營收目標拆解

**目標：$100M ARR**

| 客戶類型 | ACV (年合約) | 需要客戶數 | 營收佔比 |
|----------|-------------|-----------|---------|
| Enterprise (500K+) | $500K | 100 | $50M (50%) |
| Mid-Market (100K+) | $150K | 200 | $30M (30%) |
| Growth (50K+) | $50K | 400 | $20M (20%) |

---

## 🎯 五大目標客戶 Persona

### 1. 🏢 全球 4A 廣告集團
**代表客戶：WPP / Publicis / Omnicom / IPG / Dentsu**

| 項目 | 內容 |
|------|------|
| 痛點 | 創意人員成本高、全球24hr服務需求、pitch效率 |
| 決策者 | Global Chief Digital Officer |
| 預算來源 | 數位轉型預算 / Agency Tech Stack |
| ACV 潛力 | $500K - $2M/年 |
| 為何買單 | 每個 AI Agent = 省一個資深創意總監 |

**Demo 客戶設定：**
```json
{
  "company": "GroupM Digital",
  "industry": "廣告集團",
  "teamSize": 2500,
  "challenge": "全球品牌客戶要求 24hr 即時響應，但創意人員分布不均",
  "budget": "$2M/年數位轉型",
  "decisionMaker": "Sarah Chen, Global CDO"
}
```

---

### 2. 🌍 國際品牌 CMO 辦公室
**代表客戶：Nike / P&G / Unilever / L'Oréal / Coca-Cola**

| 項目 | 內容 |
|------|------|
| 痛點 | In-house agency 成本高、全球市場在地化 |
| 決策者 | Global CMO / VP Marketing |
| 預算來源 | Marketing Tech / Brand Building |
| ACV 潛力 | $300K - $1M/年 |
| 為何買單 | AI團隊可同時處理50+市場的在地化內容 |

**Demo 客戶設定：**
```json
{
  "company": "L'Oréal Asia Pacific",
  "industry": "美妝集團",
  "teamSize": 800,
  "challenge": "12個亞太市場，每個需要在地化內容，速度趕不上社群節奏",
  "budget": "$800K/年 MarTech",
  "decisionMaker": "Michelle Liu, VP Digital Marketing APAC"
}
```

---

### 3. 📊 頂級管理顧問公司
**代表客戶：McKinsey / BCG / Bain / Accenture**

| 項目 | 內容 |
|------|------|
| 痛點 | 顧問每小時 $500+，但很多任務可自動化 |
| 決策者 | Partner / Digital Practice Lead |
| 預算來源 | 客戶專案費用 / 內部效率提升 |
| ACV 潛力 | $200K - $500K/年 |
| 為何買單 | 讓資深顧問專注高價值策略，AI處理執行層 |

**Demo 客戶設定：**
```json
{
  "company": "Boston Consulting Group - Taipei",
  "industry": "管理顧問",
  "teamSize": 150,
  "challenge": "提案品質要求高但時間壓力大，初級顧問產出不穩定",
  "budget": "$300K/年 AI Tools",
  "decisionMaker": "David Wang, Managing Partner"
}
```

---

### 4. 💰 私募/創投基金
**代表客戶：Sequoia / a16z / Blackstone / KKR / Hillhouse**

| 項目 | 內容 |
|------|------|
| 痛點 | 投資組合公司需要GTM支援、Due Diligence報告 |
| 決策者 | Operating Partner / Platform Team Lead |
| 預算來源 | Management Fee / Portfolio Services |
| ACV 潛力 | $200K - $400K/年 |
| 為何買單 | Portfolio公司GTM加速 = 投資報酬率提升 |

**Demo 客戶設定：**
```json
{
  "company": "Hillhouse Capital",
  "industry": "私募基金",
  "teamSize": 200,
  "challenge": "50+投資組合公司都需要品牌行銷支援，但Platform Team只有10人",
  "budget": "$500K/年 Portfolio Services",
  "decisionMaker": "Kevin Lin, Operating Partner"
}
```

---

### 5. 🚀 跨國科技公司內部行銷
**代表客戶：Microsoft / Amazon / Salesforce / SAP**

| 項目 | 內容 |
|------|------|
| 痛點 | 產品線太多、區域行銷團隊人力不足 |
| 決策者 | Regional Marketing Director |
| 預算來源 | Marketing Operations / Sales Enablement |
| ACV 潛力 | $300K - $800K/年 |
| 為何買單 | AI團隊可覆蓋所有產品線的內容產出 |

**Demo 客戶設定：**
```json
{
  "company": "Microsoft Taiwan",
  "industry": "科技",
  "teamSize": 500,
  "challenge": "Azure, M365, Dynamics, Power Platform... 每條產品線都需要行銷內容",
  "budget": "$600K/年 Regional Marketing",
  "decisionMaker": "Jennifer Wu, Marketing Director Taiwan"
}
```

---

## 🧪 Demo 測試計畫

每個客戶 Persona 需要完整測試以下流程：

1. **登入 → 幕僚長對話** - 了解客戶背景
2. **組建 AI 團隊** - 根據產業推薦團隊組合
3. **派發任務** - 符合該產業的典型任務
4. **產出審核** - 檢視 AI 團隊產出品質
5. **匯出定位書** - Word/PPT 格式

---

## 實作優先序

1. 先在 DB 建立 5 個 demo company + user
2. 每個公司有預設的 AI 團隊建議
3. 每個公司有 3-5 個典型任務範例
4. 幕僚長能識別公司背景，給出產業相關建議

---

*Created: 2026-03-08*
*Goal: $100M ARR*
