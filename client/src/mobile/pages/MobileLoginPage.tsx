/**
 * Mobile 登入頁面
 * 雙入口：帳號登入 / 免帳號 Demo 體驗
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useI18n } from "@/i18n";

const DEMO_PERSONAS = [
  {
    id: "groupm-digital",
    icon: "🏢",
    company: "GroupM Digital",
    industry: "廣告集團",
    size: "2,500 人",
  },
  {
    id: "loreal-apac",
    icon: "💄",
    company: "L'Oréal Asia Pacific",
    industry: "美妝集團",
    size: "800 人",
  },
  {
    id: "bcg-taipei",
    icon: "📊",
    company: "BCG Taipei",
    industry: "管理顧問",
    size: "150 人",
  },
  {
    id: "hillhouse-capital",
    icon: "💰",
    company: "Hillhouse Capital",
    industry: "私募基金",
    size: "200 人",
  },
  {
    id: "microsoft-taiwan",
    icon: "🚀",
    company: "Microsoft Taiwan",
    industry: "科技",
    size: "500 人",
  },
];

interface MobileLoginPageProps {
  showOnlyCompanySelector?: boolean;
}

export default function MobileLoginPage({ showOnlyCompanySelector = false }: MobileLoginPageProps) {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
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
        if (!name) { toast.error(t("login.nameRequired")); setIsLoading(false); return; }
        await registerMutation.mutateAsync({ email, password, name });
      }
      window.location.reload();
    } catch (err: any) {
      toast.error(err?.message || t("login.operationFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const [isMicrosoftLoading, setIsMicrosoftLoading] = useState(false);

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);
    window.location.href = "/api/auth/google?redirect=/app";
  };

  const handleMicrosoftLogin = () => {
    setIsMicrosoftLoading(true);
    window.location.href = "/api/auth/microsoft?redirect=/app";
  };

  const handleDemoSelect = (persona: (typeof DEMO_PERSONAS)[0]) => {
    localStorage.setItem("demoPersonaId", persona.id);
    localStorage.setItem("demoCompanyName", persona.company);
    localStorage.setItem("demoCompanySize", persona.size);
    window.location.href = "/app";
  };

  // 已登入但沒選公司時，只顯示公司選擇器
  if (showOnlyCompanySelector) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
        <div className="mb-8 flex flex-col items-center">
          <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M8 20L16 8L24 20" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 17h12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t("login.selectIdentity")}</h1>
          <p className="text-sm text-gray-500 mt-1">{t("login.selectCompany")}</p>
        </div>
        <div className="w-full max-w-sm space-y-3">
          {DEMO_PERSONAS.map((persona) => (
            <button
              key={persona.id}
              onClick={() => handleDemoSelect(persona)}
              className="w-full flex items-center gap-3 p-4 border-2 border-gray-900 rounded-2xl hover:bg-gray-50 active:scale-95 transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)]"
            >
              <span className="text-2xl">{persona.icon}</span>
              <div className="text-left">
                <div className="font-semibold text-gray-900 text-sm">{persona.company}</div>
                <div className="text-xs text-gray-500">{persona.industry} · {persona.size}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

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
          <p className="text-sm text-gray-500 mt-1">{t("login.tagline")}</p>
        </div>

        {/* 入口 1：帳號登入 */}
        <div className="w-full max-w-sm">
          {/* Google 登入按鈕 */}
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
            {t("login.googleLogin")}
          </button>

          {/* Microsoft 登入按鈕 */}
          <button
            type="button"
            onClick={handleMicrosoftLogin}
            disabled={isMicrosoftLoading}
            className="w-full flex items-center justify-center gap-3 py-3.5 mt-3 bg-white border border-gray-200 rounded-xl font-medium text-sm text-gray-700 shadow-sm hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50"
          >
            {isMicrosoftLoading ? (
              <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="1" y="1" width="10" height="10" fill="#F25022"/>
                <rect x="13" y="1" width="10" height="10" fill="#7FBA00"/>
                <rect x="1" y="13" width="10" height="10" fill="#00A4EF"/>
                <rect x="13" y="13" width="10" height="10" fill="#FFB900"/>
              </svg>
            )}
            使用 Microsoft 帳號登入
          </button>

          {/* Email/密碼表單 */}
          <form onSubmit={handleSubmit} className="mt-3 space-y-3">
            {mode === "register" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("login.nameLabel")}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("login.namePlaceholder")}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-gray-50"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("login.emailLabel")}</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("login.passwordLabel")}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("login.passwordPlaceholder")}
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
                  {t("login.processing")}
                </span>
              ) : mode === "login" ? t("login.loginBtn") : t("login.registerBtn")}
            </button>
          </form>

          {/* Toggle login/register */}
          <div className="mt-4 text-center">
            {mode === "login" ? (
              <p className="text-sm text-gray-500">
                {t("login.noAccount")}{" "}
                <button onClick={() => setMode("register")} className="text-gray-900 font-semibold">
                  {t("login.signUp")}
                </button>
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                {t("login.hasAccount")}{" "}
                <button onClick={() => setMode("login")} className="text-gray-900 font-semibold">
                  {t("login.backToLogin")}
                </button>
              </p>
            )}
          </div>
        </div>

        {/* 分隔線 */}
        <div className="w-full max-w-sm flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-medium">{t("login.or")}</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* 入口 2：免帳號 Demo 體驗 */}
        <div className="w-full max-w-sm">
          <p className="text-xs font-medium text-gray-400 text-center mb-3">{t("login.demoLabel")}</p>
          <div className="space-y-2">
            {DEMO_PERSONAS.map((persona) => (
              <button
                key={persona.id}
                type="button"
                onClick={() => handleDemoSelect(persona)}
                className="w-full flex items-center gap-3 px-3.5 py-3 bg-gray-50 border border-gray-100 rounded-xl text-left hover:bg-gray-100 active:scale-[0.98] transition-all"
              >
                <span className="text-xl flex-shrink-0">{persona.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{persona.company}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{persona.industry} · {persona.size}</p>
                </div>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0 text-gray-300">
                  <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pb-8 text-center">
        <p className="text-xs text-gray-400">Powered by SoWork.ai</p>
      </div>
    </div>
  );
}
