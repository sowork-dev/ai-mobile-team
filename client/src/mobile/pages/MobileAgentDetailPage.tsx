/**
 * AI 員工詳情頁面
 */
import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import AIOnboardingModal from "../components/AIOnboardingModal";

const SKILL_COLORS = [
  "bg-gray-100 text-gray-700",
  "bg-gray-100 text-gray-700",
  "bg-gray-100 text-gray-700",
  "bg-gray-100 text-gray-700",
  "bg-gray-100 text-gray-700",
];

export default function MobileAgentDetailPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const [, navigate] = useLocation();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // 從 agents 列表找到對應的 agent
  const { data: agentsData = [] } = trpc.cmo.listAgents.useQuery({});
  const agent = (agentsData as any[]).find(
    (a: any) => String(a.id) === agentId || a.slug === agentId
  );

  // 檢查是否首次使用此 AI
  useEffect(() => {
    if (agent) {
      const seenAgents = JSON.parse(localStorage.getItem("seenAgents") || "[]");
      if (!seenAgents.includes(agent.id)) {
        setShowOnboarding(true);
      }
    }
  }, [agent]);

  const handleOnboardingClose = () => {
    if (agent) {
      const seenAgents = JSON.parse(localStorage.getItem("seenAgents") || "[]");
      localStorage.setItem("seenAgents", JSON.stringify([...seenAgents, agent.id]));
    }
    setShowOnboarding(false);
  };

  const handleStartChat = () => {
    handleOnboardingClose();
    navigate(`/chat/${agent?.slug || agent?.id}`);
  };

  if (!agent) {
    return (
      <div className="flex flex-col h-full bg-white items-center justify-center">
        <p className="text-[#8E8E93] text-sm">找不到此 AI 員工</p>
        <button onClick={() => navigate("/contacts")} className="mt-3 text-[#007AFF] text-sm font-medium">
          返回聯絡人
        </button>
      </div>
    );
  }

  const skills = Array.isArray(agent.skills)
    ? agent.skills
    : typeof agent.skills === "string"
    ? agent.skills.split(",")
    : [];

  const industries = Array.isArray(agent.industries)
    ? agent.industries
    : typeof agent.industries === "string"
    ? agent.industries.split(",")
    : [];

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 flex items-center px-4 h-14 gap-3">
        <button
          onClick={() => navigate("/contacts")}
          className="w-9 h-9 flex items-center justify-center rounded-full active:bg-gray-100 -ml-1"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.5 5L7.5 10L12.5 15" />
          </svg>
        </button>
        <p className="text-sm font-semibold text-gray-900 flex-1">{agent.name}</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* 頭部資訊 */}
        <div className="bg-white px-5 py-6 border-b border-gray-100">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-white font-bold text-3xl shadow-md flex-shrink-0">
              {agent.avatarUrl ? (
                <img src={agent.avatarUrl} alt={agent.name} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                (agent.name || "A")[0]
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">{agent.name}</h1>
              {agent.englishName && (
                <p className="text-sm text-gray-400">{agent.englishName}</p>
              )}
              <p className="text-sm text-gray-600 mt-1">{agent.title}</p>
              {agent.rating && (
                <div className="flex items-center gap-1 mt-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} width="14" height="14" viewBox="0 0 14 14" fill={i < Math.floor(agent.rating) ? "#1C1C1E" : "#E5E7EB"}>
                      <path d="M7 1l1.5 3.5 3.5.5-2.5 2.5.5 3.5L7 9.5 4 11l.5-3.5L2 5l3.5-.5z"/>
                    </svg>
                  ))}
                  <span className="text-sm text-gray-600 font-medium ml-1">{agent.rating}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 簡介 */}
        {agent.bio && (
          <div className="bg-white mt-2 px-5 py-4 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">簡介</p>
            <p className="text-sm text-gray-700 leading-relaxed">{agent.bio}</p>
          </div>
        )}

        {/* 專長 */}
        {agent.specialty && (
          <div className="bg-white mt-2 px-5 py-4 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">專長領域</p>
            <p className="text-sm text-gray-700">{agent.specialty}</p>
          </div>
        )}

        {/* 技能標籤 */}
        {skills.length > 0 && (
          <div className="bg-white mt-2 px-5 py-4 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">技能</p>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill: string, i: number) => (
                <span
                  key={i}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium ${SKILL_COLORS[i % SKILL_COLORS.length]}`}
                >
                  {skill.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 適合產業 */}
        {industries.length > 0 && (
          <div className="bg-white mt-2 px-5 py-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">適合產業</p>
            <div className="flex flex-wrap gap-2">
              {industries.map((industry: string, i: number) => (
                <span
                  key={i}
                  className="text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 font-medium"
                >
                  {industry.trim()}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 底部 CTA */}
      <div
        className="flex-shrink-0 bg-white border-t border-gray-100 px-4 py-3"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 12px)" }}
      >
        <div className="flex gap-3">
          <button
            onClick={() => {
              toast.success(`已將 ${agent.name} 加入您的團隊！`);
            }}
            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm active:scale-95 transition-transform"
          >
            加入團隊
          </button>
          <button
            onClick={() => navigate(`/chat/${agent.slug || agent.id}`)}
            className="flex-1 py-3 bg-gray-900 text-white rounded-xl font-semibold text-sm active:scale-95 transition-transform shadow-md shadow-gray-200"
          >
            開始對話
          </button>
        </div>
      </div>

      {/* AI 入職說明彈窗 */}
      <AIOnboardingModal
        agent={{
          id: agent.id,
          name: agent.name,
          englishName: agent.englishName,
          title: agent.title,
          avatar: agent.avatarUrl,
          bio: agent.bio,
          methodology: agent.methodology,
          specialty: agent.specialty,
          skills: skills,
        }}
        isOpen={showOnboarding}
        onClose={handleOnboardingClose}
        onStartChat={handleStartChat}
      />
    </div>
  );
}
