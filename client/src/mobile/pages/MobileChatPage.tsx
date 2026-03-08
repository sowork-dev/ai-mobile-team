/**
 * 聊天列表頁面 — 品牌群組 + AI 員工對話
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import MobileHeader from "../components/MobileHeader";
import { useI18n } from "@/i18n";
import { getDemoData } from "../demoData";

export default function MobileChatPage() {
  const [, navigate] = useLocation();
  const { locale, t } = useI18n();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"groups" | "direct">("groups");

  const demoPersonaId = localStorage.getItem("demoPersonaId");
  const demoChatData = demoPersonaId ? getDemoData(demoPersonaId) : null;

  // 獲取品牌群組（demo 模式下停用）
  const { data: brandGroups, isLoading: groupsLoading } = trpc.company.getBrandGroups.useQuery(
    undefined,
    { enabled: !demoPersonaId }
  );

  // 格式化時間
  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return locale === "zh" ? "剛剛" : "Now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
    return d.toLocaleDateString("zh-TW", { month: "short", day: "numeric" });
  };

  // 過濾群組（demo 模式使用展示資料）
  const displayGroups = demoChatData?.brandGroups || brandGroups || [];
  const filteredGroups = displayGroups.filter(
    (g: any) => g.brandName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-white">
      <MobileHeader
        title={locale === "zh" ? "聊天" : "Chats"}
        rightAction={
          <button
            onClick={() => navigate("/chat/new")}
            className="w-9 h-9 flex items-center justify-center rounded-full active:bg-gray-100"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1C1C1E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v8M8 12h8" />
            </svg>
          </button>
        }
      />

      {/* Tab 切換 */}
      <div className="flex-shrink-0 px-4 py-2 flex gap-2 border-b border-gray-100">
        <button
          onClick={() => setActiveTab("groups")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            activeTab === "groups"
              ? "bg-[#1C1C1E] text-white"
              : "bg-[#F2F2F7] text-[#3C3C43]"
          }`}
        >
          {locale === "zh" ? "品牌群組" : "Groups"}
        </button>
        <button
          onClick={() => setActiveTab("direct")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            activeTab === "direct"
              ? "bg-[#1C1C1E] text-white"
              : "bg-[#F2F2F7] text-[#3C3C43]"
          }`}
        >
          {locale === "zh" ? "私訊" : "Direct"}
        </button>
      </div>

      {/* 搜尋列 */}
      <div className="px-4 py-2 bg-white">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={locale === "zh" ? "搜尋..." : "Search..."}
            className="w-full pl-10 pr-4 py-2.5 bg-[#F2F2F7] rounded-xl text-[15px] focus:outline-none placeholder:text-[#8E8E93]"
          />
        </div>
      </div>

      {/* 內容區 */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "groups" ? (
          // 品牌群組列表
          groupsLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-[#8E8E93] border-t-[#1C1C1E] rounded-full animate-spin" />
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-[#8E8E93]">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <p className="mt-3 text-sm">{locale === "zh" ? "尚無品牌群組" : "No groups yet"}</p>
              <button
                onClick={() => navigate("/profile/company")}
                className="mt-3 text-sm text-[#007AFF] font-medium"
              >
                {locale === "zh" ? "前往企業設定建立" : "Create in Company Settings"}
              </button>
            </div>
          ) : (
            <div>
              {filteredGroups.map((group: any) => (
                <button
                  key={group.id}
                  onClick={() => navigate(`/chat/group/${group.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-[#F2F2F7] border-b border-[#F2F2F7] transition-colors"
                >
                  {/* 群組頭像 */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#E8611A] to-[#FF8A50] flex items-center justify-center text-white font-semibold text-lg shadow-sm">
                      {group.brandName.charAt(0)}
                    </div>
                    {/* 成員數量標籤 */}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#1C1C1E] rounded-full flex items-center justify-center border-2 border-white">
                      <span className="text-white text-[9px] font-bold">{group.members?.length || 0}</span>
                    </div>
                  </div>

                  {/* 內容 */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-semibold text-[#1C1C1E] text-[15px]">{group.brandName}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-[#8E8E93]">{formatTime((group as any).lastMessageTime || group.createdAt)}</span>
                        {(group as any).unread > 0 && (
                          <span className="w-4 h-4 bg-[#E8611A] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                            {(group as any).unread}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-[13px] text-[#8E8E93] truncate">
                      {(group as any).lastMessage
                        ? (group as any).lastMessage
                        : group.members?.length > 0
                          ? `${group.members.map((m: any) => m.name).slice(0, 2).join(", ")}${group.members.length > 2 ? ` +${group.members.length - 2}` : ""}`
                          : locale === "zh" ? "點擊開始對話" : "Tap to start chatting"
                      }
                    </p>
                  </div>

                  {/* 箭頭 */}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              ))}
            </div>
          )
        ) : (
          // 私訊列表（暫時顯示空狀態）
          <div className="flex flex-col items-center justify-center h-48 text-[#8E8E93]">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <p className="mt-3 text-sm">{locale === "zh" ? "尚無私訊" : "No messages yet"}</p>
            <button
              onClick={() => navigate("/contacts")}
              className="mt-3 text-sm text-[#007AFF] font-medium"
            >
              {locale === "zh" ? "找 AI 員工開始對話" : "Start a conversation"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
