/**
 * AI旗艦隊 — 登入首頁
 * 專業設計，支援登入 + 免登入體驗
 */
import { useState } from "react";
import { useLocation } from "wouter";

export default function MobileLandingPage() {
  const [, navigate] = useLocation();
  const [showLogin, setShowLogin] = useState(false);

  const handleDemo = () => {
    // 設定演示模式
    localStorage.setItem("useDemoData", "true");
    localStorage.setItem("companySettings", JSON.stringify({
      companyName: "創智科技",
      industry: "B2B SaaS",
      companySize: "50-100人",
      isDemo: true,
    }));
    localStorage.setItem("demoUser", JSON.stringify({
      id: "demo-user",
      name: "體驗用戶",
      email: "demo@example.com",
    }));
    navigate("/app/chat");
  };

  const handleLogin = () => {
    // 導向 SoWork.ai OAuth
    window.location.href = "/api/auth/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          {/* 幕僚長 Logo - 羅盤設計 */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="1.5"/>
              <circle cx="12" cy="12" r="3" fill="white"/>
              <path d="M12 3v4M12 17v4M3 12h4M17 12h4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M12 6l2 4-2 2-2-2 2-4z" fill="white"/>
            </svg>
          </div>
          <span className="text-white font-bold text-lg">AI旗艦隊</span>
        </div>
        <button
          onClick={() => setShowLogin(true)}
          className="text-white/80 text-sm font-medium"
        >
          登入
        </button>
      </div>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="mb-8">
          {/* 大型 Logo */}
          <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-2xl">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="1.5"/>
              <circle cx="12" cy="12" r="3" fill="white"/>
              <path d="M12 3v4M12 17v4M3 12h4M17 12h4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M12 6l2 4-2 2-2-2 2-4z" fill="white"/>
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-3">
            AI旗艦隊
          </h1>
          <p className="text-white/60 text-lg mb-2">
            企業 AI 協作平台
          </p>
          <p className="text-white/40 text-sm max-w-xs mx-auto">
            Every work works with AI旗艦隊
            <br/>
            每個任務，都能完整交付
          </p>
        </div>

        {/* 功能亮點 */}
        <div className="grid grid-cols-3 gap-4 mb-10 w-full max-w-sm">
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <div className="text-2xl mb-1">🧠</div>
            <p className="text-white/80 text-xs">AI 幕僚長</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <div className="text-2xl mb-1">👥</div>
            <p className="text-white/80 text-xs">智能組隊</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <div className="text-2xl mb-1">📄</div>
            <p className="text-white/80 text-xs">一鍵交付</p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="w-full max-w-sm space-y-3">
          <button
            onClick={handleLogin}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-orange-500/30 active:scale-[0.98] transition-transform"
          >
            開始使用
          </button>
          
          <button
            onClick={handleDemo}
            className="w-full py-4 bg-white/10 text-white rounded-2xl font-medium border border-white/20 active:bg-white/20 transition-colors"
          >
            免費體驗（無需登入）
          </button>
        </div>

        {/* 演示公司預覽 */}
        <div className="mt-8 w-full max-w-sm">
          <p className="text-white/40 text-xs mb-3">體驗模式包含</p>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <span className="text-lg">🏢</span>
              </div>
              <div className="text-left">
                <p className="text-white font-medium">創智科技</p>
                <p className="text-white/50 text-xs">52 人 · 7 部門 · 14 AI 員工</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              <span className="text-xs bg-white/10 text-white/70 px-2 py-0.5 rounded">產品部</span>
              <span className="text-xs bg-white/10 text-white/70 px-2 py-0.5 rounded">業務部</span>
              <span className="text-xs bg-white/10 text-white/70 px-2 py-0.5 rounded">行銷部</span>
              <span className="text-xs bg-white/10 text-white/70 px-2 py-0.5 rounded">+4</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 text-center">
        <p className="text-white/30 text-xs">
          Powered by SoWork.ai
        </p>
      </div>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center">
          <div className="w-full max-w-lg bg-white rounded-t-3xl p-6 pb-10 animate-slide-up">
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6" />
            
            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
              登入 AI旗艦隊
            </h2>
            <p className="text-gray-500 text-sm text-center mb-6">
              使用 SoWork.ai 帳號登入
            </p>

            <div className="space-y-3">
              <button
                onClick={handleLogin}
                className="w-full py-4 bg-gray-900 text-white rounded-xl font-medium flex items-center justify-center gap-3"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                使用 SoWork.ai 登入
              </button>

              <button
                onClick={() => {
                  setShowLogin(false);
                  handleDemo();
                }}
                className="w-full py-4 bg-orange-50 text-orange-600 rounded-xl font-medium"
              >
                先體驗看看
              </button>

              <button
                onClick={() => setShowLogin(false)}
                className="w-full py-3 text-gray-500 text-sm"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
