/**
 * Web 爬取服務
 * 使用 AI 分析網頁內容，提取品牌和產品資訊
 */
import OpenAI from "openai";

export interface Brand {
  name: string;
  products: string[];
}

export interface CrawlResult {
  success: boolean;
  brands: Brand[];
  companyName?: string;
  industry?: string;
  description?: string;
  error?: string;
}

// 創建 OpenAI 客戶端
function createClient(): OpenAI {
  // 優先使用智譜（無地區限制）
  if (process.env.ZHIPU_API_KEY) {
    return new OpenAI({
      apiKey: process.env.ZHIPU_API_KEY,
      baseURL: "https://open.bigmodel.cn/api/paas/v4",
    });
  }
  // 其次用通義千問
  if (process.env.QIANWEN_API_KEY) {
    return new OpenAI({
      apiKey: process.env.QIANWEN_API_KEY,
      baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    });
  }
  // 最後用 OpenAI
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

function getModelName(): string {
  if (process.env.ZHIPU_API_KEY) return "glm-4-flash";
  if (process.env.QIANWEN_API_KEY) return "qwen-turbo";
  return "gpt-4o-mini";
}

/**
 * 抓取網頁內容
 */
async function fetchWebpage(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SoWorkBot/1.0; +https://sowork.ai)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
      },
      signal: AbortSignal.timeout(15000), // 15 秒超時
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    
    // 簡單清理 HTML，移除腳本和樣式
    const cleanHtml = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")  // 移除標籤
      .replace(/\s+/g, " ")      // 合併空白
      .trim();

    // 限制長度避免 token 過多
    return cleanHtml.slice(0, 15000);
  } catch (error: any) {
    throw new Error(`無法訪問網站: ${error.message}`);
  }
}

/**
 * 使用 AI 分析網頁內容，提取品牌和產品
 */
async function analyzeWithAI(content: string, url: string): Promise<CrawlResult> {
  const client = createClient();
  const model = getModelName();

  const prompt = `分析以下網站內容，提取公司的品牌和產品資訊。

網站: ${url}

網站內容:
${content}

請以 JSON 格式回覆，包含：
1. companyName: 公司名稱
2. industry: 產業類別（如：科技/軟體、電子商務、製造業等）
3. description: 公司簡介（50字以內）
4. brands: 品牌陣列，每個品牌包含 name 和 products（產品名稱陣列）

如果找不到明確的品牌，請根據公司主要業務創建合理的分類。

只回覆 JSON，不要其他文字：
{
  "companyName": "公司名稱",
  "industry": "產業類別",
  "description": "公司簡介",
  "brands": [
    { "name": "品牌1", "products": ["產品A", "產品B"] },
    { "name": "品牌2", "products": ["產品C", "產品D"] }
  ]
}`;

  try {
    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: "你是一個專業的市場分析師，擅長從網站內容中提取公司、品牌和產品資訊。回覆時只輸出 JSON，不要任何額外文字。",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const text = response.choices[0]?.message?.content?.trim() || "";
    
    // 嘗試解析 JSON
    let json: any;
    try {
      // 移除可能的 markdown 標記
      const cleanText = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      json = JSON.parse(cleanText);
    } catch {
      // 嘗試提取 JSON 部分
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        json = JSON.parse(match[0]);
      } else {
        throw new Error("AI 回應格式錯誤");
      }
    }

    return {
      success: true,
      companyName: json.companyName || "",
      industry: json.industry || "",
      description: json.description || "",
      brands: json.brands || [],
    };
  } catch (error: any) {
    console.error("AI 分析錯誤:", error);
    return {
      success: false,
      brands: [],
      error: error.message || "AI 分析失敗",
    };
  }
}

/**
 * 爬取網站並分析品牌產品
 */
export async function crawlWebsite(url: string): Promise<CrawlResult> {
  try {
    // 1. 確保 URL 格式正確
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
      normalizedUrl = "https://" + normalizedUrl;
    }

    // 驗證 URL
    new URL(normalizedUrl);

    console.log(`[WebCrawler] 開始爬取: ${normalizedUrl}`);

    // 2. 抓取網頁內容
    const content = await fetchWebpage(normalizedUrl);
    console.log(`[WebCrawler] 抓取成功，內容長度: ${content.length}`);

    // 3. 使用 AI 分析
    const result = await analyzeWithAI(content, normalizedUrl);
    console.log(`[WebCrawler] 分析完成，找到 ${result.brands.length} 個品牌`);

    return result;
  } catch (error: any) {
    console.error("[WebCrawler] 錯誤:", error);
    return {
      success: false,
      brands: [],
      error: error.message || "爬取失敗",
    };
  }
}
