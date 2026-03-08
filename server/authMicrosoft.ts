/**
 * Sprint 7-B: Microsoft 365 SSO
 * Microsoft OAuth2 via Microsoft Identity Platform (v2.0)
 *
 * Demo 模式下不需要真實憑證，返回假 JWT token。
 */

export interface MicrosoftUserInfo {
  microsoftId: string;
  displayName: string;
  email: string;
  jobTitle?: string;
  department?: string;
}

/** 取得 Microsoft OAuth 登入 URL */
export function getMicrosoftAuthUrl(redirectUri: string, state?: string): string {
  const tenantId = process.env.MICROSOFT_TENANT_ID || "common";
  const clientId = process.env.MICROSOFT_CLIENT_ID || "demo-ms-client-id";
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid profile email User.Read Calendars.ReadWrite Mail.Read Mail.Send offline_access",
    response_mode: "query",
    ...(state ? { state } : {}),
  });
  return `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params}`;
}

/** 用授權碼換取 tokens + 用戶資訊 */
export async function handleMicrosoftCallback(
  code: string,
  redirectUri: string
): Promise<{ tokens: { accessToken: string; refreshToken: string; expiresAt: Date }; user: MicrosoftUserInfo }> {
  const tenantId = process.env.MICROSOFT_TENANT_ID || "common";

  if (process.env.MICROSOFT_CLIENT_SECRET) {
    // 生產：真實 token exchange
    const tokenResp = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
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
    const tokenData = await tokenResp.json() as any;

    // 取得用戶資訊
    const userResp = await fetch("https://graph.microsoft.com/v1.0/me?$select=id,displayName,mail,userPrincipalName,jobTitle,department", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userResp.json() as any;

    return {
      tokens: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: new Date(Date.now() + (tokenData.expires_in ?? 3600) * 1000),
      },
      user: {
        microsoftId: userData.id,
        displayName: userData.displayName,
        email: userData.mail ?? userData.userPrincipalName,
        jobTitle: userData.jobTitle,
        department: userData.department,
      },
    };
  }

  // Demo 模式
  return {
    tokens: {
      accessToken: "demo-ms-access-token",
      refreshToken: "demo-ms-refresh-token",
      expiresAt: new Date(Date.now() + 3600 * 1000),
    },
    user: {
      microsoftId: "demo-ms-user-001",
      displayName: "Demo Microsoft User",
      email: "demo@company.onmicrosoft.com",
      jobTitle: "行銷總監",
      department: "行銷部",
    },
  };
}

/** 用 refresh_token 換新的 access_token */
export async function refreshMicrosoftToken(refreshToken: string): Promise<{ accessToken: string; expiresAt: Date }> {
  const tenantId = process.env.MICROSOFT_TENANT_ID || "common";
  if (process.env.MICROSOFT_CLIENT_SECRET) {
    const resp = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID!,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });
    const data = await resp.json() as any;
    return { accessToken: data.access_token, expiresAt: new Date(Date.now() + (data.expires_in ?? 3600) * 1000) };
  }
  return { accessToken: "demo-ms-access-token", expiresAt: new Date(Date.now() + 3600 * 1000) };
}

/** 用 access_token 取得用戶 profile（用於「已登入」狀態驗證） */
export async function getMicrosoftUserProfile(accessToken: string): Promise<MicrosoftUserInfo | null> {
  try {
    const resp = await fetch("https://graph.microsoft.com/v1.0/me?$select=id,displayName,mail,userPrincipalName,jobTitle,department", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!resp.ok) return null;
    const data = await resp.json() as any;
    return {
      microsoftId: data.id,
      displayName: data.displayName,
      email: data.mail ?? data.userPrincipalName,
      jobTitle: data.jobTitle,
      department: data.department,
    };
  } catch {
    return null;
  }
}
