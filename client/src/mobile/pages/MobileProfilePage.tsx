/**
 * 我的頁面 — 品牌定位設定（對話式）、帳號管理、語言切換
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import MobileHeader from "../components/MobileHeader";
import { useI18n } from "@/i18n";

export default function MobileProfilePage() {
  const [, navigate] = useLocation();
  const { data: user } = trpc.auth.me.useQuery();
  const logoutMutation = trpc.auth.logout.useMutation();
  const { locale, toggleLocale, t } = useI18n();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      window.location.href = "/app";
    } catch {
      toast.error("登出失敗");
    }
  };

  const menuItems = [
    {
      section: "企業",
      items: [
        {
          icon: (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="14" height="13" rx="1.5" />
              <path d="M6 7h6M6 10h4M6 3V1M12 3V1" />
            </svg>
          ),
          label: "企業設定",
          desc: "公司基本資料設定",
          action: () => navigate("/company-settings"),
          color: "text-gray-900",
          bg: "bg-gray-50",
        },
        {
          icon: (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
          ),
          label: "我的 AI 團隊",
          desc: "管理您的 AI 員工",
          action: () => navigate("/contacts?tab=my-team"),
          color: "text-gray-700",
          bg: "bg-gray-50",
        },
        {
          icon: (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 1.5 17V4.5A2.5 2.5 0 0 1 4 2h8.5L17 6.5V17a2.5 2.5 0 0 1-2.5 2.5H4z" transform="scale(0.9)" />
              <path d="M12 2v5h5" transform="scale(0.9)" />
              <path d="M5 10h8M5 13h6" transform="scale(0.9)" />
            </svg>
          ),
          label: "知識庫",
          desc: "連接 OneDrive 公司文件",
          action: () => navigate("/company-settings"),
          color: "text-blue-600",
          bg: "bg-blue-50",
        },
      ],
    },
    {
      section: t("profile.settings"),
      items: [
        {
          icon: (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="9" r="7" />
              <path d="M1 9h16M9 1a12 12 0 0 1 0 16M9 1a12 12 0 0 0 0 16" />
            </svg>
          ),
          label: t("profile.language"),
          desc: locale === "zh" ? "繁體中文 → English" : "English → 繁體中文",
          action: () => {
            toggleLocale();
            toast.success(locale === "zh" ? "Language changed to English" : "已切換至繁體中文");
          },
          color: "text-gray-700",
          bg: "bg-gray-50",
        },
        {
          icon: (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="9" r="3" />
              <path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.2 3.2l1.4 1.4M13.4 13.4l1.4 1.4M3.2 14.8l1.4-1.4M13.4 4.6l1.4-1.4" />
            </svg>
          ),
          label: "通知設定",
          desc: "管理推播通知",
          action: () => toast.info("通知設定即將上線"),
          color: "text-gray-700",
          bg: "bg-gray-50",
        },
        {
          icon: (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 1l2 5h5l-4 3 1.5 5L9 11l-4.5 3L6 9 2 6h5z" />
            </svg>
          ),
          label: "升級方案",
          desc: "解鎖更多 AI 員工和功能",
          action: () => toast.info("升級方案即將上線"),
          color: "text-gray-700",
          bg: "bg-gray-50",
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <MobileHeader title={t("profile.title")} />

      <div className="flex-1 overflow-y-auto">
        {/* 用戶資訊卡 */}
        <div className="bg-white px-5 py-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-white font-bold text-2xl shadow-md">
              {(user as any)?.name?.[0] || "U"}
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900 text-lg">{(user as any)?.name || "用戶"}</p>
              <p className="text-sm text-gray-500">{(user as any)?.email || ""}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-medium">
                  免費方案
                </span>
              </div>
            </div>
            <button className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 active:bg-gray-200">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#6B7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 2l3 3-9 9H2v-3L11 2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* 企業設定狀態卡片 */}
        {(() => {
          const saved = localStorage.getItem("companySettings");
          const companyData = saved ? JSON.parse(saved) : null;
          const isComplete = companyData?.companyName && companyData?.industry && companyData?.companySize;
          
          return (
            <div className="mx-4 mt-4 bg-gradient-to-r from-gray-900 to-gray-700 rounded-2xl p-4 shadow-md shadow-gray-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-white text-xs font-medium opacity-80">企業設定</p>
                <button
                  onClick={() => navigate("/company-settings")}
                  className="text-white text-xs font-medium bg-white/20 px-2.5 py-1 rounded-full active:bg-white/30"
                >
                  {isComplete ? "編輯" : "設定"}
                </button>
              </div>
              {isComplete ? (
                <>
                  <p className="text-white font-bold text-base mb-1">{companyData.companyName}</p>
                  <p className="text-gray-300 text-xs">{companyData.industry} · {companyData.companySize}</p>
                </>
              ) : (
                <>
                  <p className="text-white font-bold text-base mb-1">尚未設定企業資料</p>
                  <p className="text-gray-300 text-xs">完成企業設定，開始使用 AI 團隊</p>
                  <button
                    onClick={() => navigate("/company-settings")}
                    className="mt-3 w-full py-2 bg-white text-gray-900 rounded-xl text-sm font-semibold active:scale-95 transition-transform"
                  >
                    立即設定
                  </button>
                </>
              )}
            </div>
          );
        })()}

        {/* 選單項目 */}
        <div className="mt-4 space-y-4 px-4">
          {menuItems.map((section) => (
            <div key={section.section}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
                {section.section}
              </p>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {section.items.map((item, i) => (
                  <button
                    key={i}
                    onClick={item.action}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 transition-colors ${
                      i < section.items.length - 1 ? "border-b border-gray-100" : ""
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl ${item.bg} flex items-center justify-center ${item.color}`}>
                      {item.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round">
                      <path d="M6 4l4 4-4 4" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 登出按鈕 */}
        <div className="px-4 mt-4 mb-8">
          <button
            onClick={handleLogout}
            className="w-full py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-semibold text-gray-700 active:bg-gray-100 transition-colors shadow-sm"
          >
            登出
          </button>
        </div>
      </div>
    </div>
  );
}
