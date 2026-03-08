/**
 * 示範用品牌定位方案數據
 * 用於 Demo 模式下展示高品質定位書匯出功能
 */
import type { PositioningPlan } from "../../../shared/brandPositioningTypes";

/**
 * BCG 顧客示範定位方案：AI 企業效能平台
 */
export const samplePositioningPlan: PositioningPlan = {
  title: "情緒共鳴導向定位方案",
  emotionalValueSlogan: {
    chinese: "讓每一位顧問，都有 AI 作為後盾",
    english: "Every Consultant, Backed by Intelligence",
    validation: {
      passed: true,
      totalScore: 88,
      details: {
        exclusivity: 9,
        memorability: 9,
        attitude: 8,
        rhythm: 9,
        emotionalTension: 9,
        contrastStructure: 8,
        totalScore: 88,
        passed: true,
      },
    },
  },
  functionalValueSlogan: {
    chinese: "AI 旗艦隊——顧問業的智慧引擎",
    english: "AI Flagship — The Intelligence Engine for Consulting",
    validation: {
      passed: true,
      totalScore: 82,
      details: {
        exclusivity: 8,
        memorability: 8,
        attitude: 9,
        rhythm: 8,
        emotionalTension: 8,
        contrastStructure: 9,
        totalScore: 82,
        passed: true,
      },
    },
  },
  reasoning: {
    targetAudience: {
      title: "目標受眾：頂尖顧問公司的決策層",
      summary: "鎖定大型顧問公司的合夥人與管理總監，他們需要更快速、更精準的洞察輸出。",
      content:
        "核心受眾為頂尖管理顧問公司（BCG、Bain、McKinsey）的管理層，年齡層 35–55 歲，負責交付物品質與客戶關係管理。他們面臨交付週期縮短、客戶期望提升的雙重壓力，需要在維持顧問專業形象的同時提升產能效率。",
      details: {
        ageRange: "35–55 歲",
        characteristics: [
          "MBA 或頂尖大學背景，分析思維主導",
          "高度重視「顧問感」與交付物的視覺品質",
          "負責 2–5 個併行專案，時間極度壓縮",
          "對 AI 工具持謹慎態度，重視可控性與可解釋性",
        ],
        painPoints: [
          "資深顧問人力成本高昂，初級顧問品質參差不齊",
          "PPT 製作與數據整理耗費大量高價值時間",
          "客戶要求更快速的洞察迭代，傳統流程難以應對",
          "新工具導入後的學習曲線影響短期交付",
        ],
        motivations: [
          "在不犧牲品質的前提下提升 2–3 倍輸出量",
          "讓資深顧問聚焦高附加值的策略思考",
          "透過 AI 強化競爭差異，吸引更大型專案",
          "降低對初級顧問的依賴，提升利潤率",
        ],
      },
    },
    marketGap: {
      title: "市場空白：顧問工具市場缺乏「交付物級別」的 AI 解決方案",
      summary: "現有 AI 工具關注資訊整理，但缺乏能直接輸出顧問級交付物的整合平台。",
      content:
        "顧問業的 AI 工具市場目前分為兩個極端：通用型 LLM 工具（ChatGPT、Claude）適合思考輔助但不懂顧問語言；垂直工具（如 PitchBook、AlphaSense）專注於數據但缺乏整合輸出能力。市場缺乏一個能理解顧問業工作流程、直接輸出 BCG 水準交付物的 AI 平台。",
      details: {
        gapDescription:
          "沒有任何現有工具能在一個平台內完成：市場研究 → 競品分析 → 洞察生成 → 顧問級 PPT 輸出的完整鏈路。",
        competitorAnalysis: [
          "ChatGPT/Claude：通用強、垂直弱，輸出物需大量人工潤色才能符合顧問標準",
          "Notion AI / Otter：協作工具定位，非顧問交付物生成",
          "PitchBook / CB Insights：數據豐富但無法自動整合為顧問投影片",
          "Harvey AI：法律垂直 AI，顯示垂直 AI 的市場空間巨大",
        ],
        opportunity:
          "打造顧問業的「Apple 時刻」——一個整合研究、分析、輸出的端到端 AI 顧問平台，讓顧問工作從 80% 執行 + 20% 思考，翻轉為 20% 執行 + 80% 策略。",
      },
    },
    brandAdvantage: {
      title: "品牌核心優勢：深度垂直整合 × 顧問語言理解",
      summary: "AI 旗艦隊深度理解顧問業工作流，能直接輸出 BCG/McKinsey 水準的交付物，而非僅提供資訊整理。",
      content:
        "AI 旗艦隊的核心差異在於「交付物思維」——我們的 AI Agent 不只是資訊處理器，而是深度理解 MECE 框架、顧問敘事結構、投影片視覺語言的專業夥伴。每個 Agent 均以資深顧問的工作標準訓練，輸出物可直接用於客戶簡報。",
      details: {
        coreStrengths: [
          "顧問交付物訓練語料：以 10,000+ 份頂尖顧問公司報告訓練",
          "多 Agent 協作架構：研究、分析、撰寫、視覺化 Agent 無縫協作",
          "品牌定位引擎：獨有六步驟標語驗證框架，確保品牌訊息品質",
          "即時匯出：PPTX/DOCX 格式直接符合顧問公司視覺標準",
        ],
        differentiators: [
          "唯一專注顧問業交付物品質的 AI 平台",
          "不需要 prompt engineering，對話式啟動即可輸出高品質成果",
          "數據與洞察一體化，減少在不同工具間切換的摩擦",
        ],
        brandAssets: [
          "AI Agent 人格化設計：Alex、Maya、Ryan、Lena 等專業 AI 員工",
          "六步驟品牌定位驗證框架（專利申請中）",
          "頂尖顧問公司種子客戶背書",
        ],
      },
    },
    brandPersonality: {
      title: "品牌個性：精準·賦能·夥伴",
      summary: "AI 旗艦隊不是冷冰冰的工具，而是每位顧問最信賴的高智商工作夥伴。",
      content:
        "品牌個性融合「精英顧問的嚴謹」與「科技新創的敏捷」——我們像一位既有 McKinsey 思維訓練、又具備 Y Combinator 創新精神的同事。溝通語調直接、有洞察力，不說廢話，每一句話都有實質意義。",
      details: {
        archetype: "智者 × 夥伴（Sage × Ally）",
        traits: [
          "精準",
          "賦能",
          "洞察",
          "可信賴",
          "前瞻",
          "高效",
        ],
        tone: "直接、有洞察力、具顧問感但不失溫度",
        attitude: "我們不炫耀技術，我們展示成果——為你的成功而存在",
      },
    },
    tagline: {
      title: "標語開發：從情緒共鳴到功能價值的雙軌策略",
      summary: "雙版本標語策略，覆蓋情緒決策者與理性分析者兩種客戶類型。",
      content:
        "頂尖顧問公司的採購決策融合理性評估與情緒共鳴。情緒版標語建立品牌信任感，功能版標語強化ROI說服力，兩者互補形成完整的品牌訊息架構。",
      versionA: {
        chineseTagline: "讓每一位顧問，都有 AI 作為後盾",
        englishTagline: "Every Consultant, Backed by Intelligence",
        focus: "強調「個人賦能」的情緒共鳴——每位顧問都能感受到 AI 為自己打仗，而非取代自己",
        sixStepValidation: {
          exclusivity: 9,
          memorability: 9,
          attitude: 8,
          rhythm: 9,
          emotionalTension: 9,
          contrastStructure: 8,
          totalScore: 88,
          passed: true,
          reason: "標語獨特性強，情緒張力高，節奏流暢，能快速建立情感連結",
        },
        validationPassed: true,
        validationReason: "通過六步驟驗證，總分 88/100",
      },
      versionB: {
        chineseTagline: "AI 旗艦隊——顧問業的智慧引擎",
        englishTagline: "AI Flagship — The Intelligence Engine for Consulting",
        focus: "強調「平台定位」的功能價值——清楚傳達產品是顧問業專屬的 AI 引擎",
        sixStepValidation: {
          exclusivity: 8,
          memorability: 8,
          attitude: 9,
          rhythm: 8,
          emotionalTension: 8,
          contrastStructure: 9,
          totalScore: 82,
          passed: true,
          reason: "功能定位清晰，專業感強，適合 B2B 理性採購決策情境",
        },
        validationPassed: true,
        validationReason: "通過六步驟驗證，總分 82/100",
      },
    },
  },
};

/**
 * 根據 Persona ID 取得對應的品牌名稱和定位方案
 */
export function getSampleBrandData(personaId: string): { brandName: string; plan: PositioningPlan } {
  const brandMap: Record<string, string> = {
    "groupm-digital": "GroupM Digital",
    "loreal-asia": "L'Oréal Asia Pacific",
    "bcg-taipei": "Boston Consulting Group",
    "hillhouse-capital": "Hillhouse Capital",
    "microsoft-taiwan": "Microsoft Taiwan",
  };

  return {
    brandName: brandMap[personaId] || "品牌定位示範",
    plan: samplePositioningPlan,
  };
}
