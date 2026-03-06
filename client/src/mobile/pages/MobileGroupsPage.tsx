/**
 * 群組頁面 — AI 員工 + 真實員工混合的工作群組
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import MobileHeader from "../components/MobileHeader";

interface Group {
  id: string;
  name: string;
  description: string;
  members: { name: string; avatar: string; bg: string; type: "ai" | "human" }[];
  lastMessage: string;
  time: string;
  unread: number;
  taskCount: number;
}

const MOCK_GROUPS: Group[] = [
  {
    id: "brand-team",
    name: "品牌行銷小組",
    description: "品牌定位、社群內容、廣告策略",
    members: [
      { name: "Vivian", avatar: "V", bg: "from-orange-400 to-orange-600", type: "ai" },
      { name: "Ken", avatar: "K", bg: "from-blue-400 to-blue-600", type: "ai" },
      { name: "你", avatar: "我", bg: "from-gray-400 to-gray-600", type: "human" },
    ],
    lastMessage: "Vivian: 本月社群計畫已完成，請查看",
    time: "10:32",
    unread: 3,
    taskCount: 5,
  },
  {
    id: "content-team",
    name: "內容創作組",
    description: "文案、視覺、影片製作",
    members: [
      { name: "Ken", avatar: "K", bg: "from-blue-400 to-blue-600", type: "ai" },
      { name: "Luna", avatar: "L", bg: "from-purple-400 to-purple-600", type: "ai" },
      { name: "你", avatar: "我", bg: "from-gray-400 to-gray-600", type: "human" },
    ],
    lastMessage: "Luna: 新品視覺稿已上傳，共 8 張",
    time: "昨天",
    unread: 0,
    taskCount: 3,
  },
];

export default function MobileGroupsPage() {
  const [, navigate] = useLocation();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <MobileHeader
        title="群組"
        rightAction={
          <button
            onClick={() => setShowCreate(true)}
            className="w-9 h-9 flex items-center justify-center rounded-full active:bg-gray-100"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="10" cy="10" r="8" />
              <path d="M10 6v8M6 10h8" />
            </svg>
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {MOCK_GROUPS.map((group) => (
          <button
            key={group.id}
            onClick={() => navigate(`/group/${group.id}`)}
            className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-left active:bg-gray-50 transition-colors"
          >
            {/* 群組名稱 + 未讀 */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{group.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{group.description}</p>
              </div>
              <div className="flex flex-col items-end gap-1 ml-2">
                <span className="text-xs text-gray-400">{group.time}</span>
                {group.unread > 0 && (
                  <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold">{group.unread}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 成員頭像 */}
            <div className="flex items-center gap-1.5 mb-2.5">
              {group.members.map((m, i) => (
                <div
                  key={i}
                  className={`w-7 h-7 rounded-full bg-gradient-to-br ${m.bg} flex items-center justify-center text-white text-[10px] font-bold border-2 border-white -ml-1 first:ml-0`}
                  style={{ zIndex: group.members.length - i }}
                >
                  {m.avatar}
                </div>
              ))}
              <span className="text-xs text-gray-500 ml-1">
                {group.members.filter(m => m.type === "ai").length} 位 AI 員工
              </span>
            </div>

            {/* 最後訊息 */}
            <p className="text-xs text-gray-500 truncate mb-2.5">{group.lastMessage}</p>

            {/* 任務數 */}
            <div className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round">
                <path d="M10 4L5 9 2 6" />
                <rect x="1" y="1" width="10" height="10" rx="1" />
              </svg>
              <span className="text-xs text-gray-400">{group.taskCount} 個進行中任務</span>
            </div>
          </button>
        ))}

        {/* 建立群組 CTA */}
        <button
          onClick={() => setShowCreate(true)}
          className="w-full bg-orange-50 border-2 border-dashed border-orange-200 rounded-2xl p-5 flex flex-col items-center gap-2 active:bg-orange-100 transition-colors"
        >
          <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <path d="M10 4v12M4 10h12" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-orange-600">建立新群組</p>
          <p className="text-xs text-orange-400 text-center">將 AI 員工與真實同事組成專屬工作群組</p>
        </button>
      </div>

      {/* 建立群組 Modal */}
      {showCreate && (
        <CreateGroupModal onClose={() => setShowCreate(false)} onCreated={(id) => { setShowCreate(false); navigate(`/group/${id}`); }} />
      )}
    </div>
  );
}

function CreateGroupModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const [name, setName] = useState("");
  const { data: agentsData = [] } = trpc.cmo.listAgents.useQuery({});
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);

  const toggleAgent = (id: string) => {
    setSelectedAgents(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white w-full rounded-t-3xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">建立群組</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full active:bg-gray-100">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round">
              <path d="M4 4l10 10M14 4L4 14" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">群組名稱</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="例如：品牌行銷小組"
              className="w-full px-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">選擇 AI 員工</label>
            <div className="space-y-2">
              {(agentsData as any[]).slice(0, 5).map((agent: any) => (
                <button
                  key={agent.id}
                  onClick={() => toggleAgent(String(agent.id))}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors ${
                    selectedAgents.includes(String(agent.id))
                      ? "border-orange-500 bg-orange-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-sm font-bold">
                    {(agent.name || "A")[0]}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900">{agent.name}</p>
                    <p className="text-xs text-gray-500">{agent.title}</p>
                  </div>
                  {selectedAgents.includes(String(agent.id)) && (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M3 9l5 5 7-8" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="p-5 border-t border-gray-100">
          <button
            onClick={() => onCreated("new-group-" + Date.now())}
            disabled={!name.trim()}
            className="w-full py-3.5 bg-orange-500 text-white rounded-xl font-semibold text-sm disabled:opacity-40 active:scale-95 transition-transform shadow-md shadow-orange-100"
          >
            建立群組
          </button>
        </div>
      </div>
    </div>
  );
}

