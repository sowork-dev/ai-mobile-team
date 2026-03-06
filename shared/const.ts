export const COOKIE_NAME = "app_session_id";
export const CSRF_COOKIE_NAME = "csrf_token";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = 'Please login (10001)';
export const NOT_ADMIN_ERR_MSG = 'You do not have required permission (10002)';
/** 點數不足錯誤訊息的識別前綴（後端 llmWithCredits.ts 拋出的錯誤以此開頭） */
export const INSUFFICIENT_CREDITS_PREFIX = '點數不足';
