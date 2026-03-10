/**
 * Sprint 7-C: 企業安全合規頁面
 * 深色主題 landing page 風格，解決 David 和 Kevin 的資安疑慮
 */
import { useLocation } from "wouter";

interface BadgeProps {
  icon: string;
  title: string;
  subtitle: string;
  color: string;
}

function CertBadge({ icon, title, subtitle, color }: BadgeProps) {
  return (
    <div className={`flex flex-col items-center gap-2 p-4 rounded-2xl border ${color} bg-white/5`}>
      <span className="text-3xl">{icon}</span>
      <div className="text-center">
        <p className="font-bold text-white text-sm">{title}</p>
        <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

interface FeatureItemProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
}

function FeatureItem({ icon, title, desc }: FeatureItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-white text-sm">{title}</p>
        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

interface DeployCardProps {
  icon: string;
  title: string;
  desc: string;
  tag: string;
  tagColor: string;
}

function DeployCard({ icon, title, desc, tag, tagColor }: DeployCardProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <p className="font-bold text-white text-sm">{title}</p>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tagColor}`}>{tag}</span>
      </div>
      <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
    </div>
  );
}

export default function MobileSecurityPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-950/90 backdrop-blur-sm border-b border-white/10 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate("/company-settings")}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gray-700 rounded-lg flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h1 className="font-bold text-white">企業安全白皮書</h1>
        </div>
      </div>

      <div className="px-4 pb-12 space-y-6">
        {/* Hero */}
        <div className="pt-8 pb-4 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-gray-500/30">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">您的資料，永遠在您掌控中</h2>
          <p className="text-gray-400 text-sm leading-relaxed">企業級安全架構，滿足台灣和國際合規要求</p>
        </div>

        {/* Section 1: 資料主權 */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🗄️</span>
            <h3 className="font-bold text-white">資料主權</h3>
          </div>
          <div className="space-y-4">
            <FeatureItem
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>}
              title="資料儲存地區選擇"
              desc="所有資料儲存在您選擇的地區（台灣 / 亞太），不跨境傳輸，符合在地合規要求。"
            />
            <FeatureItem
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4"/><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
              title="不訓練 AI 模型"
              desc="您的商業資料、對話記錄、文件內容，絕對不會用於訓練或改進 AI 模型。"
            />
            <FeatureItem
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>}
              title="私有雲部署支援"
              desc="支援部署在您自己的 Azure、AWS 或 GCP 環境，完全由您的 IT 團隊管理。"
            />
            <FeatureItem
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>}
              title="完全刪除保障"
              desc="申請刪除帳號後，30 天內所有資料從伺服器完全清除，並提供刪除確認證明。"
            />
          </div>
        </div>

        {/* Section 2: 安全認證 */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🏆</span>
            <h3 className="font-bold text-white">安全認證</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <CertBadge
              icon="🔒"
              title="ISO 27001"
              subtitle="資訊安全管理"
              color="border-white/20"
            />
            <CertBadge
              icon="📋"
              title="SOC 2 Type II"
              subtitle="服務組織控制"
              color="border-white/20"
            />
            <CertBadge
              icon="🇪🇺"
              title="GDPR"
              subtitle="歐盟合規"
              color="border-white/20"
            />
            <CertBadge
              icon="🇹🇼"
              title="個資法合規"
              subtitle="台灣個人資料保護"
              color="border-white/20"
            />
          </div>
          <p className="text-xs text-gray-500 text-center mt-3">認證持續維護中，詳細報告請聯繫 enterprise@sowork.ai</p>
        </div>

        {/* Section 3: 企業控制 */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">⚙️</span>
            <h3 className="font-bold text-white">企業控制</h3>
          </div>
          <div className="space-y-4">
            <FeatureItem
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
              title="角色權限管理"
              desc="三層權限架構（Admin / Manager / Member），精細控制每位成員的資料存取範圍。"
            />
            <FeatureItem
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
              title="單一登入 SSO"
              desc="支援 Microsoft 365 / Google Workspace SSO，員工用公司帳號直接登入，無需額外密碼。"
            />
            <FeatureItem
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>}
              title="審計日誌"
              desc="所有 AI 操作（對話、文件生成、資料存取）均完整記錄，可追溯、可匯出，滿足合規審計需求。"
            />
            <FeatureItem
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
              title="IP 白名單"
              desc="設定允許存取的 IP 範圍，確保只有公司網路或 VPN 才能連線，防止未授權存取。"
            />
          </div>
        </div>

        {/* Section 4: 私有部署選項 */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🏗️</span>
            <h3 className="font-bold text-white">私有部署選項</h3>
          </div>
          <div className="space-y-3">
            <DeployCard
              icon="☁️"
              title="雲端版（SaaS）"
              desc="多租戶 SaaS，快速上線，由 SoWork 維護基礎設施。適合中小型團隊快速啟動。"
              tag="立即可用"
              tagColor="bg-white/10 text-white/60"
            />
            <DeployCard
              icon="🔷"
              title="私有雲版"
              desc="部署在客戶自己的 Azure / AWS / GCP 帳號下，資料完全在您的雲端環境。需要 IT 資源配合。"
              tag="企業方案"
              tagColor="bg-white/10 text-white/60"
            />
            <DeployCard
              icon="🏢"
              title="On-Premise 版"
              desc="部署在客戶內網伺服器，完全離線隔離，不依賴任何外部網路。適合高安全等級金融、政府機構。"
              tag="客製報價"
              tagColor="bg-white/10 text-white/60"
            />
          </div>
          <button
            onClick={() => {
              window.location.href = "mailto:enterprise@sowork.ai?subject=申請企業部署評估&body=您好，我想了解私有部署方案，請安排評估。";
            }}
            className="w-full mt-4 py-3.5 bg-gray-700 hover:bg-gray-600 active:scale-[0.98] text-white font-semibold rounded-xl text-sm transition-all"
          >
            申請企業部署評估 →
          </button>
        </div>

        {/* 底部說明 */}
        <div className="text-center pb-4">
          <p className="text-xs text-gray-500">
            如需完整安全報告或合規文件，請聯繫{" "}
            <a href="mailto:enterprise@sowork.ai" className="text-gray-400 font-medium">enterprise@sowork.ai</a>
          </p>
          <p className="text-xs text-gray-600 mt-2">© 2026 SoWork.ai · 版本 7.0</p>
        </div>
      </div>
    </div>
  );
}
