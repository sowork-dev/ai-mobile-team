/**
 * LINE Messaging API 整合
 * 負責：
 * 1. 發送文字訊息給 LINE 用戶
 * 2. 發送 Flex Message（豐富格式：標題、內容、按鈕）
 * 3. 儲存 LINE 聯絡人（name → LINE userId 對應）
 */
import * as line from "@line/bot-sdk";

const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN || "";
const channelSecret = process.env.LINE_CHANNEL_SECRET || "";

// 建立 LINE Messaging API 客戶端
const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken,
});

// ============ LINE 聯絡人存儲（in-memory，之後可換 DB）============

export interface LineContact {
  name: string;
  lineUserId: string;
  addedAt: Date;
}

const lineContacts: Map<string, LineContact> = new Map();

export function saveLineContact(name: string, lineUserId: string): LineContact {
  const contact: LineContact = { name, lineUserId, addedAt: new Date() };
  lineContacts.set(name.toLowerCase(), contact);
  return contact;
}

export function getLineContact(name: string): LineContact | undefined {
  return lineContacts.get(name.toLowerCase());
}

export function getAllLineContacts(): LineContact[] {
  return Array.from(lineContacts.values()).sort(
    (a, b) => b.addedAt.getTime() - a.addedAt.getTime()
  );
}

export function deleteLineContact(name: string): boolean {
  return lineContacts.delete(name.toLowerCase());
}

// ============ LINE 訊息發送 ============

/**
 * 發送文字訊息
 * @param to LINE userId（格式：Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx）
 * @param message 訊息內容
 */
export async function sendLineMessage(to: string, message: string): Promise<{
  success: boolean;
  error?: string;
}> {
  if (!channelAccessToken) {
    return { success: false, error: "LINE_CHANNEL_ACCESS_TOKEN 未設定" };
  }

  try {
    await client.pushMessage({
      to,
      messages: [{ type: "text", text: message }],
    });
    return { success: true };
  } catch (error: any) {
    console.error("LINE sendMessage error:", error);
    return { success: false, error: error?.message || "發送失敗" };
  }
}

/**
 * 發送 Flex Message（豐富格式）
 * @param to LINE userId
 * @param title 標題
 * @param content 內容
 * @param buttons 按鈕（可選）
 */
export async function sendLineFlexMessage(
  to: string,
  title: string,
  content: string,
  buttons?: { label: string; action: string }[]
): Promise<{ success: boolean; error?: string }> {
  if (!channelAccessToken) {
    return { success: false, error: "LINE_CHANNEL_ACCESS_TOKEN 未設定" };
  }

  const buttonComponents: line.messagingApi.FlexButton[] = (buttons || []).map((b) => ({
    type: "button" as const,
    style: "secondary" as const,
    action: {
      type: "message" as const,
      label: b.label,
      text: b.action,
    },
    height: "sm" as const,
  }));

  const flexMessage: line.messagingApi.FlexMessage = {
    type: "flex",
    altText: title,
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: title,
            weight: "bold",
            size: "md",
            color: "#1C1C1E",
          },
        ],
        paddingAll: "15px",
        backgroundColor: "#F2F2F7",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: content,
            wrap: true,
            size: "sm",
            color: "#3C3C43",
          },
        ],
        paddingAll: "15px",
      },
      ...(buttonComponents.length > 0 && {
        footer: {
          type: "box",
          layout: "vertical",
          contents: buttonComponents,
          spacing: "sm",
          paddingAll: "15px",
        },
      }),
    },
  };

  try {
    await client.pushMessage({
      to,
      messages: [flexMessage],
    });
    return { success: true };
  } catch (error: any) {
    console.error("LINE sendFlexMessage error:", error);
    return { success: false, error: error?.message || "發送失敗" };
  }
}

// ============ Webhook 事件處理 ============

/**
 * 驗證 LINE Webhook 簽名
 */
export function validateWebhookSignature(body: string, signature: string): boolean {
  if (!channelSecret) {
    // 沒有 channel secret 就跳過驗證（開發模式）
    return true;
  }
  return line.validateSignature(body, channelSecret, signature);
}

/**
 * 解析 LINE Webhook 事件
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseWebhookEvents(body: any): any[] {
  return body?.events || [];
}
