// 全球化相關常量定義

export interface MarketOption {
  value: string;
  label: string;
  flag: string; // emoji flag
}

export interface LanguageOption {
  value: string;
  label: string;
  nativeName: string;
}

// 目標市場選項
export const TARGET_MARKETS: MarketOption[] = [
  { value: 'Taiwan', label: '台灣', flag: '🇹🇼' },
  { value: 'USA', label: '美國', flag: '🇺🇸' },
  { value: 'China', label: '中國', flag: '🇨🇳' },
  { value: 'Japan', label: '日本', flag: '🇯🇵' },
  { value: 'South Korea', label: '韓國', flag: '🇰🇷' },
  { value: 'Singapore', label: '新加坡', flag: '🇸🇬' },
  { value: 'Hong Kong', label: '香港', flag: '🇭🇰' },
  { value: 'UK', label: '英國', flag: '🇬🇧' },
  { value: 'Germany', label: '德國', flag: '🇩🇪' },
  { value: 'France', label: '法國', flag: '🇫🇷' },
  { value: 'Australia', label: '澳洲', flag: '🇦🇺' },
  { value: 'Canada', label: '加拿大', flag: '🇨🇦' },
  { value: 'Other', label: '其他', flag: '🌍' },
];

// 內容語言選項（每個市場有對應的專屬語言代碼）
export const CONTENT_LANGUAGES: LanguageOption[] = [
  { value: 'zh-TW', label: '繁體中文（台灣）', nativeName: '繁體中文' },
  { value: 'zh-HK', label: '繁體中文（香港）', nativeName: '繁體中文（香港）' },
  { value: 'zh-CN', label: '簡體中文', nativeName: '简体中文' },
  { value: 'en-US', label: '英文（美國）', nativeName: 'English (US)' },
  { value: 'en-GB', label: '英文（英國）', nativeName: 'English (UK)' },
  { value: 'en-SG', label: '英文（新加坡）', nativeName: 'English (Singapore)' },
  { value: 'en-AU', label: '英文（澳洲）', nativeName: 'English (Australia)' },
  { value: 'en-CA', label: '英文（加拿大）', nativeName: 'English (Canada)' },
  { value: 'ja-JP', label: '日文', nativeName: '日本語' },
  { value: 'ko-KR', label: '韓文', nativeName: '한국어' },
  { value: 'de-DE', label: '德文', nativeName: 'Deutsch' },
  { value: 'fr-FR', label: '法文', nativeName: 'Français' },
  { value: 'es-ES', label: '西班牙文', nativeName: 'Español' },
  { value: 'pt-BR', label: '葡萄牙文（巴西）', nativeName: 'Português (BR)' },
  { value: 'it-IT', label: '義大利文', nativeName: 'Italiano' },
  { value: 'ru-RU', label: '俄文', nativeName: 'Русский' },
];

// 根據市場推薦語言（每個市場有最適合的語言代碼，反映當地文化特色）
export const MARKET_TO_LANGUAGE_MAP: Record<string, string> = {
  'Taiwan': 'zh-TW',       // 台灣繁體中文
  'USA': 'en-US',          // 美式英文
  'China': 'zh-CN',        // 簡體中文
  'Japan': 'ja-JP',        // 日文
  'South Korea': 'ko-KR',  // 韓文
  'Singapore': 'en-SG',    // 新加坡英文（多元文化，非美式）
  'Hong Kong': 'zh-HK',    // 香港繁體中文（粵語語感，有別於台灣）
  'UK': 'en-GB',           // 英式英文
  'Germany': 'de-DE',      // 德文
  'France': 'fr-FR',       // 法文
  'Australia': 'en-AU',    // 澳洲英文（輕鬆、直接）
  'Canada': 'en-CA',       // 加拿大英文（雙語包容）
  'Other': 'en-US',
};

// 獲取市場的顯示名稱（帶 flag）
export function getMarketDisplay(market: string): string {
  const option = TARGET_MARKETS.find(m => m.value === market);
  return option ? `${option.flag} ${option.label}` : market;
}

// 獲取語言的顯示名稱
export function getLanguageDisplay(language: string): string {
  const option = CONTENT_LANGUAGES.find(l => l.value === language);
  return option ? option.label : language;
}

// 根據市場推薦語言
export function getRecommendedLanguage(market: string): string {
  return MARKET_TO_LANGUAGE_MAP[market] || 'en-US';
}

// 雙語市場配置：定義哪些市場支援多語言切換，以及各模式的語言代碼
// bilingual = 中英並行（目標市場語言），chinese = 純中文，english = 純英文
export interface BilingualMarketConfig {
  isBilingual: true;
  bilingual: string;   // 中英並行模式（目標市場語言，如 zh-HK、en-SG）
  chinese: string;     // 純中文模式
  english: string;     // 純英文模式
}
export interface MonolingualMarketConfig {
  isBilingual: false;
}
export type MarketLanguageConfig = BilingualMarketConfig | MonolingualMarketConfig;

// 雙語市場清單（以目標市場語言代碼為 key）
export const BILINGUAL_MARKET_CONFIGS: Record<string, BilingualMarketConfig> = {
  // 香港：粵語/繁中 + 英文，習慣中英夾雜
  'zh-HK': { isBilingual: true, bilingual: 'zh-HK', chinese: 'zh-TW', english: 'en-GB' },
  // 新加坡：英文為主，但華人市場有中文需求
  'en-SG': { isBilingual: true, bilingual: 'en-SG', chinese: 'zh-TW', english: 'en-SG' },
  // 加拿大：英法雙語，英文為主
  'en-CA': { isBilingual: true, bilingual: 'en-CA', chinese: 'zh-TW', english: 'en-CA' },
};

// 判斷某語言代碼是否為雙語市場
export function getBilingualConfig(contentLanguage: string): BilingualMarketConfig | null {
  return BILINGUAL_MARKET_CONFIGS[contentLanguage] || null;
}
