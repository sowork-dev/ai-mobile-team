/**
 * 排程協調 — 資料結構與記憶體存儲
 * Sprint 5-C: LINE 排程協調（約會議 + 訂餐廳）
 */

export type SessionType = "meeting" | "dinner";
export type SessionStatus =
  | "collecting_contacts"  // 等待確認聯絡人 LINE ID
  | "waiting_replies"      // 已發送詢問，等待參與者回覆
  | "ready_to_confirm"     // 所有人已回覆，等待確認時間
  | "confirmed"            // 時間已確認
  | "cancelled";

export interface Participant {
  name: string;
  lineUserId?: string;
  availableDates: string[];  // 選中的可用日期（postback value）
  replied: boolean;
}

export interface SchedulingSession {
  id: string;
  type: SessionType;
  requester: string;          // userId（發起人）
  requesterName: string;      // 發起人顯示名稱
  description: string;        // 原始用戶指令
  participants: Participant[];
  proposedDates: string[];    // 提供選擇的日期選項 e.g. ["週一 3/10", "週二 3/11", ...]
  status: SessionStatus;
  commonDates?: string[];     // 所有人共同可用的日期
  proposedTime?: string;      // 幕僚長建議的最終時間
  confirmedTime?: string;     // 確認後的時間
  meetLink?: string;          // Google Meet 連結（預留）
  restaurantOptions?: {       // 餐廳選項（dinner 類型）
    name: string;
    bookingUrl: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

// ============ 記憶體存儲 ============

const sessions: Map<string, SchedulingSession> = new Map();

/**
 * 建立新排程工作階段
 */
export function createSchedulingSession(params: {
  type: SessionType;
  requester: string;
  requesterName: string;
  description: string;
  participantNames: string[];
  proposedDates: string[];
}): SchedulingSession {
  const id = `sched_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  const participants: Participant[] = params.participantNames.map((name) => ({
    name,
    lineUserId: undefined,
    availableDates: [],
    replied: false,
  }));

  const session: SchedulingSession = {
    id,
    type: params.type,
    requester: params.requester,
    requesterName: params.requesterName,
    description: params.description,
    participants,
    proposedDates: params.proposedDates,
    status: "collecting_contacts",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  sessions.set(id, session);
  return session;
}

/**
 * 獲取排程工作階段
 */
export function getSchedulingSession(id: string): SchedulingSession | undefined {
  return sessions.get(id);
}

/**
 * 獲取所有排程工作階段（按發起人篩選）
 */
export function getSchedulingSessions(requester?: string): SchedulingSession[] {
  const all = Array.from(sessions.values());
  if (requester) {
    return all
      .filter((s) => s.requester === requester)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  return all.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * 設定參與者 LINE User ID
 */
export function setParticipantLineId(
  sessionId: string,
  participantName: string,
  lineUserId: string
): SchedulingSession | undefined {
  const session = sessions.get(sessionId);
  if (!session) return undefined;

  const p = session.participants.find(
    (x) => x.name.toLowerCase() === participantName.toLowerCase()
  );
  if (p) {
    p.lineUserId = lineUserId;
  }

  session.updatedAt = new Date();
  sessions.set(sessionId, session);
  return session;
}

/**
 * 更新排程狀態（發送詢問後）
 */
export function markSessionWaiting(sessionId: string): SchedulingSession | undefined {
  const session = sessions.get(sessionId);
  if (!session) return undefined;

  session.status = "waiting_replies";
  session.updatedAt = new Date();
  sessions.set(sessionId, session);
  return session;
}

/**
 * 記錄參與者回覆（時間選擇 postback）
 */
export function recordParticipantReply(
  sessionId: string,
  participantName: string,
  selectedDates: string[]
): { session: SchedulingSession; allReplied: boolean } | undefined {
  const session = sessions.get(sessionId);
  if (!session) return undefined;

  // 嘗試用名字或 LINE userId 找到參與者
  const p = session.participants.find(
    (x) => x.name.toLowerCase() === participantName.toLowerCase()
  );
  if (p) {
    p.availableDates = selectedDates;
    p.replied = true;
  }

  // 計算所有人共同可用日期
  const allReplied = session.participants.every((x) => x.replied);
  if (allReplied) {
    const commonDates = session.proposedDates.filter((date) =>
      session.participants.every((x) => x.availableDates.includes(date))
    );
    session.commonDates = commonDates;
    session.status = "ready_to_confirm";
  }

  session.updatedAt = new Date();
  sessions.set(sessionId, session);
  return { session, allReplied };
}

/**
 * 記錄參與者回覆（透過 LINE userId）
 */
export function recordParticipantReplyByLineId(
  sessionId: string,
  lineUserId: string,
  selectedDates: string[]
): { session: SchedulingSession; allReplied: boolean } | undefined {
  const session = sessions.get(sessionId);
  if (!session) return undefined;

  const p = session.participants.find((x) => x.lineUserId === lineUserId);
  if (!p) return undefined;

  p.availableDates = selectedDates;
  p.replied = true;

  const allReplied = session.participants.every((x) => x.replied);
  if (allReplied) {
    const commonDates = session.proposedDates.filter((date) =>
      session.participants.every((x) => x.availableDates.includes(date))
    );
    session.commonDates = commonDates;
    session.status = "ready_to_confirm";
  }

  session.updatedAt = new Date();
  sessions.set(sessionId, session);
  return { session, allReplied };
}

/**
 * 確認排程時間
 */
export function confirmSchedulingTime(
  sessionId: string,
  confirmedTime: string,
  meetLink?: string
): SchedulingSession | undefined {
  const session = sessions.get(sessionId);
  if (!session) return undefined;

  session.confirmedTime = confirmedTime;
  session.meetLink = meetLink;
  session.status = "confirmed";
  session.updatedAt = new Date();
  sessions.set(sessionId, session);
  return session;
}

/**
 * 透過 LINE userId 找到相關的等待中工作階段
 */
export function findSessionByLineUserId(lineUserId: string): SchedulingSession | undefined {
  for (const session of sessions.values()) {
    if (session.status === "waiting_replies") {
      const found = session.participants.find((p) => p.lineUserId === lineUserId);
      if (found) return session;
    }
  }
  return undefined;
}

/**
 * 生成下週日期選項（週一到週五）
 */
export function generateNextWeekDates(): { label: string; value: string }[] {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ...
  // 找到下週週一
  const daysUntilNextMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + daysUntilNextMonday);

  const dayNames = ["週一", "週二", "週三", "週四", "週五"];
  const dates: { label: string; value: string }[] = [];

  for (let i = 0; i < 5; i++) {
    const d = new Date(nextMonday);
    d.setDate(nextMonday.getDate() + i);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const label = `${dayNames[i]} ${month}/${day}`;
    dates.push({ label, value: label });
  }

  return dates;
}
