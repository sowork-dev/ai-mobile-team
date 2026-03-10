/**
 * 傳播行事曆 CRUD — Sprint 2-B
 * Jennifer (Microsoft) 需求：內容矩陣管理，Michelle (L'Oréal) 需求：行事曆新增/編輯/刪除
 */
import { useState, useEffect } from "react";

type ContentStatus = "draft" | "review" | "published";

interface ContentItem {
  id: string;
  title: string;
  platform: string;
  publishDate: string; // ISO date string
  assignedAgent: string;
  status: ContentStatus;
  createdAt: string;
}

const PLATFORMS = ["微信公眾號", "微博", "抖音", "小紅書", "LinkedIn", "Instagram", "YouTube", "官網部落格", "Email 電子報"];
const AGENTS = ["小紅 (內容策略師)", "小藍 (社群行銷師)", "小綠 (SEO 優化師)", "小橙 (視覺設計師)", "小紫 (數據分析師)"];

const STATUS_LABELS: Record<ContentStatus, string> = {
  draft: "草稿",
  review: "審核中",
  published: "已發布",
};

const STATUS_COLORS: Record<ContentStatus, string> = {
  draft: "bg-gray-100 text-gray-500 border border-gray-200",
  review: "bg-gray-100 text-gray-600 border border-gray-200",
  published: "bg-gray-900 text-white border border-gray-900",
};

const STORAGE_KEY = "contentCalendarItems";

function loadItems(): ContentItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  // 預設示範資料
  return [
    {
      id: "1",
      title: "Q2 品牌定位發布公告",
      platform: "微信公眾號",
      publishDate: "2026-04-01",
      assignedAgent: "小紅 (內容策略師)",
      status: "published",
      createdAt: new Date().toISOString(),
    },
    {
      id: "2",
      title: "新品牌標語社群系列",
      platform: "小紅書",
      publishDate: "2026-04-08",
      assignedAgent: "小藍 (社群行銷師)",
      status: "review",
      createdAt: new Date().toISOString(),
    },
    {
      id: "3",
      title: "受眾洞察 Infographic",
      platform: "LinkedIn",
      publishDate: "2026-04-15",
      assignedAgent: "小橙 (視覺設計師)",
      status: "draft",
      createdAt: new Date().toISOString(),
    },
    {
      id: "4",
      title: "CEO 訪談影片剪輯",
      platform: "抖音",
      publishDate: "2026-04-22",
      assignedAgent: "小藍 (社群行銷師)",
      status: "draft",
      createdAt: new Date().toISOString(),
    },
  ];
}

function saveItems(items: ContentItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

const emptyForm = (): Omit<ContentItem, "id" | "createdAt"> => ({
  title: "",
  platform: PLATFORMS[0],
  publishDate: new Date().toISOString().slice(0, 10),
  assignedAgent: AGENTS[0],
  status: "draft",
});

interface FormModalProps {
  initial: Omit<ContentItem, "id" | "createdAt">;
  onSave: (data: Omit<ContentItem, "id" | "createdAt">) => void;
  onCancel: () => void;
  isEdit: boolean;
}

function FormModal({ initial, onSave, onCancel, isEdit }: FormModalProps) {
  const [form, setForm] = useState(initial);

  const set = (key: keyof typeof form, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const valid = form.title.trim().length > 0 && form.publishDate.length > 0;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex flex-col justify-end" onClick={onCancel}>
      <div
        className="bg-slate-800 rounded-t-3xl px-5 py-6 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-white font-bold text-lg">{isEdit ? "編輯計畫" : "新增內容計畫"}</h2>
          <button onClick={onCancel} className="w-8 h-8 rounded-full bg-white/10 text-white/60 flex items-center justify-center text-lg">×</button>
        </div>

        {/* 標題 */}
        <div>
          <label className="text-white/50 text-xs mb-1 block">標題 *</label>
          <input
            className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/30 outline-none focus:border-amber-500/60"
            placeholder="輸入內容計畫標題..."
            value={form.title}
            onChange={e => set("title", e.target.value)}
          />
        </div>

        {/* 平台 */}
        <div>
          <label className="text-white/50 text-xs mb-1 block">發布平台</label>
          <div className="relative">
            <select
              className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-amber-500/60 appearance-none"
              value={form.platform}
              onChange={e => set("platform", e.target.value)}
            >
              {PLATFORMS.map(p => <option key={p} value={p} className="bg-slate-800">{p}</option>)}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none">▾</span>
          </div>
        </div>

        {/* 發布日期 */}
        <div>
          <label className="text-white/50 text-xs mb-1 block">發布日期 *</label>
          <input
            type="date"
            className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-amber-500/60"
            value={form.publishDate}
            onChange={e => set("publishDate", e.target.value)}
          />
        </div>

        {/* 負責 Agent */}
        <div>
          <label className="text-white/50 text-xs mb-1 block">負責 Agent</label>
          <div className="relative">
            <select
              className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-amber-500/60 appearance-none"
              value={form.assignedAgent}
              onChange={e => set("assignedAgent", e.target.value)}
            >
              {AGENTS.map(a => <option key={a} value={a} className="bg-slate-800">{a}</option>)}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none">▾</span>
          </div>
        </div>

        {/* 狀態 */}
        <div>
          <label className="text-white/50 text-xs mb-1 block">狀態</label>
          <div className="flex gap-2">
            {(["draft", "review", "published"] as ContentStatus[]).map(s => (
              <button
                key={s}
                onClick={() => set("status", s)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
                  form.status === s
                    ? "border-amber-500/60 bg-amber-500/20 text-amber-300"
                    : "border-white/15 bg-white/8 text-white/50"
                }`}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => valid && onSave(form)}
          disabled={!valid}
          className={`w-full py-3.5 rounded-2xl font-bold text-sm mt-2 transition-all ${
            valid
              ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white active:scale-[0.98]"
              : "bg-white/10 text-white/30 cursor-not-allowed"
          }`}
        >
          {isEdit ? "儲存變更" : "新增計畫"}
        </button>
      </div>
    </div>
  );
}

interface DeleteModalProps {
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteModal({ title, onConfirm, onCancel }: DeleteModalProps) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-6" onClick={onCancel}>
      <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <h3 className="text-white font-bold text-base mb-2">確認刪除</h3>
        <p className="text-white/60 text-sm mb-5">將刪除「{title}」，此操作無法復原。</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl bg-white/10 text-white/70 font-medium text-sm">
            取消
          </button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-xl bg-red-500/80 text-white font-bold text-sm">
            刪除
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MobileContentCalendarPage({ onBack }: { onBack?: () => void }) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<ContentItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<ContentItem | null>(null);
  const [filterStatus, setFilterStatus] = useState<ContentStatus | "all">("all");

  useEffect(() => {
    setItems(loadItems());
  }, []);

  const persist = (updated: ContentItem[]) => {
    setItems(updated);
    saveItems(updated);
  };

  const handleAdd = (form: Omit<ContentItem, "id" | "createdAt">) => {
    const newItem: ContentItem = {
      ...form,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    persist([...items, newItem]);
    setShowAdd(false);
  };

  const handleEdit = (form: Omit<ContentItem, "id" | "createdAt">) => {
    if (!editItem) return;
    persist(items.map(item => item.id === editItem.id ? { ...item, ...form } : item));
    setEditItem(null);
  };

  const handleDelete = () => {
    if (!deleteItem) return;
    persist(items.filter(item => item.id !== deleteItem.id));
    setDeleteItem(null);
  };

  const handleStatusCycle = (item: ContentItem) => {
    const cycle: ContentStatus[] = ["draft", "review", "published"];
    const next = cycle[(cycle.indexOf(item.status) + 1) % cycle.length];
    persist(items.map(i => i.id === item.id ? { ...i, status: next } : i));
  };

  const filtered = filterStatus === "all" ? items : items.filter(i => i.status === filterStatus);

  // Group by month
  const grouped = filtered.reduce<Record<string, ContentItem[]>>((acc, item) => {
    const month = item.publishDate.slice(0, 7);
    (acc[month] ??= []).push(item);
    return acc;
  }, {});

  const sortedMonths = Object.keys(grouped).sort();

  const counts = {
    all: items.length,
    draft: items.filter(i => i.status === "draft").length,
    review: items.filter(i => i.status === "review").length,
    published: items.filter(i => i.status === "published").length,
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 bg-white border-b border-gray-100 px-4 py-3">
        <button
          onClick={onBack ?? (() => history.back())}
          className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600"
        >
          ←
        </button>
        <div className="flex-1">
          <h1 className="text-gray-900 font-bold text-lg leading-tight">傳播行事曆</h1>
          <p className="text-gray-500 text-xs">{items.length} 個內容計畫</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-xl font-bold"
        >
          +
        </button>
      </div>

      {/* 統計概覽 */}
      <div className="px-4 mt-4 mb-4 grid grid-cols-3 gap-2">
        <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-gray-800">{counts.draft}</p>
          <p className="text-gray-500 text-xs mt-0.5">草稿</p>
        </div>
        <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-gray-800">{counts.review}</p>
          <p className="text-gray-500 text-xs mt-0.5">審核中</p>
        </div>
        <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-gray-900">{counts.published}</p>
          <p className="text-gray-500 text-xs mt-0.5">已發布</p>
        </div>
      </div>

      {/* 過濾器 */}
      <div className="px-4 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(["all", "draft", "review", "published"] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filterStatus === s
                  ? "bg-gray-900 text-white"
                  : "bg-white border border-gray-200 text-gray-500"
              }`}
            >
              {s === "all" ? `全部 (${counts.all})` : `${STATUS_LABELS[s]} (${counts[s]})`}
            </button>
          ))}
        </div>
      </div>

      {/* 內容列表 */}
      <div className="flex-1 overflow-y-auto px-4 pb-24 space-y-5">
        {sortedMonths.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm">尚無內容計畫</p>
            <button
              onClick={() => setShowAdd(true)}
              className="mt-4 px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm"
            >
              新增第一個計畫
            </button>
          </div>
        )}

        {sortedMonths.map(month => {
          const [y, m] = month.split("-");
          const monthLabel = new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString("zh-TW", { year: "numeric", month: "long" });

          return (
            <div key={month}>
              <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2">{monthLabel}</h3>
              <div className="space-y-2">
                {grouped[month]
                  .sort((a, b) => a.publishDate.localeCompare(b.publishDate))
                  .map(item => {
                    const date = new Date(item.publishDate + "T12:00:00");
                    const weekday = date.toLocaleDateString("zh-TW", { weekday: "short" });

                    return (
                      <div
                        key={item.id}
                        className="bg-white border border-gray-100 shadow-sm rounded-2xl p-4 flex gap-3"
                      >
                        {/* 日期 */}
                        <div className="flex-shrink-0 w-12 text-center">
                          <p className="text-gray-900 font-bold text-lg leading-tight">{date.getDate()}</p>
                          <p className="text-gray-400 text-xs">{weekday}</p>
                        </div>

                        {/* 內容 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-gray-900 font-medium text-sm leading-tight">{item.title}</p>
                            <button
                              onClick={() => handleStatusCycle(item)}
                              className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[item.status]}`}
                            >
                              {STATUS_LABELS[item.status]}
                            </button>
                          </div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-gray-500 text-xs">📱 {item.platform}</span>
                            <span className="text-gray-300 text-xs">·</span>
                            <span className="text-gray-500 text-xs">🤖 {item.assignedAgent.split(" (")[0]}</span>
                          </div>
                        </div>

                        {/* 操作 */}
                        <div className="flex-shrink-0 flex flex-col gap-1.5">
                          <button
                            onClick={() => setEditItem(item)}
                            className="w-7 h-7 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center text-xs"
                          >
                            ✎
                          </button>
                          <button
                            onClick={() => setDeleteItem(item)}
                            className="w-7 h-7 rounded-lg bg-red-50 text-red-500 flex items-center justify-center text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 新增 Modal */}
      {showAdd && (
        <FormModal
          initial={emptyForm()}
          onSave={handleAdd}
          onCancel={() => setShowAdd(false)}
          isEdit={false}
        />
      )}

      {/* 編輯 Modal */}
      {editItem && (
        <FormModal
          initial={{
            title: editItem.title,
            platform: editItem.platform,
            publishDate: editItem.publishDate,
            assignedAgent: editItem.assignedAgent,
            status: editItem.status,
          }}
          onSave={handleEdit}
          onCancel={() => setEditItem(null)}
          isEdit
        />
      )}

      {/* 刪除確認 */}
      {deleteItem && (
        <DeleteModal
          title={deleteItem.title}
          onConfirm={handleDelete}
          onCancel={() => setDeleteItem(null)}
        />
      )}
    </div>
  );
}
