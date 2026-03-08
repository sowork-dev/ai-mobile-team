/**
 * Microsoft OneDrive 知識庫整合
 * 使用 Azure AD OAuth 2.0 (MSAL) + Microsoft Graph API
 */
import { ConfidentialClientApplication } from "@azure/msal-node";
import { Client } from "@microsoft/microsoft-graph-client";

// 從環境變數讀取 Azure AD 配置
function getAzureConfig() {
  return {
    clientId: process.env.AZURE_CLIENT_ID || "",
    tenantId: process.env.AZURE_TENANT_ID || "",
    clientSecret: process.env.AZURE_CLIENT_SECRET || "",
    redirectUri: process.env.AZURE_REDIRECT_URI || "https://dev-mobileteam.sowork.ai/api/auth/callback/microsoft",
  };
}

// 延遲初始化 MSAL 客戶端
let _msalClient: ConfidentialClientApplication | null = null;

function getMsalClient(): ConfidentialClientApplication {
  if (!_msalClient) {
    const config = getAzureConfig();
    if (!config.clientId || !config.clientSecret || !config.tenantId) {
      throw new Error("Azure AD configuration not set. Please configure AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID environment variables.");
    }
    _msalClient = new ConfidentialClientApplication({
      auth: {
        clientId: config.clientId,
        authority: `https://login.microsoftonline.com/${config.tenantId}`,
        clientSecret: config.clientSecret,
      },
    });
  }
  return _msalClient;
}

const SCOPES = ["User.Read", "Files.Read.All", "offline_access"];

// In-memory token store: userId → token
const tokenStore: Map<string, { accessToken: string; expiresAt: number; userEmail?: string; userName?: string }> = new Map();

// ── Types ─────────────────────────────────────────────────────────────────────

export interface OneDriveFile {
  id: string;
  name: string;
  type: "file" | "folder";
  size?: number;
  mimeType?: string;
  lastModified: string;
  webUrl: string;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

/**
 * 產生 OAuth 授權 URL，state 帶上 userId
 */
export async function getAuthUrl(userId: string = "dev-user-001"): Promise<string> {
  const config = getAzureConfig();
  const url = await getMsalClient().getAuthCodeUrl({
    scopes: SCOPES,
    redirectUri: config.redirectUri,
    state: encodeURIComponent(userId),
  });
  return url;
}

/**
 * 處理 OAuth callback，用 code 換 token
 * userId 從 state 參數取得（如傳入則優先使用）
 */
export async function handleCallback(code: string, userId: string): Promise<boolean> {
  try {
    const config = getAzureConfig();
    const response = await getMsalClient().acquireTokenByCode({
      code,
      scopes: SCOPES,
      redirectUri: config.redirectUri,
    });

    if (!response?.accessToken) return false;

    const tokenEntry = {
      accessToken: response.accessToken,
      expiresAt: response.expiresOn ? response.expiresOn.getTime() : Date.now() + 3600 * 1000,
      userEmail: response.account?.username,
      userName: response.account?.name ?? undefined,
    };
    tokenStore.set(userId, tokenEntry);
    return true;
  } catch (error) {
    console.error("OneDrive OAuth callback error:", error);
    return false;
  }
}

/**
 * 檢查是否已連接且 token 有效
 */
export function isConnected(userId: string): boolean {
  const token = tokenStore.get(userId);
  if (!token) return false;
  return token.expiresAt > Date.now();
}

/**
 * 取得連接狀態詳情
 */
export function getConnectionInfo(userId: string): { connected: boolean; userEmail?: string; userName?: string } {
  const token = tokenStore.get(userId);
  if (!token || token.expiresAt <= Date.now()) {
    return { connected: false };
  }
  return {
    connected: true,
    userEmail: token.userEmail,
    userName: token.userName,
  };
}

/**
 * 斷開連接
 */
export function disconnect(userId: string): void {
  tokenStore.delete(userId);
}

// ── Graph Client ──────────────────────────────────────────────────────────────

function getGraphClient(userId: string): Client {
  const token = tokenStore.get(userId);
  if (!token || token.expiresAt <= Date.now()) {
    throw new Error("OneDrive 未連接或 token 已過期，請重新授權");
  }
  return Client.init({
    authProvider: (done) => done(null, token.accessToken),
  });
}

// ── File Operations ───────────────────────────────────────────────────────────

/**
 * 列出 OneDrive 檔案
 */
export async function listFiles(userId: string, folderId?: string): Promise<OneDriveFile[]> {
  const client = getGraphClient(userId);
  const path = folderId
    ? `/me/drive/items/${folderId}/children`
    : "/me/drive/root/children";

  const response = await client.api(path).get();
  return (response.value || []).map((item: any) => ({
    id: item.id,
    name: item.name,
    type: item.folder ? "folder" : "file",
    size: item.size,
    mimeType: item.file?.mimeType,
    lastModified: item.lastModifiedDateTime,
    webUrl: item.webUrl,
  }));
}

/**
 * 取得檔案內容（文字類型）
 */
export async function getFileContent(userId: string, fileId: string): Promise<{ content: string; mimeType: string; name: string }> {
  const client = getGraphClient(userId);

  const metadata = await client.api(`/me/drive/items/${fileId}`).get();
  const mimeType: string = metadata.file?.mimeType || "application/octet-stream";
  const name: string = metadata.name;

  // Word 文件用 Graph 轉純文字
  if (mimeType.includes("wordprocessingml") || /\.docx?$/i.test(name)) {
    try {
      const content = await client.api(`/me/drive/items/${fileId}/content?format=text`).get();
      return { content: content.toString(), mimeType, name };
    } catch {
      return { content: `[無法轉換 Word 文件: ${name}]`, mimeType, name };
    }
  }

  // 文字類型直接讀
  const textTypes = ["text/", "application/json", "application/xml"];
  const isText = textTypes.some(t => mimeType.includes(t)) || /\.(txt|md|csv|json|html|xml)$/i.test(name);

  if (isText) {
    const content = await client.api(`/me/drive/items/${fileId}/content`).get();
    return { content: content.toString(), mimeType, name };
  }

  return { content: `[不支援的檔案類型: ${name} (${mimeType})]`, mimeType, name };
}

/**
 * 搜尋檔案
 */
export async function searchFiles(userId: string, query: string): Promise<OneDriveFile[]> {
  const client = getGraphClient(userId);
  const response = await client
    .api(`/me/drive/root/search(q='${encodeURIComponent(query)}')`)
    .get();

  return (response.value || []).map((item: any) => ({
    id: item.id,
    name: item.name,
    type: item.folder ? "folder" : "file",
    size: item.size,
    mimeType: item.file?.mimeType,
    lastModified: item.lastModifiedDateTime,
    webUrl: item.webUrl,
  }));
}

// ── Knowledge Base Scan ───────────────────────────────────────────────────────

/**
 * 掃描 OneDrive 根目錄的文字檔，供 AI 知識庫使用
 * 限制：最多 20 個文字檔，每檔最多 50KB
 */
export async function scanKnowledgeBase(userId: string): Promise<Array<{ name: string; content: string; fileId: string; mimeType: string }>> {
  const files = await listFiles(userId);

  const textFiles = files.filter(f => {
    if (f.type === "folder") return false;
    return (
      /\.(txt|md|docx?|csv|json)$/i.test(f.name) ||
      f.mimeType?.startsWith("text/") ||
      f.mimeType?.includes("wordprocessingml")
    );
  }).slice(0, 20);

  const results: Array<{ name: string; content: string; fileId: string; mimeType: string }> = [];

  for (const file of textFiles) {
    try {
      if ((file.size || 0) > 50 * 1024) {
        results.push({
          name: file.name,
          content: `[檔案過大，跳過: ${Math.round((file.size || 0) / 1024)}KB]`,
          fileId: file.id,
          mimeType: file.mimeType || "",
        });
        continue;
      }
      const { content, mimeType } = await getFileContent(userId, file.id);
      results.push({ name: file.name, content, fileId: file.id, mimeType });
    } catch {
      results.push({ name: file.name, content: "[讀取失敗]", fileId: file.id, mimeType: file.mimeType || "" });
    }
  }

  return results;
}
