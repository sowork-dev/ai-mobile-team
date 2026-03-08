/**
 * Sprint 7-A + 7-E: Calendar & Email Integration
 * Google Calendar / Outlook Calendar / Gmail / Outlook Mail
 *
 * Demo 模式下返回預設假資料，不需要實際 OAuth 憑證。
 */

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO 8601
  end: string;
  attendees: string[];
  meetLink?: string;
  location?: string;
}

export interface TimeSlot {
  date: string; // YYYY-MM-DD
  dayOfWeek: string;
  startTime: string; // HH:mm
  endTime: string;
}

export interface EmailSummary {
  id: string;
  from: string;
  subject: string;
  preview: string; // 前 200 字
  receivedAt: string;
  isImportant: boolean;
}

// ─── Demo 假資料 ────────────────────────────────────────────────

const DEMO_EVENTS: CalendarEvent[] = [
  {
    id: "evt-001",
    title: "Nike APAC 週例會",
    start: getNextWeekday(1, "10:00"),
    end: getNextWeekday(1, "11:00"),
    attendees: ["sarah@groupm.com", "annie@nike.com", "james@nike.com"],
    meetLink: "https://meet.google.com/abc-defg-hij",
  },
  {
    id: "evt-002",
    title: "Unilever 提案簡報",
    start: getNextWeekday(2, "14:00"),
    end: getNextWeekday(2, "15:30"),
    attendees: ["sarah@groupm.com", "client@unilever.com"],
    meetLink: "https://meet.google.com/xyz-abcd-efg",
  },
  {
    id: "evt-003",
    title: "Q4 Pitch 策略會議",
    start: getNextWeekday(3, "09:30"),
    end: getNextWeekday(3, "11:00"),
    attendees: ["sarah@groupm.com", "lena@groupm.com", "alex@groupm.com"],
    meetLink: "https://meet.google.com/qrs-tuvw-xyz",
  },
  {
    id: "evt-004",
    title: "P&G 創意審查",
    start: getNextWeekday(4, "15:00"),
    end: getNextWeekday(4, "16:00"),
    attendees: ["sarah@groupm.com", "brand@pg.com"],
    meetLink: "https://teams.microsoft.com/l/meetup-join/abc123",
  },
  {
    id: "evt-005",
    title: "內部週報分享",
    start: getNextWeekday(5, "16:00"),
    end: getNextWeekday(5, "16:30"),
    attendees: ["sarah@groupm.com", "maya@groupm.com", "ryan@groupm.com"],
    meetLink: "https://meet.google.com/mno-pqrs-tuv",
  },
];

const DEMO_COMMON_SLOTS: TimeSlot[] = [
  { date: getNextWeekdayDate(3), dayOfWeek: "週三", startTime: "14:00", endTime: "16:00" },
  { date: getNextWeekdayDate(4), dayOfWeek: "週四", startTime: "10:00", endTime: "12:00" },
];

const DEMO_UNREAD_EMAILS: EmailSummary[] = [
  {
    id: "email-001",
    from: "Annie Chen <annie@nike.com>",
    subject: "Re: Nike APAC Q4 策略提案時間確認",
    preview: "您好 Sarah，感謝您的提案概要。我們對 W43 策略調整方向很感興趣，能否安排本週或下週初進行詳細簡報？我方 James 和 Leo 週三下午和週四上午均可配合...",
    receivedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    isImportant: true,
  },
  {
    id: "email-002",
    from: "Legal Team <legal@groupm.com>",
    subject: "Unilever 合約修訂 — 需要您的簽名",
    preview: "Sarah，Unilever 全球提案合約已完成修訂，請於本週五前完成電子簽名。主要修訂點：第 7 條款智財權歸屬調整、第 12 條款保密期限延長至 5 年...",
    receivedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    isImportant: true,
  },
  {
    id: "email-003",
    from: "P&G Brand Team <brand@pg.com>",
    subject: "Q4 廣告文案反饋",
    preview: "GroupM 團隊您好，我們已審閱 Maya 提交的 Q4 廣告文案（8個語言版本）。整體方向符合品牌指引，有幾個細節需要調整：1. 日文版本的語氣偏正式，需要更貼近年輕族群...",
    receivedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    isImportant: true,
  },
];

// ─── 工具函數 ────────────────────────────────────────────────────

function getNextWeekday(dayOffset: number, time: string): string {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  const [h, m] = time.split(":").map(Number);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

function getNextWeekdayDate(dayOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  return d.toISOString().split("T")[0];
}

// ─── Google Calendar Service ─────────────────────────────────────

export class GoogleCalendarService {
  private accessToken: string | null;

  constructor(accessToken?: string) {
    this.accessToken = accessToken ?? null;
  }

  /** OAuth URL 生成（Demo：返回假 URL） */
  static getAuthUrl(redirectUri: string, state?: string): string {
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || "demo-client-id",
      redirect_uri: redirectUri,
      response_type: "code",
      scope: [
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/calendar.events",
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.send",
        "email",
        "profile",
      ].join(" "),
      access_type: "offline",
      prompt: "consent",
      ...(state ? { state } : {}),
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  /** 用授權碼換 tokens（Demo：返回假 tokens） */
  static async exchangeCode(code: string, redirectUri: string): Promise<{ accessToken: string; refreshToken: string; email: string; expiresAt: Date }> {
    if (process.env.GOOGLE_CLIENT_SECRET) {
      // 真實 OAuth token exchange（生產環境）
      const resp = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });
      const data = await resp.json() as any;
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        email: "user@gmail.com",
        expiresAt: new Date(Date.now() + (data.expires_in ?? 3600) * 1000),
      };
    }
    // Demo 模式
    return {
      accessToken: "demo-google-access-token",
      refreshToken: "demo-google-refresh-token",
      email: "sarah.chen@groupm.com",
      expiresAt: new Date(Date.now() + 3600 * 1000),
    };
  }

  /** 取得未來 N 天行程 */
  async listEvents(days = 7): Promise<CalendarEvent[]> {
    if (this.accessToken && !this.accessToken.startsWith("demo-")) {
      // 真實 API 調用
      const timeMin = new Date().toISOString();
      const timeMax = new Date(Date.now() + days * 24 * 3600 * 1000).toISOString();
      const resp = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
        { headers: { Authorization: `Bearer ${this.accessToken}` } }
      );
      const data = await resp.json() as any;
      return (data.items ?? []).map((item: any): CalendarEvent => ({
        id: item.id,
        title: item.summary ?? "(無標題)",
        start: item.start?.dateTime ?? item.start?.date,
        end: item.end?.dateTime ?? item.end?.date,
        attendees: (item.attendees ?? []).map((a: any) => a.email),
        meetLink: item.hangoutLink,
        location: item.location,
      }));
    }
    // Demo 模式
    return DEMO_EVENTS;
  }

  /** 建立會議事件，返回 Meet 連結 */
  async createEvent(event: Omit<CalendarEvent, "id" | "meetLink">): Promise<CalendarEvent> {
    if (this.accessToken && !this.accessToken.startsWith("demo-")) {
      const body = {
        summary: event.title,
        start: { dateTime: event.start, timeZone: "Asia/Taipei" },
        end: { dateTime: event.end, timeZone: "Asia/Taipei" },
        attendees: event.attendees.map((email) => ({ email })),
        conferenceData: {
          createRequest: { requestId: `meet-${Date.now()}`, conferenceSolutionKey: { type: "hangoutsMeet" } },
        },
      };
      const resp = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all",
        { method: "POST", headers: { Authorization: `Bearer ${this.accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify(body) }
      );
      const data = await resp.json() as any;
      return { ...event, id: data.id, meetLink: data.hangoutLink };
    }
    // Demo 模式
    const meetCode = Math.random().toString(36).slice(2, 5) + "-" + Math.random().toString(36).slice(2, 6) + "-" + Math.random().toString(36).slice(2, 5);
    return { ...event, id: `demo-evt-${Date.now()}`, meetLink: `https://meet.google.com/${meetCode}` };
  }

  /** 取得共同空檔（Demo：返回固定空檔） */
  async checkAvailability(_participants: string[], _date: string): Promise<TimeSlot[]> {
    return DEMO_COMMON_SLOTS;
  }
}

// ─── Outlook Calendar Service ─────────────────────────────────────

export class OutlookCalendarService {
  private accessToken: string | null;

  constructor(accessToken?: string) {
    this.accessToken = accessToken ?? null;
  }

  static getAuthUrl(redirectUri: string, state?: string): string {
    const tenantId = process.env.MICROSOFT_TENANT_ID || "common";
    const params = new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID || "demo-ms-client-id",
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid profile email User.Read Calendars.ReadWrite Mail.Read Mail.Send offline_access",
      response_mode: "query",
      ...(state ? { state } : {}),
    });
    return `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params}`;
  }

  static async exchangeCode(code: string, redirectUri: string): Promise<{ accessToken: string; refreshToken: string; email: string; expiresAt: Date }> {
    const tenantId = process.env.MICROSOFT_TENANT_ID || "common";
    if (process.env.MICROSOFT_CLIENT_SECRET) {
      const resp = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: process.env.MICROSOFT_CLIENT_ID!,
          client_secret: process.env.MICROSOFT_CLIENT_SECRET,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
          scope: "openid profile email User.Read Calendars.ReadWrite Mail.Read Mail.Send offline_access",
        }),
      });
      const data = await resp.json() as any;
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        email: "user@company.com",
        expiresAt: new Date(Date.now() + (data.expires_in ?? 3600) * 1000),
      };
    }
    return {
      accessToken: "demo-ms-access-token",
      refreshToken: "demo-ms-refresh-token",
      email: "jennifer.wu@company.com",
      expiresAt: new Date(Date.now() + 3600 * 1000),
    };
  }

  async listEvents(days = 7): Promise<CalendarEvent[]> {
    if (this.accessToken && !this.accessToken.startsWith("demo-")) {
      const timeMin = new Date().toISOString();
      const timeMax = new Date(Date.now() + days * 24 * 3600 * 1000).toISOString();
      const resp = await fetch(
        `https://graph.microsoft.com/v1.0/me/calendarView?startDateTime=${timeMin}&endDateTime=${timeMax}&$orderby=start/dateTime`,
        { headers: { Authorization: `Bearer ${this.accessToken}` } }
      );
      const data = await resp.json() as any;
      return (data.value ?? []).map((item: any): CalendarEvent => ({
        id: item.id,
        title: item.subject ?? "(無標題)",
        start: item.start?.dateTime,
        end: item.end?.dateTime,
        attendees: (item.attendees ?? []).map((a: any) => a.emailAddress?.address),
        meetLink: item.onlineMeeting?.joinUrl,
        location: item.location?.displayName,
      }));
    }
    return DEMO_EVENTS;
  }

  async createEvent(event: Omit<CalendarEvent, "id" | "meetLink">): Promise<CalendarEvent> {
    if (this.accessToken && !this.accessToken.startsWith("demo-")) {
      const body = {
        subject: event.title,
        start: { dateTime: event.start, timeZone: "Taipei Standard Time" },
        end: { dateTime: event.end, timeZone: "Taipei Standard Time" },
        attendees: event.attendees.map((email) => ({ emailAddress: { address: email }, type: "required" })),
        isOnlineMeeting: true,
        onlineMeetingProvider: "teamsForBusiness",
      };
      const resp = await fetch("https://graph.microsoft.com/v1.0/me/events", {
        method: "POST",
        headers: { Authorization: `Bearer ${this.accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await resp.json() as any;
      return { ...event, id: data.id, meetLink: data.onlineMeeting?.joinUrl };
    }
    const teamCode = Math.random().toString(36).slice(2, 12);
    return { ...event, id: `demo-ms-evt-${Date.now()}`, meetLink: `https://teams.microsoft.com/l/meetup-join/${teamCode}` };
  }

  async checkAvailability(_participants: string[], _date: string): Promise<TimeSlot[]> {
    return DEMO_COMMON_SLOTS;
  }
}

// ─── Gmail Service ───────────────────────────────────────────────

export class GmailService {
  private accessToken: string | null;

  constructor(accessToken?: string) {
    this.accessToken = accessToken ?? null;
  }

  /** 取得未讀重要 email */
  async listUnreadImportant(limit = 10): Promise<EmailSummary[]> {
    if (this.accessToken && !this.accessToken.startsWith("demo-")) {
      const resp = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread is:important&maxResults=${limit}`,
        { headers: { Authorization: `Bearer ${this.accessToken}` } }
      );
      const listData = await resp.json() as any;
      const messages: EmailSummary[] = [];
      for (const msg of (listData.messages ?? []).slice(0, limit)) {
        const detail = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
          { headers: { Authorization: `Bearer ${this.accessToken}` } }
        ).then((r) => r.json()) as any;
        const headers: Record<string, string> = {};
        for (const h of (detail.payload?.headers ?? [])) {
          headers[h.name] = h.value;
        }
        const snippet = detail.snippet ?? "";
        messages.push({
          id: msg.id,
          from: headers.From ?? "",
          subject: headers.Subject ?? "(無主旨)",
          preview: snippet.slice(0, 200),
          receivedAt: new Date(parseInt(detail.internalDate ?? "0")).toISOString(),
          isImportant: true,
        });
      }
      return messages;
    }
    return DEMO_UNREAD_EMAILS.slice(0, limit);
  }

  /** 從 email 內容提取待辦項目 */
  extractTodos(emailContent: string): string[] {
    // 簡易關鍵字提取（生產環境可接 AI API）
    const todos: string[] = [];
    const lines = emailContent.split(/[。\n.]/);
    for (const line of lines) {
      if (/需要|請|確認|簽名|回覆|安排|提供|完成/.test(line) && line.length > 5) {
        todos.push(line.trim().replace(/^[-•*]\s*/, ""));
      }
    }
    return todos.slice(0, 5);
  }

  /** 起草回覆 */
  async draftReply(emailId: string, instruction: string): Promise<string> {
    if (this.accessToken && !this.accessToken.startsWith("demo-")) {
      // 生產：取原信內容後接 AI 起草，這裡返回模板
      return `根據您的指示「${instruction}」，建議回覆：\n\n您好，感謝來信。${instruction}。\n\n如有任何問題，請隨時聯繫。\n\n敬祝 商祺`;
    }
    const email = DEMO_UNREAD_EMAILS.find((e) => e.id === emailId);
    const senderName = email?.from.split("<")[0].trim() ?? "您";
    return `${senderName}，\n\n感謝您的來信。${instruction}。\n\n若有任何問題，歡迎隨時聯繫。\n\n此致\n敬禮`;
  }

  /** 送出回覆 */
  async sendReply(emailId: string, replyBody: string): Promise<boolean> {
    if (this.accessToken && !this.accessToken.startsWith("demo-")) {
      // 生產：用 Gmail API 送出
      console.log(`[Gmail] Sending reply to email ${emailId}`);
      return true;
    }
    console.log(`[Demo] Email reply sent for ${emailId}: ${replyBody.slice(0, 50)}...`);
    return true;
  }
}

// ─── Outlook Mail Service ────────────────────────────────────────

export class OutlookMailService {
  private accessToken: string | null;

  constructor(accessToken?: string) {
    this.accessToken = accessToken ?? null;
  }

  async listUnreadImportant(limit = 10): Promise<EmailSummary[]> {
    if (this.accessToken && !this.accessToken.startsWith("demo-")) {
      const resp = await fetch(
        `https://graph.microsoft.com/v1.0/me/messages?$filter=isRead eq false and importance eq 'high'&$top=${limit}&$select=id,from,subject,bodyPreview,receivedDateTime`,
        { headers: { Authorization: `Bearer ${this.accessToken}` } }
      );
      const data = await resp.json() as any;
      return (data.value ?? []).map((msg: any): EmailSummary => ({
        id: msg.id,
        from: msg.from?.emailAddress?.address ?? "",
        subject: msg.subject ?? "(無主旨)",
        preview: (msg.bodyPreview ?? "").slice(0, 200),
        receivedAt: msg.receivedDateTime,
        isImportant: true,
      }));
    }
    return DEMO_UNREAD_EMAILS.slice(0, limit);
  }

  extractTodos(emailContent: string): string[] {
    const todos: string[] = [];
    const lines = emailContent.split(/[。\n.]/);
    for (const line of lines) {
      if (/需要|請|確認|簽名|回覆|安排|提供|完成/.test(line) && line.length > 5) {
        todos.push(line.trim().replace(/^[-•*]\s*/, ""));
      }
    }
    return todos.slice(0, 5);
  }

  async draftReply(emailId: string, instruction: string): Promise<string> {
    const email = DEMO_UNREAD_EMAILS.find((e) => e.id === emailId);
    const senderName = email?.from.split("<")[0].trim() ?? "您";
    return `${senderName}，\n\n感謝您的來信。${instruction}。\n\n如有任何問題，請隨時與我們聯繫。\n\n此致\n敬禮`;
  }

  async sendReply(emailId: string, replyBody: string): Promise<boolean> {
    if (this.accessToken && !this.accessToken.startsWith("demo-")) {
      console.log(`[Outlook] Sending reply to ${emailId}`);
      return true;
    }
    console.log(`[Demo] Outlook reply sent for ${emailId}: ${replyBody.slice(0, 50)}...`);
    return true;
  }
}

// ─── 共用工具 ─────────────────────────────────────────────────────

/** 找出多位參與者的共同空檔 */
export function findCommonSlots(
  _userId: string,
  _participants: string[],
  dateRange: { start: string; end: string }
): TimeSlot[] {
  // Demo 模式：固定返回 2 個共同空檔
  return DEMO_COMMON_SLOTS.filter((slot) => slot.date >= dateRange.start && slot.date <= dateRange.end);
}

/** 建立會議（自動選擇平台） */
export async function createMeetingEvent(
  _userId: string,
  event: Omit<CalendarEvent, "id" | "meetLink">,
  platform: "google" | "microsoft" = "google"
): Promise<CalendarEvent> {
  if (platform === "microsoft") {
    const svc = new OutlookCalendarService();
    return svc.createEvent(event);
  }
  const svc = new GoogleCalendarService();
  return svc.createEvent(event);
}

export { DEMO_UNREAD_EMAILS };
