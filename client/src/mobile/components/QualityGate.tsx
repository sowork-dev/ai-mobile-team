/**
 * QualityGate — Enterprise AI Quality Review Component
 * Shows before task output is delivered to user
 */
import { useState, useEffect } from "react";
import { useI18n } from "@/i18n";

interface QualityGateProps {
  taskTitle: string;
  agentName: string;
  onApprove: () => void;
  onReject: (reason: string) => void;
}

const CHECKS = [
  { zh: "邏輯一致性檢查", en: "Logic Consistency Check" },
  { zh: "數據引用驗證", en: "Data Reference Validation" },
  { zh: "企業格式標準", en: "Enterprise Format Standard" },
];

type Phase = "spinning" | "checks" | "approved";

export default function QualityGate({ taskTitle, agentName, onApprove, onReject }: QualityGateProps) {
  const { locale } = useI18n();
  const [phase, setPhase] = useState<Phase>("spinning");
  const [visibleChecks, setVisibleChecks] = useState(0);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    // Phase 1: spinner for 1.5s
    const t1 = setTimeout(() => setPhase("checks"), 1500);
    return () => clearTimeout(t1);
  }, []);

  useEffect(() => {
    if (phase !== "checks") return;
    // Animate checks in one by one
    let count = 0;
    const interval = setInterval(() => {
      count++;
      setVisibleChecks(count);
      if (count >= CHECKS.length) {
        clearInterval(interval);
        setTimeout(() => setPhase("approved"), 600);
      }
    }, 700);
    return () => clearInterval(interval);
  }, [phase]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gray-900 px-6 py-5 text-white">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <p className="text-xs font-medium text-white/60 uppercase tracking-widest">
              {locale === "zh" ? "AI 品質審查" : "AI Quality Review"}
            </p>
          </div>
          <h2 className="font-bold text-base leading-tight">{taskTitle}</h2>
          <p className="text-xs text-white/50 mt-1">
            {locale === "zh" ? `審查人：${agentName}` : `Reviewer: ${agentName}`}
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-5">
          {/* Spinning phase */}
          {phase === "spinning" && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-14 h-14 rounded-full border-4 border-gray-200 border-t-gray-900 animate-spin" />
              <p className="text-sm font-medium text-gray-700">
                {locale === "zh" ? "品質審查進行中..." : "Quality Review in Progress..."}
              </p>
            </div>
          )}

          {/* Checks phase */}
          {(phase === "checks" || phase === "approved") && (
            <div className="space-y-3">
              {CHECKS.map((check, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 transition-all duration-500 ${
                    i < visibleChecks ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                    i < visibleChecks ? "bg-emerald-500" : "bg-gray-200"
                  }`}>
                    {i < visibleChecks && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </div>
                  <span className={`text-sm font-medium ${i < visibleChecks ? "text-gray-900" : "text-gray-400"}`}>
                    {locale === "zh" ? `✓ ${check.zh}` : `✓ ${check.en}`}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Approved phase */}
          {phase === "approved" && (
            <>
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <p className="text-sm font-semibold text-emerald-700">
                  {locale === "zh" ? "品質審查通過 ✓" : "Quality Approved ✓"}
                </p>
              </div>

              {showReject ? (
                <div className="space-y-2">
                  <textarea
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder={locale === "zh" ? "請說明退回原因..." : "Enter rejection reason..."}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowReject(false)}
                      className="flex-1 py-2 text-sm text-gray-600 bg-gray-100 rounded-xl"
                    >
                      {locale === "zh" ? "取消" : "Cancel"}
                    </button>
                    <button
                      onClick={() => onReject(rejectReason)}
                      className="flex-1 py-2 text-sm text-white bg-red-500 rounded-xl font-medium"
                    >
                      {locale === "zh" ? "確認退回" : "Confirm Reject"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={onApprove}
                    className="w-full py-3.5 bg-gray-900 text-white rounded-xl font-semibold text-sm active:scale-[0.98] transition-transform"
                  >
                    {locale === "zh" ? "交付給用戶" : "Deliver to User"}
                  </button>
                  <button
                    onClick={() => setShowReject(true)}
                    className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {locale === "zh" ? "退回修改" : "Request Changes"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
