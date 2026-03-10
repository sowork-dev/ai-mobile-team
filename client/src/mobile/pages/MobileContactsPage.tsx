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
import { getDemoData } from "../demoData";
import { useI18n } from "@/i18n";
import { toast } from "sonner";

type ContactTab = "explore" | "my-team" | "invite";

// 模擬我的團隊資料 - Apple 單色風格
const MY_TEAM = [
  { id: "vivian-brand", name: "Vivian", title: "品牌策略顧問", avatar: "V", avatarBg: "from-gray-700 to-gray-900", online: true, type: "ai" },
  { id: "ken-copy", name: "Ken", title: "文案創作專家", avatar: "K", avatarBg: "from-gray-600 to-gray-800", online: true, type: "ai" },
  { id: "luna-design", name: "Luna", title: "視覺設計顧問", avatar: "L", avatarBg: "from-gray-500 to-gray-700", online: false, type: "ai" },
];

// 技能標籤顏色 - Apple 單色風格
const SKILL_COLORS = [
  "bg-gray-100 text-gray-700",
  "bg-gray-100 text-gray-700",
  "bg-gray-100 text-gray-700",
  "bg-gray-100 text-gray-700",
  "bg-gray-100 text-gray-700",
];

function AgentCard({ agent, onChat, onAdd, onCardClick }: { agent: any; onChat: () => void; onAdd: () => void; onCardClick: () => void }) {
  const { locale, t } = useI18n();

  // expertise 可能是陣列或需要解析
  const skills = Array.isArray(agent.expertise)
    ? agent.expertise.slice(0, 3)
    : [];

  // Layer 標籤
  const layerLabels: Record<number, string> = {
    1: t("contacts.l1Label"),
    2: t("contacts.l2Label"),
    3: t("contacts.l3Label"),
    4: t("contacts.l4Label"),
    5: t("contacts.l5Label"),
  };

  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer active:bg-gray-50 transition-colors"
      onClick={onCardClick}
    >
      {/* 頭部 */}
      <div className="px-4 pt-4 pb-3 flex items-start gap-3">
        {/* 頭像 */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-white font-bold text-base flex-shrink-0 shadow-sm">
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
              <span className="text-[10px] bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded-full font-medium">
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
          onClick={(e) => { e.stopPropagation(); onChat(); }}
          className="flex-1 py-2 bg-gray-900 text-white rounded-xl text-xs font-semibold active:scale-95 transition-transform shadow-sm shadow-gray-100 cursor-pointer"
        >
          {t("contacts.startChat")}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onAdd(); }}
          className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold active:scale-95 transition-transform cursor-pointer"
        >
          {t("contacts.addToTeam")}
        </button>
      </div>
    </div>
  );
}

// ── 電話聯絡人區塊 ──────────────────────────────────────────────────────────

function PhoneContactsSection({ locale }: { locale: string }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const { data: isEnabled } = trpc.phone.isEnabled.useQuery();
  const { data: contacts = [], refetch } = trpc.phone.contacts.list.useQuery();
  const saveContact = trpc.phone.contacts.save.useMutation({
    onSuccess: () => { refetch(); setName(""); setPhone(""); },
  });
  const deleteContact = trpc.phone.contacts.delete.useMutation({
    onSuccess: () => refetch(),
  });
  const initiateCall = trpc.phone.initiate.useMutation();

  const handleCall = async (contact: { name: string; phone: string }) => {
    if (isEnabled?.enabled) {
      const result = await initiateCall.mutateAsync({ to: contact.phone });
      if (!result.success) {
        toast.error(result.error || (locale === "zh" ? "撥號失敗" : "Call failed"));
      } else {
        toast.success(locale === "zh" ? `正在撥打 ${contact.name}...` : `Calling ${contact.name}...`);
      }
    } else {
      // 無 Twilio → 顯示電話號碼讓用戶自行撥打
      window.open(`tel:${contact.phone}`, "_self");
    }
  };

  return (
    <div className="mt-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6 6l.86-.86a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16z" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-gray-900">
          {locale === "zh" ? "電話聯絡人" : "Phone Contacts"}
        </p>
        {isEnabled?.enabled && (
          <span className="ml-auto text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
            Twilio
          </span>
        )}
      </div>

      <p className="text-xs text-gray-500 mb-3">
        {locale === "zh"
          ? "新增聯絡人電話，幕僚長可協助記錄通話摘要，點擊即可撥打"
          : "Add phone contacts to log call summaries and dial with one tap"}
      </p>

      {/* 新增表單 */}
      <div className="space-y-2 mb-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={locale === "zh" ? "聯絡人姓名" : "Contact name"}
          className="w-full px-3 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none"
        />
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={locale === "zh" ? "電話號碼（例：+886912345678）" : "Phone number (e.g. +886912345678)"}
          className="w-full px-3 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none font-mono"
        />
        <button
          onClick={() => {
            if (!name.trim() || !phone.trim()) {
              toast.error(locale === "zh" ? "請填寫姓名和電話" : "Please fill in name and phone");
              return;
            }
            saveContact.mutate({ name: name.trim(), phone: phone.trim() });
          }}
          disabled={saveContact.isPending}
          className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold active:scale-95 transition-transform disabled:opacity-50"
        >
          {saveContact.isPending
            ? (locale === "zh" ? "儲存中..." : "Saving...")
            : (locale === "zh" ? "新增電話聯絡人" : "Add Phone Contact")}
        </button>
      </div>

      {/* 聯絡人列表 */}
      {contacts.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-400 font-medium">
            {locale === "zh" ? "已設定的聯絡人" : "Configured contacts"}
          </p>
          {contacts.map((contact) => (
            <div key={contact.name} className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-gray-600">{contact.name[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{contact.name}</p>
                <p className="text-[10px] text-gray-400 font-mono truncate">{contact.phone}</p>
              </div>
              {/* 撥打按鈕 */}
              <button
                onClick={() => handleCall(contact)}
                disabled={initiateCall.isPending}
                className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center active:bg-gray-200"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6 6l.86-.86a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16z" />
                </svg>
              </button>
              {/* 刪除按鈕 */}
              <button
                onClick={() => deleteContact.mutate({ name: contact.name })}
                className="p-1.5 rounded-lg active:bg-gray-100"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M2 4h10M5 4V2.5h4V4M5.5 6.5v4M8.5 6.5v4M3 4l.7 7.5h6.6L11 4" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MobileContactsPage() {
  const [, navigate] = useLocation();
  const { locale, t } = useI18n();
  const demoPersonaId = localStorage.getItem("demoPersonaId");
  const demoTeamData = demoPersonaId ? getDemoData(demoPersonaId) : null;
  const [activeTab, setActiveTab] = useState<ContactTab>(demoPersonaId ? "my-team" : "explore");
  const [search, setSearch] = useState("");
  const [selectedLayer, setSelectedLayer] = useState<string | undefined>(undefined);

  // LINE 聯絡人管理
  const [lineContactName, setLineContactName] = useState("");
  const [lineContactUserId, setLineContactUserId] = useState("");
  const { data: lineContacts, refetch: refetchLineContacts } = trpc.line.contacts.useQuery();
  const saveLineContact = trpc.line.saveContact.useMutation({
    onSuccess: () => {
      toast.success(locale === "zh" ? "LINE 聯絡人已儲存" : "LINE contact saved");
      setLineContactName("");
      setLineContactUserId("");
      refetchLineContacts();
    },
    onError: (err) => toast.error(err.message),
  });
  const deleteLineContact = trpc.line.deleteContact.useMutation({
    onSuccess: () => {
      toast.success(locale === "zh" ? "已刪除" : "Deleted");
      refetchLineContacts();
    },
  });

  const handleSaveLineContact = () => {
    if (!lineContactName.trim() || !lineContactUserId.trim()) {
      toast.error(locale === "zh" ? "請填寫姓名和 LINE User ID" : "Please fill in name and LINE User ID");
      return;
    }
    saveLineContact.mutate({ name: lineContactName.trim(), lineUserId: lineContactUserId.trim() });
  };

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
    { id: undefined, label: t("contacts.all") },
    { id: "strategy", label: t("contacts.strategy") },
    { id: "execution", label: t("contacts.execution") },
    { id: "training", label: t("contacts.training") },
  ];

  const tabs = [
    { id: "explore", label: t("contacts.explore") },
    { id: "my-team", label: t("contacts.myTeam") },
    { id: "invite", label: t("contacts.invite") },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <MobileHeader
        title={t("contacts.title")}
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
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ContactTab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-gray-900 text-gray-900"
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
                placeholder={t("contacts.search")}
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
                      ? "bg-gray-900 text-white"
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
                <p className="text-sm">{t("contacts.noResults")}</p>
              </div>
            ) : (
              filteredAgents.map((agent: any) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onCardClick={() => navigate(`/agent/${agent.slug || agent.id}`)}
                  onChat={() => navigate(`/chat/${agent.slug || agent.id}`)}
                  onAdd={() => {
                    alert(
                      locale === "zh"
                        ? `已將 ${agent.name} 加入您的團隊！`
                        : `Added ${agent.name} to your team!`
                    );
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
            {(demoTeamData?.agentTeam || MY_TEAM).map((member) => {
              const isDemoAgent = "status" in member;
              const isOnline = isDemoAgent ? (member as any).status === "online" : (member as any).online;
              const avatarContent = isDemoAgent ? (member as any).avatar : (member as any).avatar;
              const avatarBg = isDemoAgent ? "from-gray-700 to-gray-900" : (member as any).avatarBg || "from-gray-700 to-gray-900";
              return (
                <button
                  key={member.id}
                  onClick={() => navigate(`/chat/${member.id}`)}
                  className="w-full flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 border border-gray-100 shadow-sm active:bg-gray-50 transition-colors"
                >
                  <div className="relative">
                    <div
                      className={`w-11 h-11 rounded-full bg-gradient-to-br ${avatarBg} flex items-center justify-center text-white font-bold text-sm`}
                    >
                      {avatarContent}
                    </div>
                    {isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-gray-700 rounded-full border-2 border-white" />
                    )}
                    {isDemoAgent && (member as any).status === "executing" && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#E8611A] rounded-full border-2 border-white animate-pulse" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-gray-900 text-sm">{member.name}</p>
                      <span className="text-[10px] bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded-full font-medium">AI</span>
                    </div>
                    <p className="text-xs text-gray-500">{member.title}</p>
                    {isDemoAgent && (
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {(member as any).status === "executing"
                          ? `⚡ ${t("contacts.executing")}`
                          : `● ${t("contacts.online")}`
                        }
                      </p>
                    )}
                  </div>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round">
                    <path d="M6 4l4 4-4 4" />
                  </svg>
                </button>
              );
            })}

            {/* 建立群組按鈕 */}
            <button
              onClick={() => navigate("/groups")}
              className="w-full flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 active:bg-gray-100 transition-colors"
            >
              <div className="w-11 h-11 rounded-full bg-gray-900 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 4v12M4 10h12" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-gray-800 text-sm">{t("contacts.createGroup")}</p>
                <p className="text-xs text-gray-700">{t("contacts.createGroupDesc")}</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* 邀請同事 Tab */}
      {activeTab === "invite" && (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#1C1C1E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
                <path d="M22 11v6M25 14h-6" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{t("contacts.inviteTitle")}</h3>
            <p className="text-sm text-gray-500 mb-5">{t("contacts.inviteDesc")}</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder={t("contacts.emailPlaceholder")}
                className="flex-1 px-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none"
              />
              <button className="px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold active:scale-95 transition-transform">
                {t("contacts.inviteBtn")}
              </button>
            </div>
          </div>

          {/* 分享連結 */}
          <div className="mt-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-sm font-semibold text-gray-900 mb-3">{t("contacts.shareLink")}</p>
            <div className="flex gap-2">
              <div className="flex-1 bg-gray-100 rounded-xl px-3 py-2.5 text-xs text-gray-500 truncate">
                https://app.sowork.ai/invite/abc123
              </div>
              <button className="px-3 py-2.5 bg-gray-100 rounded-xl text-xs font-medium text-gray-700 active:bg-gray-200">
                {t("contacts.copy")}
              </button>
            </div>
          </div>

          {/* 電話聯絡人 */}
          <PhoneContactsSection locale={locale} />

          {/* LINE 聯絡人 */}
          <div className="mt-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              {/* LINE logo color */}
              <div className="w-7 h-7 bg-[#06C755] rounded-lg flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1C4.14 1 1 3.64 1 6.9c0 2.06 1.2 3.88 3.03 4.97l-.47 1.74c-.05.17.14.31.29.21L6.44 12.5A7.9 7.9 0 0 0 8 12.8c3.86 0 7-2.64 7-5.9S11.86 1 8 1z" fill="white"/>
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {locale === "zh" ? "LINE 聯絡人" : "LINE Contacts"}
              </p>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              {locale === "zh"
                ? "新增聯絡人的 LINE User ID，讓幕僚長可以代您發送 LINE 訊息"
                : "Add LINE User IDs so your Chief of Staff can send LINE messages on your behalf"}
            </p>

            {/* 新增表單 */}
            <div className="space-y-2 mb-3">
              <input
                type="text"
                value={lineContactName}
                onChange={(e) => setLineContactName(e.target.value)}
                placeholder={locale === "zh" ? "聯絡人姓名（例：王小明）" : "Contact name (e.g. John)"}
                className="w-full px-3 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none"
              />
              <input
                type="text"
                value={lineContactUserId}
                onChange={(e) => setLineContactUserId(e.target.value)}
                placeholder="LINE User ID（U + 32 個字元）"
                className="w-full px-3 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none font-mono"
              />
              <button
                onClick={handleSaveLineContact}
                disabled={saveLineContact.isPending}
                className="w-full py-2.5 bg-[#06C755] text-white rounded-xl text-sm font-semibold active:scale-95 transition-transform disabled:opacity-50"
              >
                {saveLineContact.isPending
                  ? (locale === "zh" ? "儲存中..." : "Saving...")
                  : (locale === "zh" ? "新增 LINE 聯絡人" : "Add LINE Contact")}
              </button>
            </div>

            {/* 聯絡人列表 */}
            {lineContacts && lineContacts.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-400 font-medium">
                  {locale === "zh" ? "已設定的聯絡人" : "Configured contacts"}
                </p>
                {lineContacts.map((contact) => (
                  <div key={contact.lineUserId} className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#06C755]/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-[#06C755]">{contact.name[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{contact.name}</p>
                      <p className="text-[10px] text-gray-400 font-mono truncate">{contact.lineUserId}</p>
                    </div>
                    <button
                      onClick={() => deleteLineContact.mutate({ name: contact.name })}
                      className="p-1.5 rounded-lg active:bg-gray-100"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round">
                        <path d="M2 4h10M5 4V2.5h4V4M5.5 6.5v4M8.5 6.5v4M3 4l.7 7.5h6.6L11 4" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
