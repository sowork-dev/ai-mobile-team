/**
 * 推論敘事流和方案混搭工作台的數據結構定義
 * 
 * 這些類型定義了系列定位分析的結構化數據格式，支持：
 * 1. 推論敘事流的每個步驟
 * 2. 詞組拆解和語義標註
 * 3. 方案融合和元素追溯
 */

/**
 * 推論步驟的基礎結構
 */
export interface ReasoningStepBase {
  title: string;           // 敘事標題，例如："我們分析了「認真業餘愛好者」這個目標族群"
  summary: string;         // 簡短摘要
  source: 'ai_generated' | 'user_modified' | 'fusion';  // 來源標記
}

/**
 * 目標受眾分析
 */
export interface TargetAudienceReasoning extends ReasoningStepBase {
  details: {
    ageRange?: string;                // 年齡範圍
    characteristics: string[];        // 特徵列表
    painPoints: string[];             // 痛點列表
    motivations: string[];            // 動機列表
    psychographics?: string;          // 心理特徵
  };
}

/**
 * 市場空白點分析
 */
export interface MarketGapReasoning extends ReasoningStepBase {
  details: {
    gapDescription: string;           // 空白點描述
    competitorAnalysis: Array<{       // 競品分析
      name: string;
      weakness: string;
    }>;
    opportunity: string;              // 機會點
    marketSize?: string;              // 市場規模（可選）
  };
}

/**
 * 詞組標註（用於品牌優勢和標語的拆解）
 */
export interface KeywordPhrase {
  text: string;                       // 詞組文字
  category: 'heritage' | 'quality' | 'innovation' | 'design' | 'emotion' | 'functional';  // 類別
  meaning?: string;                   // 語義解釋
  emotionalAppeal?: string;           // 情感訴求
}

/**
 * 品牌優勢分析
 */
export interface BrandAdvantageReasoning extends ReasoningStepBase {
  details: {
    coreStrengths: string[];          // 核心優勢
    differentiators: string[];        // 差異化要素
    brandAssets: string[];            // 品牌資產
  };
  keywords: KeywordPhrase[];          // 關鍵詞組拆解
}

/**
 * 標語分析
 */
export interface TaglineReasoning extends ReasoningStepBase {
  fullTagline: string;                // 完整標語
  phrases: Array<{                    // 詞組拆解
    text: string;                     // 詞組文字
    meaning: string;                  // 語義解釋
    emotionalAppeal: string;          // 情感訴求
    category: 'heritage' | 'quality' | 'innovation' | 'design' | 'emotion' | 'functional';
  }>;
}

/**
 * 預期效果分析
 */
export interface ExpectedOutcomeReasoning extends ReasoningStepBase {
  details: {
    targetReaction: string;           // 目標受眾反應
    brandImage: string;               // 品牌形象
    marketPosition: string;           // 市場定位
    kpis?: string[];                  // 關鍵績效指標（可選）
  };
}

/**
 * 完整的推論敘事流
 */
export interface ReasoningFlow {
  targetAudience: TargetAudienceReasoning;
  marketGap: MarketGapReasoning;
  brandAdvantage: BrandAdvantageReasoning;
  tagline: TaglineReasoning;
  expectedOutcome: ExpectedOutcomeReasoning;
}

/**
 * 融合方案的元素選擇記錄
 */
export interface FusionElement {
  proposalId: string;                 // 來源方案 ID
  elementType: 'targetAudience' | 'marketGap' | 'brandAdvantage' | 'tagline' | 'expectedOutcome';
  elementPath: string;                // JSON path（用於精確定位）
  selectedAt: string;                 // 選擇時間戳
}

/**
 * 融合方案的元數據
 */
export interface FusionMetadata {
  proposalIds: string[];              // 參與融合的方案 ID 列表
  selectedElements: FusionElement[];  // 選中的元素列表
  fusionRationale?: string;           // 融合理由（AI 生成）
  createdAt: string;                  // 創建時間
}

/**
 * 定位方案評分
 */
export interface ProposalScores {
  overall: number;                    // 總分 (0-100)
  brandFit: number;                   // 品牌契合度 (0-100)
  marketAppeal: number;               // 市場吸引力 (0-100)
  differentiation: number;            // 差異化程度 (0-100)
}

/**
 * 單個定位方案
 */
export interface PositioningProposal {
  id: string;                         // 方案 ID（例如："proposal-A", "proposal-B", "fusion-1"）
  version: number;                    // 版本號
  reasoning: ReasoningFlow;           // 推論敘事流
  scores: ProposalScores;             // 評分
  createdAt: string;                  // 創建時間
  modifiedAt?: string;                // 修改時間
  isUserFusion: boolean;              // 是否為用戶融合方案
  fusionSource?: FusionMetadata;      // 融合來源（如果是融合方案）
}

/**
 * 系列定位分析結果（完整結構）
 */
export interface SeriesAnalysis {
  proposals: PositioningProposal[];   // 所有定位方案（包括 AI 生成和用戶融合）
  metadata: {
    seriesId: number;                 // 系列 ID
    brandId: number;                  // 品牌 ID
    analysisVersion: string;          // 分析版本
    createdAt: string;                // 創建時間
    lastModifiedAt: string;           // 最後修改時間
  };
}

/**
 * 工作台狀態（前端使用）
 */
export interface WorkbenchState {
  selectedElements: Map<string, FusionElement>;  // 已選元素（key: elementType）
  isGenerating: boolean;                         // 是否正在生成融合方案
  fusionProposal?: PositioningProposal;          // 生成的融合方案
}
