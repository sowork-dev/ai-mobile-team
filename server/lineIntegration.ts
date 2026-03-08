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

/**
 * 發送時間選擇 Flex Message（排程詢問）
 * @param to LINE userId
 * @param requesterName 發起人名稱
 * @param sessionId 排程 session ID（用於 postback data）
 * @param dates 可選日期列表 [{label, value}]
 * @param sessionType "meeting" | "dinner"
 */
export async function sendMeetingAvailabilityMessage(
  to: string,
  requesterName: string,
  sessionId: string,
  dates: { label: string; value: string }[],
  sessionType: "meeting" | "dinner" = "meeting"
): Promise<{ success: boolean; error?: string }> {
  if (!channelAccessToken) {
    return { success: false, error: "LINE_CHANNEL_ACCESS_TOKEN 未設定" };
  }

  const typeLabel = sessionType === "meeting" ? "會議" : "聚餐";
  const title = `📅 ${requesterName} 邀請您排定${typeLabel}時間`;
  const subtitle = `請選擇您下週方便的時間（可複選，逐一點選確認）`;

  // 日期按鈕（Postback action，data 格式：sched:{sessionId}:{date}）
  const dateButtons: line.messagingApi.FlexButton[] = dates.map((d) => ({
    type: "button" as const,
    style: "secondary" as const,
    color: "#4A90D9",
    action: {
      type: "postback" as const,
      label: d.label,
      data: `sched:${sessionId}:${d.value}`,
      displayText: `✅ 我 ${d.label} 有空`,
    },
    height: "sm" as const,
  }));

  const flexMessage: line.messagingApi.FlexMessage = {
    type: "flex",
    altText: title,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: title,
            weight: "bold",
            size: "sm",
            color: "#FFFFFF",
            wrap: true,
          },
        ],
        paddingAll: "15px",
        backgroundColor: "#4A90D9",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: subtitle,
            wrap: true,
            size: "xs",
            color: "#555555",
            margin: "none",
          },
          {
            type: "separator",
            margin: "md",
          },
          {
            type: "text",
            text: "下週可用時間：",
            size: "sm",
            weight: "bold",
            color: "#333333",
            margin: "md",
          },
        ],
        paddingAll: "15px",
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: dateButtons,
        spacing: "sm",
        paddingAll: "15px",
      },
    },
  };

  try {
    await client.pushMessage({
      to,
      messages: [flexMessage],
    });
    return { success: true };
  } catch (error: any) {
    console.error("LINE sendMeetingAvailabilityMessage error:", error);
    return { success: false, error: error?.message || "發送失敗" };
  }
}

/**
 * 發送排程確認通知
 */
export async function sendSchedulingConfirmation(
  to: string,
  confirmedTime: string,
  sessionType: "meeting" | "dinner",
  meetLink?: string
): Promise<{ success: boolean; error?: string }> {
  const typeLabel = sessionType === "meeting" ? "會議" : "聚餐";
  const title = `✅ ${typeLabel}時間已確認`;
  let bodyText = `📅 確認時間：${confirmedTime}`;
  if (meetLink) {
    bodyText += `\n🔗 連結：${meetLink}`;
  }
  return sendLineFlexMessage(to, title, bodyText);
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

/**
 * 處理排程 Postback 事件
 * data 格式：sched:{sessionId}:{dateValue}
 * 返回解析結果，實際記錄由 caller 處理
 */
export function parseSchedulingPostback(data: string): {
  sessionId: string;
  date: string;
} | null {
  if (!data.startsWith("sched:")) return null;
  const parts = data.split(":");
  if (parts.length < 3) return null;
  const sessionId = parts[1];
  const date = parts.slice(2).join(":"); // 日期可能含冒號
  return { sessionId, date };
}
