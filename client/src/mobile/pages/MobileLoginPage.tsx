/**
 * Mobile 登入頁面
 * 支援 Email/密碼、Google OAuth 和 Demo 身份選擇登入
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const DEMO_PERSONAS = [
  {
    id: "groupm-digital",
    email: "groupm@demo.sowork.ai",
    icon: "🏢",
    company: "GroupM Digital",
    industry: "廣告集團",
    pain: "全球品牌 24hr 即時響應，創意人員嚴重不足",
  },
  {
    id: "loreal-apac",
    email: "loreal@demo.sowork.ai",
    icon: "💄",
    company: "L'Oréal Asia Pacific",
    industry: "美妝集團",
    pain: "12 個亞太市場在地化，速度跟不上社群節奏",
  },
  {
    id: "bcg-taipei",
    email: "bcg@demo.sowork.ai",
    icon: "📊",
    company: "BCG Taipei",
    industry: "管理顧問",
    pain: "提案品質高但時間壓力大，初級顧問產出不穩定",
  },
  {
    id: "hillhouse-capital",
    email: "hillhouse@demo.sowork.ai",
    icon: "💰",
    company: "Hillhouse Capital",
    industry: "私募基金",
    pain: "50+ 投資組合公司需行銷支援，Platform Team 只有 10 人",
  },
  {
    id: "microsoft-taiwan",
    email: "microsoft@demo.sowork.ai",
    icon: "🚀",
    company: "Microsoft Taiwan",
    industry: "科技",
    pain: "多條產品線都需行銷內容，資源嚴重分散",
  },
];

export default function MobileLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [demoLoadingId, setDemoLoadingId] = useState<string | null>(null);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");

  const loginMutation = trpc.auth.login.useMutation();
  const registerMutation = trpc.auth.register.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    try {
      if (mode === "login") {
        await loginMutation.mutateAsync({ email, password });
      } else {
        if (!name) { toast.error("請輸入姓名"); setIsLoading(false); return; }
        await registerMutation.mutateAsync({ email, password, name });
      }
      window.location.reload();
    } catch (err: any) {
      toast.error(err?.message || "操作失敗，請重試");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);
    window.location.href = "/api/auth/google?redirect=/app";
  };

  const handleDemoLogin = async (persona: typeof DEMO_PERSONAS[0]) => {
    setDemoLoadingId(persona.id);
    try {
      localStorage.setItem("demoPersonaId", persona.id);
      localStorage.setItem("useDemoData", "true");
      await loginMutation.mutateAsync({ email: persona.email, password: "demo123" });
      window.location.reload();
    } catch {
      // 即使 login API 未完整實作，demo 模式仍可進入
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M8 20L16 8L24 20" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 17h12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">SoWork AI Team</h1>
          <p className="text-sm text-gray-500 mt-1">你的 AI 行銷團隊</p>
        </div>

        {/* Google 登入按鈕 */}
        <div className="w-full max-w-sm mb-4">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
            className="w-full flex items-center justify-center gap-3 py-3.5 bg-white border border-gray-200 rounded-xl font-medium text-sm text-gray-700 shadow-sm hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50"
          >
            {isGoogleLoading ? (
              <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            使用 Google 帳號登入
          </button>
        </div>

        {/* Demo 身份選擇 */}
        <div className="w-full max-w-sm mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">或體驗 Demo 身份</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <div className="space-y-2">
            {DEMO_PERSONAS.map((persona) => (
              <button
                key={persona.id}
                type="button"
                onClick={() => handleDemoLogin(persona)}
                disabled={demoLoadingId !== null}
                className="w-full flex items-center gap-3 px-3.5 py-3 bg-gray-50 border border-gray-100 rounded-xl text-left hover:bg-gray-100 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                <span className="text-xl flex-shrink-0">{persona.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900 truncate">{persona.company}</span>
                    <span className="text-[10px] font-medium text-gray-500 bg-gray-200 rounded-full px-1.5 py-0.5 flex-shrink-0">{persona.industry}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{persona.pain}</p>
                </div>
                {demoLoadingId === persona.id ? (
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                ) : (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0 text-gray-300">
                    <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Email 登入分隔 */}
        <div className="w-full max-w-sm flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-medium">或</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Email/密碼表單 */}
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
          {mode === "register" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">姓名</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="請輸入您的姓名"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-gray-50"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">電子郵件</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-gray-50"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">密碼</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="請輸入密碼"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-gray-50"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-gray-900 text-white rounded-xl font-semibold text-sm transition-all active:scale-95 disabled:opacity-50 shadow-md"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                處理中...
              </span>
            ) : mode === "login" ? "登入" : "建立帳號"}
          </button>
        </form>

        {/* Toggle mode */}
        <div className="mt-6 text-center">
          {mode === "login" ? (
            <p className="text-sm text-gray-500">
              還沒有帳號？{" "}
              <button
                onClick={() => setMode("register")}
                className="text-gray-900 font-semibold"
              >
                立即註冊
              </button>
            </p>
          ) : (
            <p className="text-sm text-gray-500">
              已有帳號？{" "}
              <button
                onClick={() => setMode("login")}
                className="text-gray-900 font-semibold"
              >
                返回登入
              </button>
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="pb-8 text-center">
        <p className="text-xs text-gray-400">Powered by SoWork.ai</p>
      </div>
    </div>
  );
}
