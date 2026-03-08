/**
 * Manus API 整合 — 專業 PPT 生成
 * 使用 Manus AI 透過 Canva/Google Slides 生成高品質簡報
 */

const MANUS_API_URL = "https://api.manus.im/v1";

interface ManusTaskRequest {
  prompt: string;
  agentProfile?: string;
  attachments?: Array<{
    type: "url" | "base64";
    url?: string;
    data?: string;
    filename?: string;
  }>;
  createShareableLink?: boolean;
  webhookUrl?: string;
}

interface ManusTaskResponse {
  task_id: string;
  task_url: string;
  share_url?: string;
  status: "pending" | "running" | "completed" | "failed";
}

interface ManusTaskStatus {
  task_id: string;
  status: "pending" | "running" | "completed" | "failed";
  progress?: number;
  result?: {
    files?: Array<{
      name: string;
      url: string;
      type: string;
    }>;
    share_url?: string;
  };
  error?: string;
}

/**
 * 建立 Manus 任務
 */
export async function createManusTask(request: ManusTaskRequest): Promise<ManusTaskResponse> {
  const apiKey = process.env.MANUS_API_KEY;
  
  if (!apiKey) {
    throw new Error("MANUS_API_KEY not configured");
  }

  const response = await fetch(`${MANUS_API_URL}/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      prompt: request.prompt,
      agentProfile: request.agentProfile || "manus-1.6",
      attachments: request.attachments || [],
      createShareableLink: request.createShareableLink ?? true,
      webhookUrl: request.webhookUrl,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Manus API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * 查詢 Manus 任務狀態
 */
export async function getManusTaskStatus(taskId: string): Promise<ManusTaskStatus> {
  const apiKey = process.env.MANUS_API_KEY;
  
  if (!apiKey) {
    throw new Error("MANUS_API_KEY not configured");
  }

  const response = await fetch(`${MANUS_API_URL}/tasks/${taskId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Manus API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * 生成專業 PPT 簡報
 */
export async function generateProfessionalPPT(options: {
  title: string;
  content: string;
  style?: "business" | "creative" | "minimal";
  slides?: number;
  language?: "zh" | "en";
}): Promise<{ taskId: string; taskUrl: string }> {
  const { title, content, style = "business", slides = 10, language = "zh" } = options;

  const stylePrompts: Record<string, string> = {
    business: "專業商務風格，簡潔有力，使用深藍色和白色為主色調",
    creative: "創意活潑風格，使用漸變色彩和現代排版",
    minimal: "極簡風格，大量留白，強調重點內容",
  };

  const prompt = `
請使用 Canva 製作一份專業的 PPT 簡報：

【標題】${title}

【內容大綱】
${content}

【設計要求】
- 風格：${stylePrompts[style]}
- 頁數：約 ${slides} 頁
- 語言：${language === "zh" ? "繁體中文" : "English"}
- 包含：封面頁、目錄頁、內容頁、總結頁
- 使用專業的圖表和圖示
- 確保文字清晰可讀

完成後請提供可下載的 PPT 檔案連結。
`.trim();

  const result = await createManusTask({
    prompt,
    agentProfile: "manus-1.6",
    createShareableLink: true,
  });

  return {
    taskId: result.task_id,
    taskUrl: result.task_url,
  };
}

/**
 * 等待任務完成（輪詢）
 */
export async function waitForTaskCompletion(
  taskId: string,
  options?: {
    maxWaitMs?: number;
    pollIntervalMs?: number;
    onProgress?: (progress: number, status: string) => void;
  }
): Promise<ManusTaskStatus> {
  const { maxWaitMs = 5 * 60 * 1000, pollIntervalMs = 5000, onProgress } = options || {};
  
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitMs) {
    const status = await getManusTaskStatus(taskId);
    
    if (onProgress) {
      onProgress(status.progress || 0, status.status);
    }
    
    if (status.status === "completed" || status.status === "failed") {
      return status;
    }
    
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }
  
  throw new Error("Task timed out");
}
