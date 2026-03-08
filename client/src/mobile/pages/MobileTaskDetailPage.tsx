/**
 * 任務詳情頁面
 * 包含：任務內容、交付物下載、發布選單（Canva/InVideo/FB/IG/排程/轉傳）
 */
import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { useI18n } from "@/i18n";

type ExportFormat = "pptx" | "docx" | "xlsx" | "pdf";

const FORMAT_OPTIONS: { id: ExportFormat; label: string }[] = [
  { id: "pdf", label: "PDF 報告 (.pdf)" },
  { id: "pptx", label: "簡報 PPT" },
  { id: "docx", label: "Word 報告" },
  { id: "xlsx", label: "Excel 表格" },
];

async function downloadFile(
  title: string,
  content: string,
  companyName: string,
  format: ExportFormat
) {
  const res = await fetch("/api/export/pptx", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content, companyName, format }),
  });
  if (!res.ok) throw new Error("下載失敗");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const ext = format === "pdf" ? "pdf" : format;
  a.download = `${title}.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
}

const MOCK_TASK_DETAIL = {
  id: "1",
  title: "品牌社群貼文計畫（10 月份）",
  type: "social",
  status: "completed",
  agentName: "Ken",
  agentAvatar: "K",
  agentBg: "from-gray-600 to-gray-800",
  createdAt: "2024-10-01 10:32",
  content: `# 10 月份社群貼文計畫

## 主題方向
本月以「秋日質感生活」為主軸，呼應品牌的溫暖、高質感定位。

## 貼文排程

### 第一週（10/1-10/7）
- **10/1（週二）**：品牌故事分享 — 創辦人的初心
- **10/3（週四）**：產品特寫 + 使用情境
- **10/5（週六）**：UGC 轉發 + 感謝文

### 第二週（10/8-10/14）
- **10/8（週二）**：秋季新品預告
- **10/10（週四）**：幕後花絮 — 製作過程
- **10/12（週六）**：互動貼文 — 投票你最喜歡的款式

### 第三週（10/15-10/21）
- **10/15（週二）**：新品正式上市
- **10/17（週四）**：KOL 合作開箱
- **10/19（週六）**：限時優惠公告

### 第四週（10/22-10/31）
- **10/22（週二）**：用戶好評分享
- **10/24（週四）**：品牌理念深度文
- **10/26（週六）**：月底回顧 + 下月預告

## 文案風格指南
- 語調：溫暖、真誠、有質感
- 字數：Instagram 200-300 字，Facebook 300-500 字
- 必用 Hashtag：#品牌名 #秋日質感 #生活美學`,
  deliverables: [
    { type: "social", title: "社群貼文計畫 .md", status: "ready" },
    { type: "presentation", title: "執行簡報 .pptx", status: "ready" },
  ],
};

export default function MobileTaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const [, navigate] = useLocation();
  const { t } = useI18n();
  const [showPublish, setShowPublish] = useState(false);
  const [formatPickerIdx, setFormatPickerIdx] = useState<number | null>(null);
  const [downloadingIdx, setDownloadingIdx] = useState<number | null>(null);
  const task = MOCK_TASK_DETAIL;

  const handleDownload = async (idx: number, format: ExportFormat) => {
    setDownloadingIdx(idx);
    setFormatPickerIdx(null);
    try {
      await downloadFile(task.title, task.content, task.agentName, format);
      toast.success("下載完成！");
    } catch {
      toast.error("下載失敗，請重試");
    } finally {
      setDownloadingIdx(null);
    }
  };

  const PUBLISH_OPTIONS = [
    {
      id: "canva",
      label: t("taskDetail.canvaLabel"),
      desc: t("taskDetail.canvaDesc"),
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="16" height="16" rx="3" />
          <path d="M7 10h6M10 7v6" />
        </svg>
      ),
      color: "text-gray-700",
      bg: "bg-gray-50",
    },
    {
      id: "invideo",
      label: t("taskDetail.invideoLabel"),
      desc: t("taskDetail.invideoDesc"),
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 10L8 6v8l5-4z" />
          <rect x="2" y="3" width="16" height="14" rx="2" />
        </svg>
      ),
      color: "text-gray-700",
      bg: "bg-gray-50",
    },
    {
      id: "facebook",
      label: t("taskDetail.facebookLabel"),
      desc: t("taskDetail.facebookDesc"),
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0z" />
          <path d="M12 8h-2a1 1 0 0 0-1 1v2H7l.5 2.5H9V18h2.5v-4.5H14L13.5 11H12V9a1 1 0 0 1 1-1h1V8z" />
        </svg>
      ),
      color: "text-gray-800",
      bg: "bg-gray-50",
    },
    {
      id: "instagram",
      label: t("taskDetail.instagramLabel"),
      desc: t("taskDetail.instagramDesc"),
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="16" height="16" rx="4" />
          <circle cx="10" cy="10" r="3.5" />
          <circle cx="14.5" cy="5.5" r="0.5" fill="currentColor" />
        </svg>
      ),
      color: "text-gray-700",
      bg: "bg-gray-50",
    },
    {
      id: "schedule",
      label: t("taskDetail.scheduleLabel"),
      desc: t("taskDetail.scheduleDesc"),
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="10" cy="10" r="8" />
          <path d="M10 5v5l3 3" />
        </svg>
      ),
      color: "text-gray-700",
      bg: "bg-gray-50",
    },
    {
      id: "forward",
      label: t("taskDetail.forwardLabel"),
      desc: t("taskDetail.forwardDesc"),
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12v3a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-3" />
          <path d="M10 3v9M6 7l4-4 4 4" />
        </svg>
      ),
      color: "text-gray-600",
      bg: "bg-gray-100",
    },
  ];

  const handlePublish = (optionId: string) => {
    const option = PUBLISH_OPTIONS.find(o => o.id === optionId);
    toast.success(`Connecting to ${option?.label}...`);
    setShowPublish(false);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 flex items-center px-4 h-14 gap-3">
        <button
          onClick={() => navigate("/tasks")}
          className="w-9 h-9 flex items-center justify-center rounded-full active:bg-gray-100 -ml-1"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.5 5L7.5 10L12.5 15" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{task.title}</p>
        </div>
        <button
          onClick={() => setShowPublish(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-xl text-xs font-semibold active:scale-95 transition-transform shadow-sm shadow-gray-100"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <path d="M2 9v2a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V9" />
            <path d="M7 2v7M4 5l3-3 3 3" />
          </svg>
          {t("taskDetail.publish")}
        </button>
      </div>

      {/* 內容 */}
      <div className="flex-1 overflow-y-auto">
        {/* 任務資訊 */}
        <div className="bg-white px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <div
              className={`w-8 h-8 rounded-full bg-gradient-to-br ${task.agentBg} flex items-center justify-center text-white font-bold text-sm`}
            >
              {task.agentAvatar}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-700">{task.agentName}</p>
              <p className="text-xs text-gray-400">{task.createdAt}</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-gray-500" />
              <span className="text-xs text-gray-700 font-medium">{t("taskDetail.completed")}</span>
            </div>
          </div>

          {/* 交付物下載 */}
          <div className="space-y-2">
            {task.deliverables.map((d, i) => (
              <div key={i} className="relative">
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#1C1C1E" strokeWidth="1.8" strokeLinecap="round">
                      <path d="M8 2v8M4 6l4 4 4-4M2 12h12" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">{d.title}</p>
                  </div>
                  <button
                    disabled={downloadingIdx === i}
                    onClick={() => setFormatPickerIdx(formatPickerIdx === i ? null : i)}
                    className="flex items-center gap-1 text-xs text-gray-900 font-medium px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg active:bg-gray-50 disabled:opacity-50"
                  >
                    {downloadingIdx === i ? (
                      <div className="w-3 h-3 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        {t("taskDetail.download")}
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                          <path d="M2 4l3 3 3-3" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
                {/* 格式選擇下拉 */}
                {formatPickerIdx === i && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden min-w-[130px]">
                    {FORMAT_OPTIONS.map((fmt) => (
                      <button
                        key={fmt.id}
                        onClick={() => handleDownload(i, fmt.id)}
                        className="w-full text-left px-4 py-2.5 text-xs text-gray-800 active:bg-gray-50 hover:bg-gray-50 font-medium"
                      >
                        {fmt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 任務內容（Markdown 渲染） */}
        <div className="bg-white mt-2 px-4 py-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{t("taskDetail.taskContent")}</p>
          <div className="prose prose-sm max-w-none text-gray-800">
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 className="text-base font-bold text-gray-900 mb-3 mt-0">{children}</h1>,
                h2: ({ children }) => <h2 className="text-sm font-bold text-gray-900 mb-2 mt-4">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-semibold text-gray-800 mb-1.5 mt-3">{children}</h3>,
                p: ({ children }) => <p className="text-sm text-gray-700 mb-2 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 mb-2">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1 mb-2">{children}</ol>,
                li: ({ children }) => <li className="text-sm text-gray-700">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                hr: () => <hr className="border-gray-200 my-4" />,
              }}
            >
              {task.content}
            </ReactMarkdown>
          </div>
        </div>
      </div>

      {/* 發布選單 Bottom Sheet */}
      {showPublish && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowPublish(false)}>
          <div
            className="bg-white w-full rounded-t-3xl pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">{t("taskDetail.publishTitle")}</h3>
              <button onClick={() => setShowPublish(false)} className="w-8 h-8 flex items-center justify-center rounded-full active:bg-gray-100">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 4l10 10M14 4L4 14" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3 p-5">
              {PUBLISH_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handlePublish(option.id)}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl active:scale-95 transition-transform"
                >
                  <div className={`w-12 h-12 rounded-2xl ${option.bg} flex items-center justify-center ${option.color}`}>
                    {option.icon}
                  </div>
                  <p className="text-xs font-medium text-gray-700 text-center leading-tight">{option.label}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
