/**
 * AI 內容生成器
 * 根據任務類型和職位，使用不同的 AI Model 生成文件內容
 */
import OpenAI from "openai";

// AI Model 配置
export type AIModel = "openai" | "qianwen" | "zhipu" | "perplexity" | "google" | "cohere";

interface ModelConfig {
  name: string;
  bestFor: string[];
  endpoint?: string;
}

const MODEL_CONFIGS: Record<AIModel, ModelConfig> = {
  openai: {
    name: "GPT-4",
    bestFor: ["report", "analysis", "contract", "proposal"],
  },
  qianwen: {
    name: "通義千問",
    bestFor: ["chinese_content", "marketing", "copywriting"],
    endpoint: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  },
  zhipu: {
    name: "智譜 GLM",
    bestFor: ["chinese_content", "analysis", "code"],
    endpoint: "https://open.bigmodel.cn/api/paas/v4",
  },
  perplexity: {
    name: "Perplexity",
    bestFor: ["research", "summary", "fact_check"],
    endpoint: "https://api.perplexity.ai",
  },
  google: {
    name: "Gemini",
    bestFor: ["multimodal", "analysis", "translation"],
  },
  cohere: {
    name: "Cohere",
    bestFor: ["embedding", "classification", "summary"],
    endpoint: "https://api.cohere.ai/v1",
  },
};

// 任務類型到推薦模型的映射
const TASK_MODEL_MAP: Record<string, AIModel> = {
  // HR 任務
  "employee-onboarding": "openai",
  "performance-review": "openai",
  // Finance 任務
  "expense-report": "qianwen",
  "budget-planning": "openai",
  // PM 任務
  "project-kickoff": "openai",
  "weekly-standup": "qianwen",
  // IT 任務
  "system-incident": "zhipu",
  // Marketing 任務
  "marketing-campaign": "qianwen",
  "content-creation": "qianwen",
  // Default
  "custom": "openai",
};

// 職位到推薦模型的映射
const ROLE_MODEL_MAP: Record<string, AIModel> = {
  "HR": "openai",
  "Finance": "openai",
  "PM": "openai",
  "IT": "zhipu",
  "Marketing": "qianwen",
  "Design": "openai",
  "Data": "zhipu",
  "Operations": "qianwen",
  "Secretary": "qianwen",
};

/**
 * 獲取推薦的 AI Model
 */
export function getRecommendedModel(taskType?: string, role?: string): AIModel {
  if (taskType && TASK_MODEL_MAP[taskType]) {
    return TASK_MODEL_MAP[taskType];
  }
  if (role && ROLE_MODEL_MAP[role]) {
    return ROLE_MODEL_MAP[role];
  }
  return "openai"; // 默認使用 OpenAI
}

/**
 * 創建 OpenAI 兼容客戶端
 */
function createClient(model: AIModel): OpenAI {
  const config = MODEL_CONFIGS[model];
  
  switch (model) {
    case "openai":
      return new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    case "qianwen":
      return new OpenAI({
        apiKey: process.env.QIANWEN_API_KEY,
        baseURL: config.endpoint,
      });
    case "zhipu":
      return new OpenAI({
        apiKey: process.env.ZHIPU_API_KEY,
        baseURL: config.endpoint,
      });
    case "perplexity":
      return new OpenAI({
        apiKey: process.env.PERPLEXITY_API_KEY,
        baseURL: config.endpoint,
      });
    default:
      return new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
  }
}

/**
 * 生成文件內容
 */
export interface GenerateContentOptions {
  taskType: string;
  role?: string;
  title: string;
  context: string;
  format: "pdf" | "doc" | "ppt" | "xls" | "markdown" | "code";
  language?: "zh" | "en";
  model?: AIModel;
}

export interface GeneratedContent {
  title: string;
  content: string;
  sections?: { title: string; content: string }[];
  tableData?: { headers: string[]; rows: string[][] };
  slides?: { title: string; bullets: string[] }[];
  code?: { language: string; code: string };
  model: AIModel;
}

const FORMAT_PROMPTS: Record<string, string> = {
  pdf: "生成一份專業的報告，包含標題、摘要、主要內容、結論。使用清晰的段落結構。",
  doc: "生成一份正式的文件，包含適當的標題層級和段落。適合存檔和列印。",
  ppt: "生成簡報大綱，每個投影片包含一個主題和3-5個要點。總共5-8頁。格式：JSON array [{title, bullets: []}]",
  xls: "生成表格數據，包含欄位標題和數據行。格式：JSON {headers: [], rows: [[]]}",
  markdown: "生成 Markdown 格式的內容，使用標題、列表、粗體等格式。",
  code: "生成程式碼，包含註解說明。格式：JSON {language, code}",
};

export async function generateContent(options: GenerateContentOptions): Promise<GeneratedContent> {
  const { taskType, role, title, context, format, language = "zh", model: preferredModel } = options;
  
  // 選擇模型
  const model = preferredModel || getRecommendedModel(taskType, role);
  const client = createClient(model);
  
  // 構建 prompt
  const formatPrompt = FORMAT_PROMPTS[format] || FORMAT_PROMPTS.pdf;
  const langPrompt = language === "zh" ? "請使用繁體中文回覆。" : "Please respond in English.";
  
  const systemPrompt = `你是一個專業的企業文件撰寫助手。${langPrompt}
${formatPrompt}

任務類型：${taskType}
${role ? `職位：${role}` : ""}`;

  const userPrompt = `請根據以下資訊生成文件：

標題：${title}

背景資訊：
${context}

請直接輸出內容，不需要額外解釋。`;

  try {
    const modelName = model === "openai" ? "gpt-4o" 
      : model === "qianwen" ? "qwen-plus"
      : model === "zhipu" ? "glm-4"
      : "gpt-4o";

    const response = await client.chat.completions.create({
      model: modelName,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const rawContent = response.choices[0]?.message?.content || "";
    
    // 根據格式解析內容
    const result: GeneratedContent = {
      title,
      content: rawContent,
      model,
    };

    // 嘗試解析特定格式
    if (format === "ppt") {
      try {
        const jsonMatch = rawContent.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          result.slides = JSON.parse(jsonMatch[0]);
        }
      } catch {}
    } else if (format === "xls") {
      try {
        const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result.tableData = JSON.parse(jsonMatch[0]);
        }
      } catch {}
    } else if (format === "code") {
      try {
        const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result.code = JSON.parse(jsonMatch[0]);
        }
      } catch {
        // 如果不是 JSON，嘗試提取程式碼塊
        const codeMatch = rawContent.match(/```(\w+)?\n([\s\S]*?)```/);
        if (codeMatch) {
          result.code = {
            language: codeMatch[1] || "text",
            code: codeMatch[2],
          };
        }
      }
    }

    return result;
  } catch (error) {
    console.error(`AI content generation failed:`, error);
    // 返回基本內容
    return {
      title,
      content: `[AI 生成失敗] ${context}`,
      model,
    };
  }
}

/**
 * 獲取可用的 AI Models
 */
export function getAvailableModels(): { id: AIModel; name: string; bestFor: string[] }[] {
  return Object.entries(MODEL_CONFIGS).map(([id, config]) => ({
    id: id as AIModel,
    name: config.name,
    bestFor: config.bestFor,
  }));
}
