/**
 * 廣告成效儀表板卡片 — Spark Agency 專用
 * 顯示 META、TikTok、Google 三平台核心廣告指標
 */

interface PlatformData {
  emoji: string;
  name: string;
  roas: string;
  roasChange: string;
  roasUp: boolean;
  spend: string;
  bgColor: string;
  textColor: string;
}

const PLATFORMS: PlatformData[] = [
  {
    emoji: "🔵",
    name: "META",
    roas: "2.8x",
    roasChange: "+12%",
    roasUp: true,
    spend: "NT$42,000",
    bgColor: "bg-blue-50",
    textColor: "text-blue-600",
  },
  {
    emoji: "🎵",
    name: "TikTok",
    roas: "4.1x",
    roasChange: "+28%",
    roasUp: true,
    spend: "NT$28,000",
    bgColor: "bg-pink-50",
    textColor: "text-pink-600",
  },
  {
    emoji: "🔴",
    name: "Google",
    roas: "3.4x",
    roasChange: "−5%",
    roasUp: false,
    spend: "NT$35,000",
    bgColor: "bg-red-50",
    textColor: "text-red-600",
  },
];

export default function AdPerformanceCard() {
  return (
    <div className="flex-shrink-0 px-4 pb-4">
      <p className="text-xs text-[#8E8E93] mb-3 tracking-wide">📱 本月廣告儀表板</p>
      <div className="space-y-2.5">
        {PLATFORMS.map((p) => (
          <div
            key={p.name}
            className={`${p.bgColor} rounded-2xl px-4 py-3.5 flex items-center gap-3`}
          >
            <div className="text-2xl">{p.emoji}</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-500 mb-0.5">{p.name}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900">{p.roas}</span>
                <span className={`text-xs font-semibold ${p.roasUp ? "text-green-600" : "text-red-500"}`}>
                  {p.roasUp ? "↑" : "↓"} {p.roasChange}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">ROAS · 本月花費 {p.spend}</p>
            </div>
            <div className={`w-1 h-12 rounded-full ${p.bgColor.replace("50", "300")}`} />
          </div>
        ))}
      </div>
      <p className="text-[10px] text-[#8E8E93] text-right mt-2">品牌 B · 10月數據</p>
    </div>
  );
}
