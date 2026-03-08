/**
 * Demo 選擇頁面 — 5 大目標客戶 Persona
 * 讓銷售/演示人員以特定客戶身份體驗平台
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { generatePositioningBookDOC, generatePositioningBookPPT } from "@/lib/positioningBookExporter";
import { getSampleBrandData } from "@/lib/samplePositioningPlan";
import { toast } from "sonner";

export default function MobileDemoPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: personas, isLoading } = trpc.demo.personas.useQuery();

  const selectedPersona = personas?.find(p => p.id === selectedId);

  const [isExporting, setIsExporting] = useState(false);

  const handleSelectPersona = (personaId: string) => {
    setSelectedId(personaId);
  };

  const handleDownloadOutput = async (outputType: string, personaId: string) => {
    if (outputType !== "doc" && outputType !== "ppt") return;
    setIsExporting(true);
    const toastId = toast.loading(
      outputType === "doc" ? "正在生成定位書 Word 文件..." : "正在生成定位書 PPT 簡報..."
    );
    try {
      const { brandName, plan } = getSampleBrandData(personaId);
      if (outputType === "doc") {
        await generatePositioningBookDOC({ brandName, plan, clientName: brandName });
      } else {
        await generatePositioningBookPPT({ brandName, plan, clientName: brandName });
      }
      toast.dismiss(toastId);
      toast.success("文件已下載！");
    } catch (e) {
      toast.dismiss(toastId);
      toast.error(`匯出失敗：${e}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleEnterDemo = () => {
    if (!selectedPersona) return;

    // 儲存 demo 模式與選擇的 Persona
    localStorage.setItem("useDemoData", "true");
    localStorage.setItem("demoPersonaId", selectedPersona.id);
    localStorage.setItem("companySettings", JSON.stringify({
      companyName: selectedPersona.company,
      industry: selectedPersona.industry,
      companySize: `${selectedPersona.teamSize}人`,
      challenge: selectedPersona.challenge,
      decisionMaker: `${selectedPersona.decisionMaker.name}, ${selectedPersona.decisionMaker.role}`,
      isDemo: true,
    }));
    localStorage.setItem("demoUser", JSON.stringify({
      id: `demo-${selectedPersona.id}`,
      name: selectedPersona.decisionMaker.name,
      email: selectedPersona.decisionMaker.email,
      role: selectedPersona.decisionMaker.role,
    }));

    // 進入主應用
    window.location.href = "/app";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 詳情視圖
  if (selectedPersona) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-4">
          <button
            onClick={() => setSelectedId(null)}
            className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white"
          >
            ←
          </button>
          <span className="text-white font-medium">選擇體驗身份</span>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-32">
          {/* 公司資訊卡 */}
          <div className={`bg-gradient-to-br ${selectedPersona.colorFrom} ${selectedPersona.colorTo} rounded-2xl p-5 mb-4`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-3xl">
                {selectedPersona.icon}
              </div>
              <div>
                <h2 className="text-white text-xl font-bold">{selectedPersona.company}</h2>
                <span className="text-white/70 text-sm">{selectedPersona.industry} · {selectedPersona.teamSize.toLocaleString()} 人</span>
              </div>
            </div>

            {/* 決策者 */}
            <div className="bg-white/15 rounded-xl p-3 mb-3">
              <p className="text-white/60 text-xs mb-1">體驗身份</p>
              <p className="text-white font-semibold">{selectedPersona.decisionMaker.name}</p>
              <p className="text-white/80 text-sm">{selectedPersona.decisionMaker.role}</p>
            </div>

            {/* 挑戰 */}
            <div className="bg-white/10 rounded-xl p-3 mb-3">
              <p className="text-white/60 text-xs mb-1">核心挑戰</p>
              <p className="text-white text-sm leading-relaxed">{selectedPersona.challenge}</p>
            </div>

            {/* 預期效益 */}
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-white/60 text-xs mb-1">預期效益</p>
              <p className="text-white text-sm leading-relaxed">✅ {selectedPersona.expectedBenefit}</p>
            </div>
          </div>

          {/* AI 團隊建議 */}
          <h3 className="text-white/60 text-xs font-medium uppercase tracking-wide mb-3">建議 AI 團隊</h3>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {selectedPersona.recommendedAgents.map((agent, i) => (
              <div key={i} className="bg-white/8 border border-white/10 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{agent.avatar}</span>
                  <div>
                    <p className="text-white text-sm font-medium leading-tight">{agent.name}</p>
                    <p className="text-white/50 text-xs leading-tight">{agent.title}</p>
                  </div>
                </div>
                <p className="text-white/60 text-xs">{agent.reason}</p>
              </div>
            ))}
          </div>

          {/* 典型任務範例 */}
          <h3 className="text-white/60 text-xs font-medium uppercase tracking-wide mb-3">典型任務範例</h3>
          <div className="space-y-2">
            {selectedPersona.sampleTasks.map((task, i) => (
              <div key={i} className="bg-white/8 border border-white/10 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-white text-sm font-medium">{task.title}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    task.status === "completed"
                      ? "bg-green-500/20 text-green-400"
                      : task.status === "in_progress"
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-white/10 text-white/50"
                  }`}>
                    {task.status === "completed" ? "✅ 完成" : task.status === "in_progress" ? "🔄 進行中" : "待啟動"}
                  </span>
                </div>
                <p className="text-white/50 text-xs">{task.description}</p>
                {task.outputs && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {task.outputs.map((o, j) => {
                      const isDownloadable = (o.type === "doc" || o.type === "ppt") && task.status === "completed";
                      return (
                        <button
                          key={j}
                          disabled={isExporting || !isDownloadable}
                          onClick={() => isDownloadable && selectedPersona && handleDownloadOutput(o.type, selectedPersona.id)}
                          className={`text-xs px-2 py-0.5 rounded transition-all ${
                            isDownloadable
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 active:scale-95 cursor-pointer"
                              : "bg-white/10 text-white/60 cursor-default"
                          }`}
                        >
                          {o.type === "pdf" ? "📄" : o.type === "ppt" ? "📽️" : o.type === "xls" ? "📊" : "📝"}{" "}
                          {o.name}
                          {isDownloadable && " ↓"}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 固定底部 CTA */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/95 backdrop-blur border-t border-white/10">
          <button
            onClick={handleEnterDemo}
            className={`w-full py-4 bg-gradient-to-r ${selectedPersona.colorFrom} ${selectedPersona.colorTo} text-white rounded-2xl font-bold text-base shadow-lg active:scale-[0.98] transition-transform`}
          >
            以 {selectedPersona.decisionMaker.name} 身份體驗
          </button>
          <p className="text-center text-white/30 text-xs mt-2">
            {selectedPersona.budget} · 體驗模式，不需登入
          </p>
        </div>
      </div>
    );
  }

  // 選擇列表視圖
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="1.5"/>
                <circle cx="12" cy="12" r="3" fill="white"/>
                <path d="M12 3v4M12 17v4M3 12h4M17 12h4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="text-white font-bold">AI旗艦隊</span>
          </div>
          <button
            onClick={() => window.location.href = "/api/auth/login"}
            className="text-amber-400 text-sm font-medium"
          >
            登入 →
          </button>
        </div>
        <div className="mt-5 mb-2">
          <h1 className="text-2xl font-bold text-white">選擇體驗身份</h1>
          <p className="text-white/50 text-sm mt-1">選擇最接近你的客戶類型，立即體驗</p>
        </div>
      </div>

      {/* Persona 卡片列表 */}
      <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-3">
        {personas?.map((persona) => (
          <button
            key={persona.id}
            onClick={() => handleSelectPersona(persona.id)}
            className="w-full text-left"
          >
            <div className={`bg-gradient-to-br ${persona.colorFrom} ${persona.colorTo} rounded-2xl p-4`}>
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  {persona.icon}
                </div>

                {/* 公司資訊 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-bold text-base leading-tight">{persona.company}</h3>
                  </div>
                  <span className="inline-block text-xs bg-white/20 text-white/90 px-2 py-0.5 rounded-full mb-2">
                    {persona.industry} · {persona.teamSize.toLocaleString()} 人
                  </span>

                  {/* 挑戰 */}
                  <p className="text-white/80 text-sm leading-snug mb-2">
                    {persona.challenge}
                  </p>

                  {/* 效益 */}
                  <div className="bg-white/15 rounded-lg px-3 py-1.5">
                    <p className="text-white text-xs font-medium">✅ {persona.expectedBenefit}</p>
                  </div>
                </div>
              </div>

              {/* AI 團隊預覽 */}
              <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-white/20">
                <span className="text-white/50 text-xs">AI 團隊：</span>
                {persona.recommendedAgents.slice(0, 3).map((agent, i) => (
                  <span key={i} className="text-sm">{agent.avatar}</span>
                ))}
                {persona.recommendedAgents.length > 3 && (
                  <span className="text-white/50 text-xs">+{persona.recommendedAgents.length - 3}</span>
                )}
                <span className="ml-auto text-white/70 text-sm">查看詳情 →</span>
              </div>
            </div>
          </button>
        ))}

        {/* 分隔線 */}
        <div className="flex items-center gap-3 py-2">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-white/30 text-xs">或</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* 通用體驗入口 */}
        <button
          onClick={() => {
            localStorage.setItem("useDemoData", "true");
            localStorage.setItem("companySettings", JSON.stringify({
              companyName: "創智科技",
              industry: "B2B SaaS",
              companySize: "50-100人",
              isDemo: true,
            }));
            window.location.href = "/app";
          }}
          className="w-full py-4 bg-white/8 border border-white/15 rounded-2xl text-white/70 font-medium text-sm"
        >
          使用預設範例公司體驗
        </button>
      </div>
    </div>
  );
}
