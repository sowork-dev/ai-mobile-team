/**
 * 建立群組頁面 — 手動選擇 AI 員工組成群組
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useI18n } from "@/i18n";

export default function MobileCreateGroupPage() {
  const [, navigate] = useLocation();
  const { locale } = useI18n();
  const [groupName, setGroupName] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // 獲取所有 AI 員工
  const { data: agents, isLoading } = trpc.talent.list.useQuery({
    limit: 100,
  });

  // 建立群組
  const createGroupMutation = trpc.company.createGroup.useMutation();

  // 過濾員工
  const filteredAgents = (agents || []).filter((agent: any) =>
    agent.name?.toLowerCase().includes(search.toLowerCase()) ||
    agent.title?.toLowerCase().includes(search.toLowerCase())
  );

  // 切換選擇
  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // 建立群組
  const handleCreate = async () => {
    if (!groupName.trim() || selectedIds.length === 0 || isCreating) return;

    setIsCreating(true);
    try {
      const result = await createGroupMutation.mutateAsync({
        name: groupName.trim(),
        memberIds: selectedIds,
      });

      if (result.success && result.group) {
        navigate(`/chat/group/${result.group.id}`);
      }
    } catch (error) {
      console.error("Create group error:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex-shrink-0 bg-white/95 backdrop-blur-lg border-b border-[#C6C6C8] px-4 py-3">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate("/chat")} className="text-[#007AFF] text-[17px]">
            {locale === "zh" ? "取消" : "Cancel"}
          </button>
          <h1 className="font-semibold text-[#1C1C1E] text-[17px]">
            {locale === "zh" ? "建立群組" : "New Group"}
          </h1>
          <button
            onClick={handleCreate}
            disabled={!groupName.trim() || selectedIds.length === 0 || isCreating}
            className="text-[#007AFF] text-[17px] font-semibold disabled:text-[#C7C7CC]"
          >
            {isCreating ? "..." : locale === "zh" ? "建立" : "Create"}
          </button>
        </div>
      </div>

      {/* 群組名稱輸入 */}
      <div className="px-4 py-3 bg-[#F2F2F7]">
        <input
          type="text"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder={locale === "zh" ? "群組名稱" : "Group Name"}
          className="w-full px-4 py-3 bg-white rounded-xl text-[17px] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 placeholder:text-[#8E8E93]"
        />
      </div>

      {/* 已選擇成員預覽 */}
      {selectedIds.length > 0 && (
        <div className="px-4 py-3 border-b border-[#C6C6C8]">
          <p className="text-[13px] text-[#8E8E93] mb-2">
            {locale === "zh" ? `已選擇 ${selectedIds.length} 位成員` : `${selectedIds.length} selected`}
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {selectedIds.map((id) => {
              const agent = (agents || []).find((a: any) => a.id === id);
              if (!agent) return null;
              return (
                <button
                  key={id}
                  onClick={() => toggleSelect(id)}
                  className="flex-shrink-0 flex items-center gap-2 bg-[#F2F2F7] rounded-full pl-1 pr-3 py-1"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#E8611A] to-[#FF8A50] flex items-center justify-center overflow-hidden">
                    {agent.avatarUrl ? (
                      <img src={agent.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-[10px] font-semibold">{agent.name?.charAt(0)}</span>
                    )}
                  </div>
                  <span className="text-[13px] text-[#1C1C1E]">{agent.name}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 搜尋 */}
      <div className="px-4 py-2 bg-[#F2F2F7]">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={locale === "zh" ? "搜尋 AI 員工" : "Search AI employees"}
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl text-[15px] focus:outline-none placeholder:text-[#8E8E93]"
          />
        </div>
      </div>

      {/* 員工列表 */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-[#8E8E93] border-t-[#1C1C1E] rounded-full animate-spin" />
          </div>
        ) : (
          <div>
            {filteredAgents.map((agent: any) => {
              const isSelected = selectedIds.includes(agent.id);
              return (
                <button
                  key={agent.id}
                  onClick={() => toggleSelect(agent.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 active:bg-[#F2F2F7] border-b border-[#F2F2F7] transition-colors"
                >
                  {/* 頭像 */}
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#E8611A] to-[#FF8A50] flex items-center justify-center overflow-hidden">
                    {agent.avatarUrl ? (
                      <img src={agent.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-sm font-semibold">{agent.name?.charAt(0)}</span>
                    )}
                  </div>

                  {/* 資訊 */}
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-medium text-[#1C1C1E] text-[15px] truncate">{agent.name}</p>
                    <p className="text-[13px] text-[#8E8E93] truncate">{agent.title || agent.specialty}</p>
                  </div>

                  {/* 選擇狀態 */}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    isSelected ? "bg-[#007AFF]" : "border-2 border-[#C7C7CC]"
                  }`}>
                    {isSelected && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
