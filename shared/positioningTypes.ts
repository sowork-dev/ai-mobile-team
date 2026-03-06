/**
 * 標語資料結構
 */
export interface Tagline {
  english: string;
  chinese: string;
  sixStepValidation?: any; // SixStepValidationResult
  validationPassed?: boolean;
  validationReason?: string;
  aPassed?: boolean; // A 壓力測試是否通過
  bgPassedCount?: number; // B-G 通過數量
  bgPassedItems?: string[]; // B-G 通過的項目
}

/**
 * 定位方案資料結構 (品牌)
 */
export interface BrandPositioningPlan {
  id: number;
  name: string;
  
  // 一組標語 (英文 + 用戶語言)
  tagline: Tagline;
  
  // 黃金圈
  goldenCircle: {
    why: string;
    how: string;
    what: string;
  };
  
  // 品牌故事
  brandStory: string;
  hashtag: string;
  brandWhy: string;
  usp: string;
  
  // 獨佔性分析
  exclusivity: {
    reason: string;
    competitorAnalysis: Array<{
      competitor: string;
      analysis: string;
    }>;
  };
  
  // 定位資訊
  positioning: {
    targetAudience: string;
    needScenario: string;
    brandPosition: string;
    coreValue: string;
    uniqueness: string;
    vsCompetitor: string;
  };
  
  // 訊息架構
  messageArchitecture: {
    brandPromise: string;
    brandValue: string;
    proofPoints: string;
  };
  
  // 優劣勢
  strengths: string[];
  weaknesses: string[];
  
  // 驗證資訊
  validationRetries?: number;
}

/**
 * 定位方案資料結構 (系列)
 */
export interface SeriesPositioningPlan {
  id: number;
  name: string;
  
  // 一組標語 (英文 + 用戶語言)
  tagline: Tagline;
  
  // 定位資訊
  positioning: {
    targetAudience: string;
    needScenario: string;
    seriesPosition: string;
    coreValue: string;
    uniqueness: string;
    vsCompetitor: string;
  };
  
  // 系列特色
  features: string[];
  benefits: string[];
  
  // 驗證資訊
  validationRetries?: number;
}

/**
 * 定位方案資料結構 (產品)
 */
export interface ProductPositioningPlan {
  id: number;
  name: string;
  valueElement: string;
  
  // 一組標語 (英文 + 用戶語言)
  tagline: Tagline;
  
  // 定位陳述
  positioningStatement: string;
  
  // 黃金圈
  goldenCircle: {
    why: string;
    how: string;
    what: string;
  };
  
  // 定位資訊
  positioning: {
    targetAudience: string;
    keyBenefit: string;
    reasonToBelieve: string;
    differentiation: string;
  };
  
  // JTBD 對應
  jtbdAlignment: {
    functionalJob: string;
    emotionalJob: string;
    socialJob: string;
  };
  
  // 競爭分析
  competitiveAnalysis: {
    alternatives: string[];
    advantages: string[];
    positioning: string;
  };
  
  // 驗證資訊
  validationRetries?: number;
}
