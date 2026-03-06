/**
 * 聯絡人頁面
 * - 探索 AI 員工（從 agents 資料表）
 * - 推薦新人
 * - 我的員工清單
 * - 邀請真實同事
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import MobileHeader from "../components/MobileHeader";

type ContactTab = "explore" | "my-team" | "invite";

// 模擬我的團隊資料
const MY_TEAM = [
  { id: "vivian-brand", name: "Vivian", title: "品牌策略顧問", avatar: "V", avatarBg: "from-orange-400 to-orange-600", online: true, type: "ai" },
  { id: "ken-copy", name: "Ken", title: "文案創作專家", avatar: "K", avatarBg: "from-blue-400 to-blue-600", online: true, type: "ai" },
  { id: "luna-design", name: "Luna", title: "視覺設計顧問", avatar: "L", avatarBg: "from-purple-400 to-purple-600", online: false, type: "ai" },
];

// 技能標籤顏色
const SKILL_COLORS = [
  "bg-blue-50 text-blue-600",
  "bg-purple-50 text-purple-600",
  "bg-green-50 text-green-600",
  "bg-orange-50 text-orange-600",
  "bg-pink-50 text-pink-600",
];

function AgentCard({ agent, onChat, onAdd }: { agent: any; onChat: () => void; onAdd: () => void }) {
  // expertise 可能是陣列或需要解析
  const skills = Array.isArray(agent.expertise)
    ? agent.expertise.slice(0, 3)
    : [];

  // Layer 標籤
  const layerLabels: Record<number, string> = {
    1: "L1 高管",
    2: "L2 專家", 
    3: "L3 經理",
    4: "L4 執行",
    5: "L5 助理",
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* 頭部 */}
      <div className="px-4 pt-4 pb-3 flex items-start gap-3">
        {/* 頭像 */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-base flex-shrink-0 shadow-sm">
          {agent.avatar ? (
            <img src={agent.avatar} alt={agent.name} className="w-full h-full object-cover rounded-xl" />
          ) : (
            (agent.name || "A")[0]
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-gray-900 text-sm">{agent.name}</p>
            {agent.layer && (
              <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-medium">
                {layerLabels[agent.layer] || `L${agent.layer}`}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{agent.role}</p>
        </div>
      </div>

      {/* 簡介 */}
      {agent.description && (
        <p className="px-4 text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3">
          {agent.description}
        </p>
      )}

      {/* 技能標籤 */}
      {skills.length > 0 && (
        <div className="px-4 flex flex-wrap gap-1.5 mb-3">
          {skills.map((skill: string, i: number) => (
            <span
              key={i}
              className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${SKILL_COLORS[i % SKILL_COLORS.length]}`}
            >
              {skill.trim()}
            </span>
          ))}
        </div>
      )}

      {/* 操作按鈕 */}
      <div className="px-4 pb-4 flex gap-2">
        <button
          onClick={onChat}
          className="flex-1 py-2 bg-orange-500 text-white rounded-xl text-xs font-semibold active:scale-95 transition-transform shadow-sm shadow-orange-100"
        >
          開始對話
        </button>
        <button
          onClick={onAdd}
          className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold active:scale-95 transition-transform"
        >
          加入團隊
        </button>
      </div>
    </div>
  );
}

export default function MobileContactsPage() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<ContactTab>("explore");
  const [search, setSearch] = useState("");
  const [selectedLayer, setSelectedLayer] = useState<string | undefined>(undefined);

  // 從人才庫取得 AI 員工
  const { data: talentData, isLoading } = trpc.talent.list.useQuery({
    limit: 50,
    layer: selectedLayer ? parseInt(selectedLayer) : undefined,
    search: search || undefined,
  });
  
  const agentsData = talentData?.talents || [];

  const filteredAgents = agentsData.filter((a: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (a.name || "").toLowerCase().includes(q) ||
      (a.title || "").toLowerCase().includes(q) ||
      (a.specialty || "").toLowerCase().includes(q)
    );
  });

  const layers = [
    { id: undefined, label: "全部" },
    { id: "1", label: "L1 高管" },
    { id: "2", label: "L2 專家" },
    { id: "3", label: "L3 經理" },
    { id: "4", label: "L4 執行" },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <MobileHeader
        title="聯絡人"
        rightAction={
          <button className="w-9 h-9 flex items-center justify-center rounded-full active:bg-gray-100">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="10" cy="10" r="8" />
              <path d="M10 6v8M6 10h8" />
            </svg>
          </button>
        }
      />

      {/* Tab 切換 */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-4">
        <div className="flex gap-0">
          {[
            { id: "explore", label: "探索" },
            { id: "my-team", label: "我的團隊" },
            { id: "invite", label: "邀請同事" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ContactTab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-orange-500 text-orange-500"
                  : "border-transparent text-gray-500"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 探索 Tab */}
      {activeTab === "explore" && (
        <div className="flex-1 overflow-y-auto">
          {/* 搜尋 + 篩選 */}
          <div className="bg-white px-4 py-3 space-y-2.5 border-b border-gray-100">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="7" cy="7" r="5" />
                <path d="M11 11l3 3" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜尋 AI 員工..."
                className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-xl text-sm focus:outline-none"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
              {layers.map((layer) => (
                <button
                  key={String(layer.id)}
                  onClick={() => setSelectedLayer(layer.id)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    selectedLayer === layer.id
                      ? "bg-orange-500 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {layer.label}
                </button>
              ))}
            </div>
          </div>

          {/* AI 員工卡片列表 */}
          <div className="p-4 space-y-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 h-40 animate-pulse" />
              ))
            ) : filteredAgents.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-sm">找不到符合條件的 AI 員工</p>
              </div>
            ) : (
              filteredAgents.map((agent: any) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onChat={() => navigate(`/chat/${agent.slug || agent.id}`)}
                  onAdd={() => {
                    // TODO: 加入我的團隊
                    alert(`已將 ${agent.name} 加入您的團隊！`);
                  }}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* 我的團隊 Tab */}
      {activeTab === "my-team" && (
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-2">
            {MY_TEAM.map((member) => (
              <button
                key={member.id}
                onClick={() => navigate(`/chat/${member.id}`)}
                className="w-full flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 border border-gray-100 shadow-sm active:bg-gray-50 transition-colors"
              >
                <div className="relative">
                  <div
                    className={`w-11 h-11 rounded-full bg-gradient-to-br ${member.avatarBg} flex items-center justify-center text-white font-bold text-sm`}
                  >
                    {member.avatar}
                  </div>
                  {member.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-gray-900 text-sm">{member.name}</p>
                    <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-medium">AI</span>
                  </div>
                  <p className="text-xs text-gray-500">{member.title}</p>
                </div>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 4l4 4-4 4" />
                </svg>
              </button>
            ))}

            {/* 建立群組按鈕 */}
            <button
              onClick={() => navigate("/groups")}
              className="w-full flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3.5 active:bg-orange-100 transition-colors"
            >
              <div className="w-11 h-11 rounded-full bg-orange-500 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 4v12M4 10h12" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-orange-600 text-sm">建立工作群組</p>
                <p className="text-xs text-orange-400">將 AI 員工組成專屬團隊</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* 邀請同事 Tab */}
      {activeTab === "invite" && (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
                <path d="M22 11v6M25 14h-6" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">邀請真實同事</h3>
            <p className="text-sm text-gray-500 mb-5">邀請您的同事加入 SoWork AI Team，一起協作</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="輸入同事的電子郵件"
                className="flex-1 px-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none"
              />
              <button className="px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold active:scale-95 transition-transform">
                邀請
              </button>
            </div>
          </div>

          {/* 分享連結 */}
          <div className="mt-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-sm font-semibold text-gray-900 mb-3">或分享邀請連結</p>
            <div className="flex gap-2">
              <div className="flex-1 bg-gray-100 rounded-xl px-3 py-2.5 text-xs text-gray-500 truncate">
                https://app.sowork.ai/invite/abc123
              </div>
              <button className="px-3 py-2.5 bg-gray-100 rounded-xl text-xs font-medium text-gray-700 active:bg-gray-200">
                複製
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
