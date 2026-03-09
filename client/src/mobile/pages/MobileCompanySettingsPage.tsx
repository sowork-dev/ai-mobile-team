/**
 * 企業設定頁面 — 標準表單式公司基本資料設定
 * 取代原本的品牌定位對話流程
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import MobileHeader from "../components/MobileHeader";
import { useI18n } from "@/i18n";
import { trpc } from "@/lib/trpc";

interface Brand {
  name: string;
  products: string[];
}

interface CompanyInfo {
  companyName: string;
  industry: string;
  companySize: string;
  address: string;
  contactName: string;
  contactPhone: string;
  website: string;
  description: string;
  brands: Brand[];
}

const INDUSTRY_OPTIONS = [
  "科技/軟體", "電子商務", "金融/保險", "製造業", "零售/批發",
  "醫療/健康", "教育/培訓", "媒體/娛樂", "餐飲/服務", "其他"
];

const COMPANY_SIZE_OPTIONS = [
  "1-10 人", "11-50 人", "51-200 人", "201-500 人", "500 人以上"
];


// ── Twilio 設定區塊 ─────────────────────────────────────────────────────────

function TwilioSettingsSection({ locale }: { locale: string }) {
  const STORAGE_KEY = "twilioSettings";
  const [accountSid, setAccountSid] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [fromNumber, setFromNumber] = useState("");
  const [saved, setSaved] = useState(false);

  // 載入已存的設定
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setAccountSid(parsed.accountSid || "");
        setAuthToken(parsed.authToken || "");
        setFromNumber(parsed.fromNumber || "");
      }
    } catch { /* ignore */ }
  }, []);

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ accountSid, authToken, fromNumber }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    toast.success(locale === "zh" ? "Twilio 設定已儲存" : "Twilio settings saved");
  };

  const isConfigured = accountSid.trim() && authToken.trim() && fromNumber.trim();

  return (
    <div className="bg-white mx-4 mt-4 rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#F22F46] rounded-md flex items-center justify-center flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6 6l.86-.86a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16z" />
            </svg>
          </div>
          <h2 className="font-semibold text-gray-900">
            {locale === "zh" ? "Twilio 電話整合" : "Twilio Phone Integration"}
          </h2>
          {isConfigured && (
            <span className="ml-auto text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">
              {locale === "zh" ? "已設定" : "Configured"}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {locale === "zh"
            ? "設定後可從聯絡人頁面直接撥打電話（需要 Twilio 帳號）"
            : "Configure to dial contacts directly from the app (requires Twilio account)"}
        </p>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Account SID</label>
          <input
            type="text"
            value={accountSid}
            onChange={(e) => setAccountSid(e.target.value)}
            placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 font-mono"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Auth Token</label>
          <input
            type="password"
            value={authToken}
            onChange={(e) => setAuthToken(e.target.value)}
            placeholder="•••••••••••••••••••••••••••••••"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 font-mono"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            {locale === "zh" ? "發話號碼 (From Number)" : "From Number"}
          </label>
          <input
            type="tel"
            value={fromNumber}
            onChange={(e) => setFromNumber(e.target.value)}
            placeholder="+1234567890"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 font-mono"
          />
        </div>
        <button
          onClick={handleSave}
          className={`w-full py-2.5 rounded-xl text-sm font-semibold active:scale-95 transition-transform ${
            saved ? "bg-green-600 text-white" : "bg-gray-900 text-white"
          }`}
        >
          {saved
            ? (locale === "zh" ? "✓ 已儲存" : "✓ Saved")
            : (locale === "zh" ? "儲存 Twilio 設定" : "Save Twilio Settings")}
        </button>
        <p className="text-xs text-gray-400 text-center">
          {locale === "zh"
            ? "設定儲存於本機，伺服器需另外設定環境變數才能使用"
            : "Settings are stored locally. Server requires TWILIO_* environment variables to activate"}
        </p>
      </div>
    </div>
  );
}

// ── 任務系統整合 ────────────────────────────────────────────────

const TASK_SYSTEMS = [
  { id: "clickup", name: "ClickUp", emoji: "🟣", color: "#7B68EE" },
  { id: "asana", name: "Asana", emoji: "🎯", color: "#F06A6A" },
  { id: "notion", name: "Notion", emoji: "⬛", color: "#374151" },
  { id: "monday", name: "Monday.com", emoji: "🟡", color: "#F6AE2D" },
];

function TaskIntegrationSection({ locale }: { locale: string }) {
  const [connections, setConnections] = useState<Record<string, { connected: boolean; apiKey: string }>>({});
  const [showModalFor, setShowModalFor] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState("");

  useEffect(() => {
    const loaded: Record<string, { connected: boolean; apiKey: string }> = {};
    // Demo: Sarah (groupm-digital) 預設 ClickUp 已連接
    const demoPersonaId = localStorage.getItem("demoPersonaId");
    for (const sys of TASK_SYSTEMS) {
      const key = `taskIntegration_${sys.id}`;
      try {
        const stored = JSON.parse(localStorage.getItem(key) || "null");
        if (stored) {
          loaded[sys.id] = stored;
        } else if (sys.id === "clickup" && demoPersonaId === "groupm-digital") {
          const defaultVal = { connected: true, apiKey: "***" };
          loaded[sys.id] = defaultVal;
          localStorage.setItem(key, JSON.stringify(defaultVal));
        }
      } catch { /* ignore */ }
    }
    setConnections(loaded);
  }, []);

  const handleConnect = (sysId: string) => {
    const key = `taskIntegration_${sysId}`;
    const val = { connected: true, apiKey: apiKeyInput || "***" };
    localStorage.setItem(key, JSON.stringify(val));
    setConnections(prev => ({ ...prev, [sysId]: val }));
    setShowModalFor(null);
    setApiKeyInput("");
    toast.success(
      locale === "zh"
        ? `已連接 ${TASK_SYSTEMS.find(s => s.id === sysId)?.name}，同步規則：任務完成後自動推送`
        : `Connected to ${TASK_SYSTEMS.find(s => s.id === sysId)?.name}. Tasks will auto-sync on completion.`
    );
  };

  const handleDisconnect = (sysId: string) => {
    localStorage.removeItem(`taskIntegration_${sysId}`);
    setConnections(prev => {
      const next = { ...prev };
      delete next[sysId];
      return next;
    });
  };

  return (
    <div className="bg-white mx-4 mt-4 rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
              <polyline points="9 16 11 18 15 14" />
            </svg>
          </div>
          <h2 className="font-semibold text-gray-900">
            {locale === "zh" ? "任務系統連接" : "Task Management Integration"}
          </h2>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {locale === "zh"
            ? "連接後，AI 完成任務時將自動同步到您的任務系統"
            : "After connecting, AI task completions will auto-sync to your task system"}
        </p>
      </div>

      <div className="divide-y divide-gray-50">
        {TASK_SYSTEMS.map(sys => {
          const conn = connections[sys.id];
          return (
            <div key={sys.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-xl">{sys.emoji}</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">{sys.name}</p>
                  {conn?.connected && (
                    <p className="text-xs text-green-600">
                      {locale === "zh" ? "✓ 任務完成後自動推送" : "✓ Auto-sync on task completion"}
                    </p>
                  )}
                </div>
              </div>
              {conn?.connected ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                    {locale === "zh" ? "已連接" : "Connected"}
                  </span>
                  <button
                    onClick={() => handleDisconnect(sys.id)}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                  >
                    {locale === "zh" ? "斷開" : "Disconnect"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setShowModalFor(sys.id); setApiKeyInput(""); }}
                  className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg active:opacity-70 transition-opacity"
                >
                  {locale === "zh" ? "連接" : "Connect"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* API Key 輸入 Modal */}
      {showModalFor && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setShowModalFor(null)}>
          <div className="w-full max-w-md bg-white rounded-t-3xl p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              {locale === "zh"
                ? `連接 ${TASK_SYSTEMS.find(s => s.id === showModalFor)?.name}`
                : `Connect ${TASK_SYSTEMS.find(s => s.id === showModalFor)?.name}`}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              {locale === "zh"
                ? "請輸入您的 API Key，連接後任務完成時將自動同步"
                : "Enter your API Key to enable automatic task sync"}
            </p>
            <input
              type="text"
              value={apiKeyInput}
              onChange={e => setApiKeyInput(e.target.value)}
              placeholder="API Key"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono mb-3"
              autoFocus
            />
            <button
              onClick={() => handleConnect(showModalFor)}
              className="w-full py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl active:opacity-80 transition-opacity"
            >
              {locale === "zh" ? "確認連接" : "Connect"}
            </button>
            <button
              onClick={() => setShowModalFor(null)}
              className="w-full py-2.5 mt-2 text-sm text-gray-500"
            >
              {locale === "zh" ? "取消" : "Cancel"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 品牌模板設定 ────────────────────────────────────────────────

function BrandTemplateSection({ locale }: { locale: string }) {
  const [templateStatus, setTemplateStatus] = useState<{ exists: boolean; primaryColor?: string; uploadedAt?: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 查詢現有模板狀態
  useEffect(() => {
    fetch("/api/template/status?userId=dev-user-001")
      .then(r => r.json())
      .then(setTemplateStatus)
      .catch(() => setTemplateStatus({ exists: false }));
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".pptx")) {
      toast.error(locale === "zh" ? "請上傳 .pptx 格式的模板文件" : "Please upload a .pptx template file");
      return;
    }

    setUploading(true);
    toast.info(locale === "zh" ? "正在分析模板配色..." : "Analyzing template colors...");

    try {
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      const res = await fetch("/api/template/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64, userId: "dev-user-001" }),
      });

      if (!res.ok) throw new Error("上傳失敗");
      const data = await res.json();
      setTemplateStatus({ exists: true, primaryColor: data.primaryColor, uploadedAt: new Date().toISOString() });
      toast.success(locale === "zh" ? "品牌模板已套用！導出 PPT 時將使用您的配色。" : "Brand template applied! Your color scheme will be used for PPT exports.");
    } catch (err: any) {
      toast.error((locale === "zh" ? "上傳失敗：" : "Upload failed: ") + (err.message || ""));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [locale]);

  const handleRemove = async () => {
    try {
      await fetch("/api/template/status?userId=dev-user-001&action=remove");
      setTemplateStatus({ exists: false });
      toast.success(locale === "zh" ? "品牌模板已移除" : "Brand template removed");
    } catch { /* ignore */ }
  };

  return (
    <div className="bg-white mx-4 mt-4 rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-purple-600 rounded-md flex items-center justify-center flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
            </svg>
          </div>
          <h2 className="font-semibold text-gray-900">
            {locale === "zh" ? "品牌模板設定" : "Brand Template"}
          </h2>
          {templateStatus?.exists && (
            <span className="ml-auto text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: templateStatus.primaryColor ? `#${templateStatus.primaryColor}` : "#7C3AED" }}
              />
              {locale === "zh" ? "已套用品牌模板" : "Brand template applied"}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {locale === "zh"
            ? "上傳您的 .pptx 品牌模板，系統將自動提取主色並套用到所有 PPT 導出"
            : "Upload your .pptx brand template. The primary color will be extracted and applied to all PPT exports."}
        </p>
      </div>

      <div className="p-4 space-y-3">
        {templateStatus?.exists ? (
          <>
            <div className="flex items-center gap-3 bg-purple-50 rounded-xl p-3">
              <div
                className="w-10 h-10 rounded-lg flex-shrink-0 border border-white shadow-sm"
                style={{ backgroundColor: templateStatus.primaryColor ? `#${templateStatus.primaryColor}` : "#7C3AED" }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-purple-900">
                  {locale === "zh" ? "品牌主色" : "Brand Primary Color"}
                </p>
                <p className="text-xs text-purple-600 font-mono">
                  #{templateStatus.primaryColor ?? "——"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex-1 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-xl disabled:opacity-50 active:scale-95 transition-transform"
              >
                {uploading
                  ? (locale === "zh" ? "分析中..." : "Analyzing...")
                  : (locale === "zh" ? "重新上傳模板" : "Re-upload template")}
              </button>
              <button
                onClick={handleRemove}
                className="px-4 py-2.5 border border-gray-200 text-gray-600 text-sm rounded-xl active:scale-95 transition-transform"
              >
                {locale === "zh" ? "移除" : "Remove"}
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full py-3.5 border-2 border-dashed border-purple-300 rounded-xl text-sm text-purple-600 font-medium hover:border-purple-400 disabled:opacity-50 active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                </svg>
                {locale === "zh" ? "正在分析配色..." : "Analyzing colors..."}
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1M16 8l-4-4-4 4M12 4v12" />
                </svg>
                {locale === "zh" ? "上傳 .pptx 品牌模板" : "Upload .pptx brand template"}
              </>
            )}
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pptx"
          className="hidden"
          onChange={handleFileChange}
        />
        <p className="text-xs text-gray-400 text-center">
          {locale === "zh"
            ? "支援 .pptx 格式，系統自動提取主色套用至所有匯出"
            : "Supports .pptx format. Primary color is automatically extracted and applied to all exports."}
        </p>
      </div>
    </div>
  );
}

// ── 日曆整合區塊 ────────────────────────────────────────────────

function CalendarIntegrationSection({ locale }: { locale: string }) {
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("");
  const [microsoftConnected, setMicrosoftConnected] = useState(false);
  const [microsoftEmail, setMicrosoftEmail] = useState("");

  // 監聽 OAuth popup 回調
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "calendar-connected") {
        if (e.data.provider === "google") {
          setGoogleConnected(true);
          setGoogleEmail(e.data.email || "user@gmail.com");
        } else if (e.data.provider === "microsoft") {
          setMicrosoftConnected(true);
          setMicrosoftEmail(e.data.email || "user@company.com");
        }
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const connectGoogle = async () => {
    const resp = await fetch("/api/calendar/auth/google");
    const { url } = await resp.json();
    window.open(url, "_blank", "width=600,height=700");
  };

  const connectMicrosoft = async () => {
    const resp = await fetch("/api/calendar/auth/microsoft");
    const { url } = await resp.json();
    window.open(url, "_blank", "width=600,height=700");
  };

  return (
    <div className="bg-white mx-4 mt-4 rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-emerald-500 rounded-md flex items-center justify-center flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <h2 className="font-semibold text-gray-900">
            {locale === "zh" ? "日曆整合" : "Calendar Integration"}
          </h2>
        </div>
        <p className="text-xs text-gray-400 mt-1 ml-8">
          {locale === "zh" ? "連接後，幕僚長可自動查詢空檔並建立會議" : "Let your Chief of Staff check availability and create meetings automatically"}
        </p>
      </div>
      <div className="p-4 space-y-3">
        {/* Google Calendar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Google Calendar</p>
              {googleConnected && <p className="text-xs text-gray-400">{googleEmail}</p>}
            </div>
          </div>
          {googleConnected ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                {locale === "zh" ? "已連接" : "Connected"}
              </span>
              <button onClick={() => setGoogleConnected(false)} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
                {locale === "zh" ? "斷開" : "Disconnect"}
              </button>
            </div>
          ) : (
            <button
              onClick={connectGoogle}
              className="px-3 py-1.5 bg-[#4285F4] text-white text-xs font-semibold rounded-lg hover:bg-[#3367d6] active:scale-95 transition-all"
            >
              {locale === "zh" ? "連接" : "Connect"}
            </button>
          )}
        </div>

        <div className="h-px bg-gray-100" />

        {/* Outlook Calendar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#0078D4] rounded-lg flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="1" y="1" width="10" height="10" fill="#F25022"/>
                <rect x="13" y="1" width="10" height="10" fill="#7FBA00"/>
                <rect x="1" y="13" width="10" height="10" fill="#00A4EF"/>
                <rect x="13" y="13" width="10" height="10" fill="#FFB900"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Outlook Calendar</p>
              {microsoftConnected && <p className="text-xs text-gray-400">{microsoftEmail}</p>}
            </div>
          </div>
          {microsoftConnected ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                {locale === "zh" ? "已連接" : "Connected"}
              </span>
              <button onClick={() => setMicrosoftConnected(false)} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
                {locale === "zh" ? "斷開" : "Disconnect"}
              </button>
            </div>
          ) : (
            <button
              onClick={connectMicrosoft}
              className="px-3 py-1.5 bg-[#0078D4] text-white text-xs font-semibold rounded-lg hover:bg-[#106EBE] active:scale-95 transition-all"
            >
              {locale === "zh" ? "連接" : "Connect"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MobileCompanySettingsPage() {
  const [, navigate] = useLocation();
  const { locale, t } = useI18n();
  const [isSaving, setIsSaving] = useState(false);
  const [_hasChanges, setHasChanges] = useState(false);
  
  const [formData, setFormData] = useState<CompanyInfo>({
    companyName: "",
    industry: "",
    companySize: "",
    address: "",
    contactName: "",
    contactPhone: "",
    website: "",
    description: "",
    brands: [],
  });
  
  const [isFetchingBrands, setIsFetchingBrands] = useState(false);

  const [errors, setErrors] = useState<Partial<Record<keyof CompanyInfo, string>>>({});

  // 載入已存的資料
  useEffect(() => {
    const saved = localStorage.getItem("companySettings");
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
  }, []);

  const updateField = (field: keyof CompanyInfo, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    // 清除該欄位的錯誤
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CompanyInfo, string>> = {};
    
    if (!formData.companyName.trim()) {
      newErrors.companyName = locale === "zh" ? "請輸入公司名稱" : "Please enter company name";
    }
    if (!formData.industry) {
      newErrors.industry = locale === "zh" ? "請選擇產業類別" : "Please select an industry";
    }
    if (!formData.companySize) {
      newErrors.companySize = locale === "zh" ? "請選擇公司規模" : "Please select company size";
    }
    if (!formData.contactName.trim()) {
      newErrors.contactName = locale === "zh" ? "請輸入聯絡人姓名" : "Please enter contact name";
    }
    if (!formData.contactPhone.trim()) {
      newErrors.contactPhone = locale === "zh" ? "請輸入聯絡電話" : "Please enter phone number";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [saveSuccess, setSaveSuccess] = useState(false);

  // Web 爬取 mutation
  const crawlMutation = trpc.company.crawlWebsite.useMutation();

  // 從網站抓取品牌和產品（真正的 Web 爬取）
  const fetchBrandsFromWebsite = async () => {
    if (!formData.website.trim()) {
      toast.error(locale === "zh" ? "請先輸入公司網站" : "Please enter the website first");
      return;
    }

    // 驗證 URL 格式
    let url = formData.website.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }
    
    try {
      new URL(url);
    } catch {
      toast.error(locale === "zh" ? "請輸入有效的網址" : "Please enter a valid URL");
      return;
    }

    setIsFetchingBrands(true);
    toast.info(locale === "zh" ? "正在分析網站內容..." : "Analyzing website content...");

    try {
      // 呼叫真正的 Web 爬取 API
      const result = await crawlMutation.mutateAsync({ url });
      
      if (!result.success) {
        toast.error(result.error || (locale === "zh" ? "分析失敗" : "Analysis failed"));
        return;
      }

      // 更新品牌資料
      if (result.brands && result.brands.length > 0) {
        setFormData(prev => ({ 
          ...prev, 
          brands: result.brands,
          // 如果有公司名稱且目前是空的，自動填入
          companyName: prev.companyName || result.companyName || "",
          industry: prev.industry || result.industry || "",
          description: prev.description || result.description || "",
        }));
        setHasChanges(true);
        toast.success(locale === "zh" ? `找到 ${result.brands.length} 個品牌！儲存後將自動建立群組` : `Found ${result.brands.length} brands! Groups will be created on save`);
      } else {
        toast.warning(locale === "zh" ? "未找到品牌資訊，請手動新增" : "No brands found, please add manually");
      }
    } catch (error: any) {
      console.error("Crawl error:", error);
      toast.error(error.message || (locale === "zh" ? "抓取失敗，請稍後再試" : "Fetch failed, please try again"));
    } finally {
      setIsFetchingBrands(false);
    }
  };

  // 新增品牌
  const addBrand = () => {
    setFormData(prev => ({
      ...prev,
      brands: [...prev.brands, { name: "", products: [] }]
    }));
    setHasChanges(true);
  };

  // 更新品牌名稱
  const updateBrandName = (index: number, name: string) => {
    setFormData(prev => ({
      ...prev,
      brands: prev.brands.map((b, i) => i === index ? { ...b, name } : b)
    }));
    setHasChanges(true);
  };

  // 更新產品（逗號分隔）
  const updateBrandProducts = (index: number, productsStr: string) => {
    const products = productsStr.split(/[,，]/).map(p => p.trim()).filter(Boolean);
    setFormData(prev => ({
      ...prev,
      brands: prev.brands.map((b, i) => i === index ? { ...b, products } : b)
    }));
    setHasChanges(true);
  };

  // 刪除品牌
  const removeBrand = (index: number) => {
    setFormData(prev => ({
      ...prev,
      brands: prev.brands.filter((_, i) => i !== index)
    }));
    setHasChanges(true);
  };

  // ── OneDrive 整合 ──────────────────────────────────────────────────────────
  const onedrivePopupRef = useRef<Window | null>(null);

  const onedriveStatus = trpc.onedrive.status.useQuery(undefined, {
    refetchInterval: 5000, // 每 5 秒輪詢一次（等待 OAuth 完成）
  });
  const onedriveConnect = trpc.onedrive.connect.useMutation();
  const onedriveDisconnect = trpc.onedrive.disconnect.useMutation();
  const onedriveListFiles = trpc.onedrive.listFiles.useQuery(undefined, {
    enabled: !!onedriveStatus.data?.connected,
  });
  const onedriveScanKnowledge = trpc.onedrive.scanKnowledge.useMutation();

  const isOnedriveConnected = onedriveStatus.data?.connected ?? false;

  // 開啟 OAuth 授權視窗
  const handleOnedriveConnect = async () => {
    try {
      const { authUrl } = await onedriveConnect.mutateAsync({});
      const popup = window.open(authUrl, "onedrive-auth", "width=600,height=700,scrollbars=yes");
      onedrivePopupRef.current = popup;

      // 監聽 popup 送回的 message
      const handler = (e: MessageEvent) => {
        if (e.data?.type === "onedrive-connected") {
          toast.success(locale === "zh" ? "OneDrive 連接成功！" : "OneDrive connected!");
          onedriveStatus.refetch();
          onedriveListFiles.refetch();
          window.removeEventListener("message", handler);
        }
      };
      window.addEventListener("message", handler);
    } catch (err: any) {
      toast.error((locale === "zh" ? "無法取得授權網址：" : "Cannot get auth URL: ") + (err.message || (locale === "zh" ? "請稍後再試" : "Please try again")));
    }
  };

  // 掃描 OneDrive 知識庫
  const handleScanKnowledge = async () => {
    try {
      toast.info(locale === "zh" ? "正在掃描 OneDrive 知識庫..." : "Scanning OneDrive knowledge base...");
      const result = await onedriveScanKnowledge.mutateAsync({});
      toast.success(locale === "zh" ? `掃描完成！找到 ${result.count} 個文件` : `Scan complete! Found ${result.count} files`);
    } catch (err: any) {
      toast.error((locale === "zh" ? "掃描失敗：" : "Scan failed: ") + (err.message || (locale === "zh" ? "請確認 OneDrive 已連接" : "Please confirm OneDrive is connected")));
    }
  };

  // 斷開 OneDrive
  const handleOnedriveDisconnect = async () => {
    await onedriveDisconnect.mutateAsync({});
    toast.success(locale === "zh" ? "已斷開 OneDrive 連接" : "OneDrive disconnected");
    onedriveStatus.refetch();
  };
  // ── /OneDrive ──────────────────────────────────────────────────────────────

  // 建立品牌群組 mutation
  const createGroupsMutation = trpc.company.createBrandGroups.useMutation();

  const handleSave = async () => {
    if (!validate()) {
      toast.error(t("company.fillRequired"));
      return;
    }

    setIsSaving(true);
    
    try {
      // 1. 儲存企業資料
      localStorage.setItem("companySettings", JSON.stringify(formData));
      
      // 2. 如果有品牌，自動建立群組並推薦 AI 員工
      if (formData.brands.length > 0) {
        toast.info(locale === "zh" ? "正在為品牌建立群組..." : "Creating brand groups...");
        
        const result = await createGroupsMutation.mutateAsync({
          brands: formData.brands,
        });
        
        if (result.success) {
          toast.success(locale === "zh" ? `已建立 ${result.groups.length} 個品牌群組，並推薦了 AI 員工！` : `Created ${result.groups.length} brand groups with AI agent recommendations!`);
        }
      } else {
        toast.success(locale === "zh" ? "企業資料已儲存！" : "Company info saved!");
      }
      
      setHasChanges(false);
      setSaveSuccess(true);
      
      // 1.5 秒後返回 profile 頁面
      setTimeout(() => {
        navigate("/profile");
      }, 1500);
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error((locale === "zh" ? "儲存失敗：" : "Save failed: ") + (error.message || (locale === "zh" ? "請稍後再試" : "Please try again")));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <MobileHeader 
        title={locale === "zh" ? "企業設定" : "Company Settings"} 
        showBack 
        onBack={() => navigate("/profile")}
      />

      <div className="flex-1 overflow-y-auto">
        {/* 公司基本資訊 */}
        <div className="bg-white mx-4 mt-4 rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">
              {locale === "zh" ? "公司基本資訊" : "Company Information"}
            </h2>
          </div>

          <div className="p-4 space-y-4">
            {/* 公司名稱 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t("company.companyNameLabel")} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => updateField("companyName", e.target.value)}
                placeholder="例如：SoWork AI 股份有限公司"
                className={`w-full px-3 py-2.5 border rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 transition-colors ${errors.companyName ? "border-red-400" : "border-gray-200"}`}
              />
              {errors.companyName && (
                <p className="mt-1 text-xs text-red-500">{errors.companyName}</p>
              )}
            </div>

            {/* 產業類別 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t("company.industryLabel")} <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.industry}
                onChange={(e) => updateField("industry", e.target.value)}
                className={`w-full px-3 py-2.5 border rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 transition-colors appearance-none ${errors.industry ? "border-red-400" : "border-gray-200"}`}
              >
                <option value="">{locale === "zh" ? "請選擇產業" : "Select industry"}</option>
                {INDUSTRY_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              {errors.industry && (
                <p className="mt-1 text-xs text-red-500">{errors.industry}</p>
              )}
            </div>

            {/* 公司規模 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t("company.companySizeLabel")} <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {COMPANY_SIZE_OPTIONS.map(size => (
                  <button
                    key={size}
                    onClick={() => updateField("companySize", size)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      formData.companySize === size
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              {errors.companySize && (
                <p className="mt-1 text-xs text-red-500">{errors.companySize}</p>
              )}
            </div>

            {/* 公司地址 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t("company.addressLabel")}
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => updateField("address", e.target.value)}
                placeholder="例如：台北市信義區信義路五段 7 號"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 transition-colors"
              />
            </div>

            {/* 公司網站 + 自動抓取 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t("company.websiteLabel")}
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => updateField("website", e.target.value)}
                  placeholder="https://www.example.com"
                  className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 transition-colors"
                />
                <button
                  onClick={fetchBrandsFromWebsite}
                  disabled={isFetchingBrands || !formData.website.trim()}
                  className="px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl disabled:opacity-50 active:scale-95 transition-transform flex items-center gap-1.5 whitespace-nowrap"
                >
                  {isFetchingBrands ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                        <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                      </svg>
                      {t("company.fetchingWebsite")}
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      </svg>
                      {t("company.fetchWebsite")}
                    </>
                  )}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
                </svg>
                {locale === "zh" ? "輸入網址後點「抓取」，自動建立品牌與產品，並為每個品牌建立群組" : "Enter URL and click \"Fetch\" to auto-create brands, products, and groups"}
              </p>
            </div>
          </div>
        </div>

        {/* 聯絡人資訊 */}
        <div className="bg-white mx-4 mt-4 rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">
              {locale === "zh" ? "聯絡人資訊" : "Contact Information"}
            </h2>
          </div>

          <div className="p-4 space-y-4">
            {/* 聯絡人姓名 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t("company.contactNameLabel")} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.contactName}
                onChange={(e) => updateField("contactName", e.target.value)}
                placeholder={locale === "zh" ? "請輸入姓名" : "Enter name"}
                className={`w-full px-3 py-2.5 border rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 transition-colors ${errors.contactName ? "border-red-400" : "border-gray-200"}`}
              />
              {errors.contactName && (
                <p className="mt-1 text-xs text-red-500">{errors.contactName}</p>
              )}
            </div>

            {/* 聯絡電話 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t("company.contactPhoneLabel")} <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => updateField("contactPhone", e.target.value)}
                placeholder="例如：02-1234-5678"
                className={`w-full px-3 py-2.5 border rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 transition-colors ${errors.contactPhone ? "border-red-400" : "border-gray-200"}`}
              />
              {errors.contactPhone && (
                <p className="mt-1 text-xs text-red-500">{errors.contactPhone}</p>
              )}
            </div>
          </div>
        </div>

        {/* 品牌與產品（每個品牌會自動建立群組） */}
        <div className="bg-white mx-4 mt-4 rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">
                {locale === "zh" ? "品牌與產品" : "Brands & Products"}
              </h2>
              {formData.brands.length > 0 && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {formData.brands.length} {locale === "zh" ? "個品牌" : "brands"}
                </span>
              )}
            </div>
            {formData.brands.length > 0 && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                {t("company.autoCreateGroups")}
              </p>
            )}
          </div>

          <div className="p-4 space-y-4">
            {formData.brands.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                    <line x1="7" y1="7" x2="7.01" y2="7"/>
                  </svg>
                </div>
                <p className="text-sm text-gray-500">{t("company.noBrands")}</p>
                <p className="text-xs text-gray-400 mt-1">{t("company.addBrandHint")}</p>
              </div>
            ) : (
              formData.brands.map((brand, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={brand.name}
                      onChange={(e) => updateBrandName(index, e.target.value)}
                      placeholder={t("company.brandNamePlaceholder")}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                    <button
                      onClick={() => removeBrand(index)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 active:bg-red-100"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">{t("company.productsLabel")}</label>
                    <input
                      type="text"
                      value={brand.products.join(", ")}
                      onChange={(e) => updateBrandProducts(index, e.target.value)}
                      placeholder="產品A, 產品B, 產品C"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>
                  {brand.products.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {brand.products.map((product, pIndex) => (
                        <span key={pIndex} className="text-xs bg-white text-gray-600 px-2 py-1 rounded-full border border-gray-200">
                          {product}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}

            <button
              onClick={addBrand}
              className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              {t("company.addBrand")}
            </button>
          </div>
        </div>

        {/* OneDrive 知識庫整合 */}
        <div className="bg-white mx-4 mt-4 rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              {/* OneDrive 圖示 */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6.5 20C4.01 20 2 17.99 2 15.5C2 13.24 3.66 11.37 5.83 11.04C5.64 10.56 5.5 10.05 5.5 9.5C5.5 7.01 7.51 5 10 5C11.78 5 13.32 6.01 14.1 7.49C14.56 7.18 15.11 7 15.7 7C17.52 7 19 8.48 19 10.3C19 10.45 18.99 10.6 18.97 10.75C21.22 11.14 23 13.14 23 15.5C23 17.99 20.99 20 18.5 20H6.5Z" fill="#0078D4"/>
              </svg>
              <h2 className="font-semibold text-gray-900">
                {locale === "zh" ? "OneDrive 知識庫" : "OneDrive Knowledge Base"}
              </h2>
              {isOnedriveConnected && (
                <span className="ml-auto text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                  {locale === "zh" ? "已連接" : "Connected"}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {locale === "zh" ? "連接 OneDrive 後，AI 員工可掃描您的文件作為知識庫" : "Connect OneDrive so AI agents can scan your documents as knowledge base"}
            </p>
          </div>

          <div className="p-4 space-y-3">
            {isOnedriveConnected ? (
              <>
                {/* 已連接狀態 */}
                <div className="flex items-center gap-3 bg-blue-50 rounded-xl p-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-blue-900">
                      {onedriveStatus.data?.userName || (locale === "zh" ? "Microsoft 帳號" : "Microsoft Account")}
                    </p>
                    <p className="text-xs text-blue-600 truncate">
                      {onedriveStatus.data?.userEmail || (locale === "zh" ? "已連接" : "Connected")}
                    </p>
                  </div>
                </div>

                {/* 文件列表 */}
                {onedriveListFiles.data?.files && onedriveListFiles.data.files.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs font-medium text-gray-600 mb-2">
                      {locale === "zh" ? `根目錄檔案（${onedriveListFiles.data.files.length} 個）` : `Root files (${onedriveListFiles.data.files.length})`}
                    </p>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {onedriveListFiles.data.files.slice(0, 10).map((file) => (
                        <div key={file.id} className="flex items-center gap-2 text-xs text-gray-600">
                          {file.type === "folder" ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="#F59E0B" stroke="none"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="#6B7280" stroke="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8" fill="none" stroke="white" strokeWidth="2"/></svg>
                          )}
                          <span className="truncate">{file.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 操作按鈕 */}
                <div className="flex gap-2">
                  <button
                    onClick={handleScanKnowledge}
                    disabled={onedriveScanKnowledge.isPending}
                    className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl disabled:opacity-50 active:scale-95 transition-transform flex items-center justify-center gap-1.5"
                  >
                    {onedriveScanKnowledge.isPending ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                          <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                        </svg>
                        {t("company.scanning")}
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                        </svg>
                        {t("company.scanKnowledge")}
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleOnedriveDisconnect}
                    className="px-4 py-2.5 border border-gray-200 text-gray-600 text-sm rounded-xl active:scale-95 transition-transform"
                  >
                    {t("company.disconnect")}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-500 text-center py-2">
                  {t("company.notConnected")}
                </p>
                <button
                  onClick={handleOnedriveConnect}
                  disabled={onedriveConnect.isPending}
                  className="w-full py-3 bg-[#0078D4] text-white text-sm font-medium rounded-xl disabled:opacity-50 active:scale-95 transition-transform flex items-center justify-center gap-2"
                >
                  {onedriveConnect.isPending ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                        <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                      </svg>
                      {t("company.authorizing")}
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6.5 20C4.01 20 2 17.99 2 15.5C2 13.24 3.66 11.37 5.83 11.04C5.64 10.56 5.5 10.05 5.5 9.5C5.5 7.01 7.51 5 10 5C11.78 5 13.32 6.01 14.1 7.49C14.56 7.18 15.11 7 15.7 7C17.52 7 19 8.48 19 10.3C19 10.45 18.99 10.6 18.97 10.75C21.22 11.14 23 13.14 23 15.5C23 17.99 20.99 20 18.5 20H6.5Z"/>
                      </svg>
                      {t("company.connectOnedrive")}
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Twilio 電話整合 */}
        <TwilioSettingsSection locale={locale} />

        {/* 品牌模板設定 */}
        <BrandTemplateSection locale={locale} />

        {/* 日曆整合 */}
        <CalendarIntegrationSection locale={locale} />

        {/* 任務系統整合 */}
        <TaskIntegrationSection locale={locale} />

        {/* 資料安全與隱私保護 */}
        <div className="bg-blue-50 mx-4 mt-4 rounded-2xl border border-blue-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-blue-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h2 className="font-semibold text-blue-900">
                {locale === "zh" ? "資料安全與隱私保護" : "Data Security & Privacy"}
              </h2>
            </div>
          </div>
          <div className="p-4 space-y-2.5">
            {[
              locale === "zh"
                ? "所有對話與文件儲存在您企業的專屬資料庫，不與其他用戶共享"
                : "All conversations and documents are stored in your dedicated database, never shared with other users",
              locale === "zh"
                ? "AI 模型調用使用 API 金鑰方式，您的資料不用於模型訓練"
                : "AI models are accessed via API keys — your data is never used for model training",
              locale === "zh"
                ? "支援企業自建私有部署（Private Cloud / On-Premise）"
                : "Supports enterprise private deployment (Private Cloud / On-Premise)",
              locale === "zh"
                ? "符合 ISO 27001 規範（認證中）"
                : "ISO 27001 compliant (certification in progress)",
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <svg className="flex-shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <p className="text-sm text-blue-800">{text}</p>
              </div>
            ))}
            <div className="mt-3 pt-3 border-t border-blue-200">
              <p className="text-xs text-blue-600">
                {locale === "zh"
                  ? "如需企業合規報告，請聯繫 "
                  : "For enterprise compliance reports, contact "}
                <span className="font-medium">enterprise@sowork.ai</span>
              </p>
              <button
                onClick={() => { window.location.href = "/app/security"; }}
                className="mt-2 flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 transition-colors"
              >
                {locale === "zh" ? "查看完整安全白皮書" : "View Full Security Whitepaper"}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* 公司簡介 */}
        <div className="bg-white mx-4 mt-4 mb-6 rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">
              {locale === "zh" ? "公司簡介" : "Company Description"}
            </h2>
          </div>

          <div className="p-4">
            <textarea
              value={formData.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder={locale === "zh" ? "簡述您的公司業務、產品或服務..." : "Briefly describe your company's business, products, or services..."}
              rows={4}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 transition-colors resize-none"
            />
            <p className="mt-1.5 text-xs text-gray-400 text-right">
              {formData.description.length} / 500
            </p>
          </div>
        </div>
      </div>

      {/* 底部儲存按鈕 */}
      <div className="flex-shrink-0 bg-white border-t border-gray-100 px-4 py-4">
        <button
          onClick={handleSave}
          disabled={isSaving || saveSuccess}
          className={`w-full py-3.5 rounded-xl font-semibold active:scale-[0.98] transition-all disabled:opacity-70 ${
            saveSuccess 
              ? "bg-green-600 text-white" 
              : "bg-gray-900 text-white"
          }`}
        >
          {saveSuccess ? (
            <span className="flex items-center justify-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              {t("company.saveSuccess")}
            </span>
          ) : isSaving ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
              </svg>
              {t("company.saving")}
            </span>
          ) : (
            t("company.save")
          )}
        </button>
      </div>
    </div>
  );
}
