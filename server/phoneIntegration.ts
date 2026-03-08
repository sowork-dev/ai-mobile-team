/**
 * 電話整合模組
 * - 若有 TWILIO_* 環境變數 → 啟用真實 Twilio Click-to-Call
 * - 否則 → 只支援顯示電話號碼讓用戶自行撥打
 */

export const isTwilioEnabled = !!(
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_AUTH_TOKEN &&
  process.env.TWILIO_FROM_NUMBER
);

// ── 電話聯絡人（記憶體存儲，可後續換成 DB）────────────────────────────────

export interface PhoneContact {
  name: string;
  phone: string;
  note?: string;
}

const phoneContacts: Map<string, PhoneContact> = new Map();

export function savePhoneContact(contact: PhoneContact): void {
  phoneContacts.set(contact.name, contact);
}

export function getAllPhoneContacts(): PhoneContact[] {
  return Array.from(phoneContacts.values());
}

export function getPhoneContact(name: string): PhoneContact | undefined {
  // 支援模糊比對（姓名包含關鍵字）
  const exact = phoneContacts.get(name);
  if (exact) return exact;
  const lower = name.toLowerCase();
  for (const c of phoneContacts.values()) {
    if (c.name.toLowerCase().includes(lower)) return c;
  }
  return undefined;
}

export function deletePhoneContact(name: string): boolean {
  return phoneContacts.delete(name);
}

// ── Twilio 功能（有憑證時才可用）────────────────────────────────────────────

/**
 * 發起 Twilio Click-to-Call
 * @param to   受話方號碼（E.164 格式，例如 +886912345678）
 * @returns 成功時回傳 callSid；失敗時回傳錯誤訊息
 */
export async function initiateCall(to: string): Promise<{
  success: boolean;
  callSid?: string;
  error?: string;
}> {
  if (!isTwilioEnabled) {
    return { success: false, error: "Twilio 尚未設定，請先在企業設定中填入 Twilio 憑證。" };
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID!;
  const authToken = process.env.TWILIO_AUTH_TOKEN!;
  const from = process.env.TWILIO_FROM_NUMBER!;

  try {
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: to,
          From: from,
          Url: "http://demo.twilio.com/docs/voice.xml", // 預設 TwiML（可替換）
        }).toString(),
      }
    );

    const data = (await res.json()) as { sid?: string; message?: string };
    if (res.ok && data.sid) {
      return { success: true, callSid: data.sid };
    }
    return { success: false, error: data.message || "撥號失敗" };
  } catch (err: any) {
    return { success: false, error: err.message || "網路錯誤" };
  }
}

/**
 * 取得通話狀態
 */
export async function getCallStatus(callSid: string): Promise<{
  status?: string;
  duration?: number;
  error?: string;
}> {
  if (!isTwilioEnabled) return { error: "Twilio 未設定" };

  const accountSid = process.env.TWILIO_ACCOUNT_SID!;
  const authToken = process.env.TWILIO_AUTH_TOKEN!;

  try {
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls/${callSid}.json`,
      { headers: { Authorization: `Basic ${credentials}` } }
    );
    const data = (await res.json()) as { status?: string; duration?: string; message?: string };
    if (res.ok) {
      return { status: data.status, duration: data.duration ? parseInt(data.duration) : undefined };
    }
    return { error: data.message || "查詢失敗" };
  } catch (err: any) {
    return { error: err.message || "網路錯誤" };
  }
}
