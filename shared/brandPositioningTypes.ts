/**
 * 品牌定位分析數據契約
 * 
 * 這個文件定義了品牌定位分析流程中所有數據結構的 TypeScript 類型定義，
 * 確保後端生成、數據庫存儲、前端讀取的數據結構完全一致。
 */

// ==================== 標語驗證結果 ====================

/**
 * 六步驟驗證結果
 */
export interface SixStepValidation {
  /** 獨佔性評分 (0-10) */
  exclusivity: number;
  /** 記憶點評分 (0-10) */
  memorability: number;
  /** 態度評分 (0-10) */
  attitude: number;
  /** 節奏感評分 (0-10) */
  rhythm: number;
  /** 情緒張力評分 (0-10) */
  emotionalTension: number;
  /** 對比結構評分 (0-10) */
  contrastStructure: number;
  /** 總分 (0-100) */
  totalScore: number;
  /** 是否通過驗證 */
  passed: boolean;
  /** 驗證理由 */
  reason?: string;
  /** 詳細評分說明 */
  details?: {
    exclusivity?: string;
    memorability?: string;
    attitude?: string;
    rhythm?: string;
    emotionalTension?: string;
    contrastStructure?: string;
  };
}

/**
 * 標語驗證結果（簡化版）
 */
export interface TaglineValidation {
  /** 是否通過驗證 */
  passed: boolean;
  /** 總分 (0-100) */
  totalScore: number;
  /** 詳細驗證結果 */
  details: SixStepValidation;
}

// ==================== 標語數據結構 ====================

/**
 * 標語（中英文雙語）
 */
export interface Tagline {
  /** 中文標語 */
  chinese: string;
  /** 英文標語 */
  english: string;
  /** 驗證結果 */
  validation: TaglineValidation;
}

// ==================== 定位方案數據結構 ====================

/**
 * 推論敘事流 - 目標受眾
 */
export interface ReasoningTargetAudience {
  /** 標題 */
  title: string;
  /** 摘要（15-25字） */
  summary: string;
  /** 內容（50-80字） */
  content: string;
  /** 詳細資訊 */
  details: {
    /** 年齡範圍 */
    ageRange?: string;
    /** 特徵列表 */
    characteristics?: string[];
    /** 痛點列表 */
    painPoints?: string[];
    /** 動機列表 */
    motivations?: string[];
  };
}

/**
 * 推論敘事流 - 市場空白
 */
export interface ReasoningMarketGap {
  /** 標題 */
  title: string;
  /** 摘要（15-25字） */
  summary: string;
  /** 內容（50-80字） */
  content: string;
  /** 詳細資訊 */
  details: {
    /** 市場空白描述 */
    gapDescription?: string;
    /** 競品分析 */
    competitorAnalysis?: string[];
    /** 機會點 */
    opportunity?: string;
  };
}

/**
 * 推論敘事流 - 品牌優勢
 */
export interface ReasoningBrandAdvantage {
  /** 標題 */
  title: string;
  /** 摘要（15-25字） */
  summary: string;
  /** 內容（50-80字） */
  content: string;
  /** 詳細資訊 */
  details: {
    /** 核心優勢列表 */
    coreStrengths?: string[];
    /** 差異化因素列表 */
    differentiators?: string[];
    /** 品牌資產列表 */
    brandAssets?: string[];
  };
}

/**
 * 推論敘事流 - 品牌個性
 */
export interface ReasoningBrandPersonality {
  /** 標題 */
  title: string;
  /** 摘要（15-25字） */
  summary: string;
  /** 內容（50-80字） */
  content: string;
  /** 詳細資訊 */
  details: {
    /** 品牌原型 */
    archetype?: string;
    /** 個性特質列表 */
    traits?: string[];
    /** 溝通語調 */
    tone?: string;
    /** 溝通態度 */
    attitude?: string;
  };
}

/**
 * 推論敘事流 - 標語
 */
export interface ReasoningTagline {
  /** 標題 */
  title: string;
  /** 摘要（15-25字） */
  summary: string;
  /** 內容（50-80字） */
  content: string;
  /** 版本 A：情緒價值導向 */
  versionA: {
    /** 英文標語 */
    englishTagline: string;
    /** 中文標語 */
    chineseTagline: string;
    /** 焦點（情緒價值導向） */
    focus: string;
    /** 六步驟驗證結果 */
    sixStepValidation?: SixStepValidation;
    /** 是否通過驗證 */
    validationPassed?: boolean;
    /** 驗證理由 */
    validationReason?: string;
  };
  /** 版本 B：功能加值導向 */
  versionB: {
    /** 英文標語 */
    englishTagline: string;
    /** 中文標語 */
    chineseTagline: string;
    /** 焦點（功能加值導向） */
    focus: string;
    /** 六步驟驗證結果 */
    sixStepValidation?: SixStepValidation;
    /** 是否通過驗證 */
    validationPassed?: boolean;
    /** 驗證理由 */
    validationReason?: string;
  };
}

/**
 * 推論敘事流（完整）
 */
export interface ReasoningFlow {
  /** 目標受眾 */
  targetAudience: ReasoningTargetAudience;
  /** 市場空白 */
  marketGap: ReasoningMarketGap;
  /** 品牌優勢 */
  brandAdvantage: ReasoningBrandAdvantage;
  /** 品牌個性 */
  brandPersonality: ReasoningBrandPersonality;
  /** 標語 */
  tagline: ReasoningTagline;
}

/**
 * 定位方案（前端期望的數據結構）
 */
export interface PositioningPlan {
  /** 方案標題 */
  title: string;
  /** 推論敘事流 */
  reasoning: ReasoningFlow;
  /** 情緒價值導向標語（提升到頂層，方便前端訪問） */
  emotionalValueSlogan: Tagline;
  /** 功能加值導向標語（提升到頂層，方便前端訪問） */
  functionalValueSlogan: Tagline;
  /** 版本 A 標語（原始數據，保留用於兼容） */
  taglineVersionA?: any;
  /** 版本 B 標語（原始數據，保留用於兼容） */
  taglineVersionB?: any;
}

// ==================== 十步驟分析數據結構 ====================

/**
 * 步驟 1：深層動機（5 Whys 分析）
 */
export interface Step1DeepMotivation {
  /** 創立動機 */
  foundingWhy?: string;
  /** 情緒驅動 */
  emotionalDrivers?: string[];
  /** 核心信念 */
  coreBeliefs?: string[];
  /** 5 Whys 分析結果 */
  fiveWhys?: string[];
}

/**
 * 步驟 2：情緒價值元素
 */
export interface Step2EmotionalValues {
  /** 情緒價值元素列表 */
  emotionalValues?: Array<{
    /** 元素名稱 */
    name: string;
    /** 元素描述 */
    description: string;
    /** 相關情緒 */
    emotions?: string[];
  }>;
}

/**
 * 步驟 3：品牌評分
 */
export interface Step3BrandScores {
  /** 品牌評分結果 */
  brandScores?: {
    /** 優勢列表 */
    strengths?: string[];
    /** 劣勢列表 */
    weaknesses?: string[];
    /** 總分 */
    totalScore?: number;
  };
}

/**
 * 步驟 4：競爭品牌識別
 */
export interface Step4Competition {
  /** 直接競品列表 */
  directCompetitors?: Array<{
    /** 品牌名稱 */
    name: string;
    /** 品牌描述 */
    description?: string;
  }>;
}

/**
 * 步驟 5：競品評分
 */
export interface Step5CompetitorScores {
  /** 競品評分結果 */
  competitors?: Array<{
    /** 品牌名稱 */
    name: string;
    /** 評分 */
    score?: number;
    /** 優勢 */
    strengths?: string[];
    /** 劣勢 */
    weaknesses?: string[];
  }>;
  /** 市場空白分析 */
  marketGapAnalysis?: string;
}

/**
 * 步驟 6：目標族群定義
 */
export interface Step6TargetAudience {
  /** 目標受眾列表 */
  targetAudiences?: Array<{
    /** 族群名稱 */
    name: string;
    /** 族群描述 */
    description?: string;
    /** 年齡範圍 */
    ageRange?: string;
  }>;
}

/**
 * 步驟 7：TA Gain/Pain Points
 */
export interface Step7AudienceResearch {
  /** 受眾研究結果 */
  audiences?: Array<{
    /** 族群名稱 */
    name: string;
    /** 痛點列表 */
    painPoints?: string[];
    /** 收穫點列表 */
    gainPoints?: string[];
  }>;
}

/**
 * 步驟 8：TA 情緒價值評分
 */
export interface Step8AudienceScores {
  /** 受眾評分結果 */
  audiences?: Array<{
    /** 族群名稱 */
    name: string;
    /** 情緒價值評分 */
    emotionalValueScores?: Record<string, number>;
  }>;
}

/**
 * 步驟 9：定位矩陣
 */
export interface Step9PositioningMatrix {
  /** 差異化維度列表 */
  differentiationDimensions?: string[];
  /** 核心價值主張 */
  coreValueProposition?: string;
}

/**
 * 步驟 10：標語開發
 */
export interface Step10Taglines {
  /** 標語創意引擎輸出 */
  taglineCreativeOutput?: {
    /** 品牌氣質方向列表 */
    directions?: Array<{
      /** 方向名稱 */
      name: string;
      /** 方向描述 */
      description: string;
      /** 關鍵詞列表 */
      keywords?: string[];
    }>;
    /** 所有標語列表 */
    allSlogans?: Array<{
      /** 中文標語 */
      chinese: string;
      /** 英文標語 */
      english: string;
      /** 所屬方向 */
      direction: string;
    }>;
    /** 最佳標語列表（8-12 條） */
    topSlogans?: Array<{
      /** 中文標語 */
      chinese: string;
      /** 英文標語 */
      english: string;
      /** 評分 */
      score: number;
    }>;
    /** 生成時間 */
    generatedAt?: string;
  };
}

/**
 * 步驟 10.5：品牌個性分析
 */
export interface Step10_5BrandPersonality {
  /** 品牌個性分析結果 */
  brandPersonality?: {
    /** 品牌原型 */
    archetype?: string;
    /** 個性特質列表 */
    traits?: string[];
    /** 溝通語調 */
    tone?: string;
    /** 溝通態度 */
    attitude?: string;
  };
}

/**
 * 完整的十步驟分析數據
 */
export interface AnalysisData {
  /** 步驟 1：深層動機 */
  step1?: Step1DeepMotivation;
  /** 步驟 2：情緒價值元素 */
  step2?: Step2EmotionalValues;
  /** 步驟 3：品牌評分 */
  step3?: Step3BrandScores;
  /** 步驟 4：競爭品牌識別 */
  step4?: Step4Competition;
  /** 步驟 5：競品評分 */
  step5?: Step5CompetitorScores;
  /** 步驟 6：目標族群定義 */
  step6?: Step6TargetAudience;
  /** 步驟 7：TA Gain/Pain Points */
  step7?: Step7AudienceResearch;
  /** 步驟 8：TA 情緒價值評分 */
  step8?: Step8AudienceScores;
  /** 步驟 9：定位矩陣 */
  step9?: Step9PositioningMatrix;
  /** 步驟 10：標語開發 */
  step10?: Step10Taglines;
  /** 步驟 10.5：品牌個性分析 */
  'step10.5'?: Step10_5BrandPersonality;
}

// ==================== API 返回數據結構 ====================

/**
 * brand.getReasoningFlow API 返回的數據結構
 */
export interface BrandReasoningFlowResponse {
  /** 品牌基本信息 */
  brand: {
    /** 品牌名稱 */
    name: string;
    /** 產業 */
    industry: string;
    /** 品牌描述 */
    description: string;
  };
  /** 十步驟分析數據 */
  analysisSteps: AnalysisData;
  /** 定位方案列表（2 個方案） */
  positioningPlans: PositioningPlan[];
}

// ==================== 類型守衛函數 ====================

/**
 * 檢查對象是否為有效的 PositioningPlan
 */
export function isValidPositioningPlan(obj: any): obj is PositioningPlan {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.title === 'string' &&
    obj.emotionalValueSlogan &&
    typeof obj.emotionalValueSlogan.chinese === 'string' &&
    obj.functionalValueSlogan &&
    typeof obj.functionalValueSlogan.chinese === 'string'
  );
}

/**
 * 檢查對象是否為有效的 AnalysisData
 */
export function isValidAnalysisData(obj: any): obj is AnalysisData {
  return obj && typeof obj === 'object';
}

/**
 * 檢查對象是否為有效的 BrandReasoningFlowResponse
 */
export function isValidBrandReasoningFlowResponse(obj: any): obj is BrandReasoningFlowResponse {
  return (
    obj &&
    typeof obj === 'object' &&
    obj.brand &&
    typeof obj.brand.name === 'string' &&
    obj.analysisSteps &&
    Array.isArray(obj.positioningPlans)
  );
}
