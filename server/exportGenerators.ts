/**
 * 文件導出生成器
 * 生成真實可下載的 PPTX、DOCX、XLSX、PDF 文件（顧問風格）
 */
import puppeteer from "puppeteer";
import pptxgen from "pptxgenjs";
import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Packer,
} from "docx";
import ExcelJS from "exceljs";

// ── 主題系統 ─────────────────────────────────────────────────
export type PptTheme = "bcg" | "minimal" | "tech" | "warm";

interface ThemeColors {
  coverBg: string;
  coverAccent: string;   // 封面裝飾色（左側條 / 底線）
  coverTitle: string;
  coverSubtitle: string; // 公司名稱 + 日期
  headerBg: string;      // 內容頁頂部橫條
  headerAccent: string;  // 右側小矩形 / 分隔線
  dividerLine: string;   // 金色分隔短線
  bodyText: string;
  footerText: string;
}

function getThemeColors(theme: PptTheme, customPrimary?: string): ThemeColors {
  if (customPrimary) {
    // 自定義品牌主色：coverBg 與 headerBg 使用主色，accent 使用淡化版
    return {
      coverBg: customPrimary,
      coverAccent: "FFFFFF",
      coverTitle: "FFFFFF",
      coverSubtitle: "FFFFFFCC",
      headerBg: customPrimary,
      headerAccent: "FFFFFF",
      dividerLine: "FFFFFF",
      bodyText: "1C1C1C",
      footerText: "888888",
    };
  }
  switch (theme) {
    case "minimal":
      return {
        coverBg: "FFFFFF",
        coverAccent: "2563EB",
        coverTitle: "111111",
        coverSubtitle: "555555",
        headerBg: "111111",
        headerAccent: "2563EB",
        dividerLine: "2563EB",
        bodyText: "333333",
        footerText: "999999",
      };
    case "tech":
      return {
        coverBg: "0F2744",
        coverAccent: "00A3E0",
        coverTitle: "FFFFFF",
        coverSubtitle: "00A3E0",
        headerBg: "0F2744",
        headerAccent: "00A3E0",
        dividerLine: "00A3E0",
        bodyText: "1C2A3A",
        footerText: "888888",
      };
    case "warm":
      return {
        coverBg: "FFF8F3",
        coverAccent: "E07B39",
        coverTitle: "5C3D1E",
        coverSubtitle: "E07B39",
        headerBg: "5C3D1E",
        headerAccent: "E07B39",
        dividerLine: "E07B39",
        bodyText: "3D2A15",
        footerText: "9E7A56",
      };
    case "bcg":
    default:
      return {
        coverBg: "1B2B4B",
        coverAccent: "C9A84C",
        coverTitle: "FFFFFF",
        coverSubtitle: "C9A84C",
        headerBg: "1B2B4B",
        headerAccent: "C9A84C",
        dividerLine: "C9A84C",
        bodyText: "1C1C1C",
        footerText: "888888",
      };
  }
}

// ── 從 PPTX buffer 提取主色 ────────────────────────────────────
import JSZip from "jszip";

export async function extractPptxPrimaryColor(buffer: Buffer): Promise<string> {
  try {
    const zip = await JSZip.loadAsync(buffer);
    const themeFile = zip.file("ppt/theme/theme1.xml");
    if (!themeFile) return "1B2B4B";
    const xml = await themeFile.async("string");
    // 找第一個 dk1（深色1，通常是主色）附近的 srgbClr
    const dk1Match = xml.match(/<a:dk1>[\s\S]*?<a:srgbClr val="([0-9A-Fa-f]{6})"/);
    if (dk1Match) return dk1Match[1].toUpperCase();
    // fallback: 找第一個 srgbClr
    const anyMatch = xml.match(/<a:srgbClr val="([0-9A-Fa-f]{6})"/);
    return anyMatch ? anyMatch[1].toUpperCase() : "1B2B4B";
  } catch {
    return "1B2B4B";
  }
}

// ── 顏色常數（其他生成器用）──────────────────────────────────────
const NAVY = "1B2B4B"; // 用於 DOCX 標題色
const WHITE = "FFFFFF"; // 用於 PPTX 內容頁白底

// ── Markdown 解析：轉成投影片資料 ────────────────────────────────
interface SlideData {
  title: string;
  bullets: string[];
  isCover?: boolean;
}

function parseMdToSlides(
  title: string,
  content: string,
  companyName: string,
  maxSlides = 12
): SlideData[] {
  const slides: SlideData[] = [];

  // 封面
  slides.push({
    title,
    bullets: [
      companyName,
      new Date().toLocaleDateString("zh-TW", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    ],
    isCover: true,
  });

  const lines = content.split("\n");
  let current: SlideData | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (line.startsWith("## ")) {
      if (current) slides.push(current);
      current = { title: line.slice(3), bullets: [] };
    } else if (line.startsWith("### ")) {
      if (!current) {
        current = { title: line.slice(4), bullets: [] };
      } else {
        current.bullets.push(`▸ ${line.slice(4)}`);
      }
    } else if (line.startsWith("# ")) {
      // 頂層標題已作封面，略過
    } else if (/^[-*]\s+/.test(line)) {
      if (current) {
        current.bullets.push(line.replace(/^[-*]\s+/, "").replace(/\*\*/g, ""));
      }
    } else if (/^\d+\.\s+/.test(line)) {
      if (current) {
        current.bullets.push(line.replace(/^\d+\.\s+/, "").replace(/\*\*/g, ""));
      }
    } else if (line.length > 4 && line.length < 160) {
      if (current) {
        current.bullets.push(line.replace(/\*\*/g, ""));
      }
    }

    // 每頁最多 7 點，超過就另起一頁
    if (current && current.bullets.length >= 7) {
      slides.push(current);
      current = null;
    }
  }

  if (current) slides.push(current);

  // 內容不足時補充默認章節
  if (slides.length < 4) {
    slides.push(
      {
        title: "執行摘要",
        bullets: ["核心目標", "主要策略方向", "預期成效", "時程規劃"],
      },
      {
        title: "解決方案",
        bullets: ["方案一：快速落地", "方案二：持續優化", "方案三：長期佈局"],
      },
      {
        title: "執行計劃",
        bullets: [
          "第一階段（1-3月）：奠基",
          "第二階段（4-6月）：加速",
          "第三階段（7-12月）：收割",
        ],
      },
      {
        title: "結論與建議",
        bullets: ["核心建議", "下一步行動", "預期 ROI"],
      }
    );
  }

  return slides.slice(0, maxSlides);
}

// ── PPTX 生成（多主題支援）──────────────────────────────────────
export async function generatePPTX(
  title: string,
  content: string,
  companyName: string,
  options?: { maxSlides?: number; theme?: PptTheme; customPrimary?: string }
): Promise<Buffer> {
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_WIDE"; // 13.33" × 7.5"

  const theme = options?.theme ?? "bcg";
  const c = getThemeColors(theme, options?.customPrimary);

  // minimal 主題封面用深色標題，其他頁背景白色
  const contentPageBg = theme === "warm" ? "FFFDF9" : WHITE;

  const slides = parseMdToSlides(title, content, companyName, options?.maxSlides ?? 12);

  for (const data of slides) {
    const slide = pptx.addSlide();

    if (data.isCover) {
      // ── 封面 ──────────────────────────────────────────────
      slide.background = { color: c.coverBg };

      // 左側裝飾條
      slide.addShape("rect" as any, {
        x: 0, y: 0, w: 0.12, h: "100%",
        fill: { color: c.coverAccent },
        line: { color: c.coverAccent, width: 0 },
      });

      // 底部細線
      slide.addShape("rect" as any, {
        x: 0, y: 6.92, w: "100%", h: 0.08,
        fill: { color: c.coverAccent },
        line: { color: c.coverAccent, width: 0 },
      });

      // 主標題
      slide.addText(data.title, {
        x: 0.55, y: 1.8, w: 12, h: 2.2,
        fontSize: 36, bold: true,
        color: c.coverTitle,
        align: "left", fontFace: "Arial", valign: "middle", wrap: true,
      });

      // 公司名稱 + 日期
      slide.addText(`${data.bullets[0]}  ·  ${data.bullets[1]}`, {
        x: 0.55, y: 4.3, w: 12, h: 0.5,
        fontSize: 14, color: c.coverSubtitle,
        align: "left", fontFace: "Arial",
      });

      // Confidential 標記
      slide.addText("CONFIDENTIAL", {
        x: 0.55, y: 7.15, w: 5, h: 0.25,
        fontSize: 8, color: c.footerText,
        align: "left", fontFace: "Arial",
      });
    } else {
      // ── 內容頁 ────────────────────────────────────────────
      slide.background = { color: contentPageBg };

      // 頂部橫條
      slide.addShape("rect" as any, {
        x: 0, y: 0, w: "100%", h: 0.85,
        fill: { color: c.headerBg },
        line: { color: c.headerBg, width: 0 },
      });

      // 右側小矩形裝飾
      slide.addShape("rect" as any, {
        x: 12.53, y: 0, w: 0.8, h: 0.85,
        fill: { color: c.headerAccent },
        line: { color: c.headerAccent, width: 0 },
      });

      // 頁面標題
      slide.addText(data.title, {
        x: 0.4, y: 0, w: 11.8, h: 0.85,
        fontSize: 20, bold: true,
        color: WHITE,
        align: "left", fontFace: "Arial", valign: "middle",
      });

      // 分隔短線
      slide.addShape("rect" as any, {
        x: 0.4, y: 0.9, w: 1.8, h: 0.04,
        fill: { color: c.dividerLine },
        line: { color: c.dividerLine, width: 0 },
      });

      // 要點內容
      if (data.bullets.length > 0) {
        const bulletText = data.bullets.map((b) => `• ${b}`).join("\n");
        slide.addText(bulletText, {
          x: 0.5, y: 1.1, w: 12, h: 5.9,
          fontSize: 15, color: c.bodyText,
          align: "left", valign: "top", fontFace: "Arial",
          lineSpacingMultiple: 1.6, wrap: true,
        });
      }

      // 頁尾
      slide.addText(`${companyName}  |  Confidential`, {
        x: 0.4, y: 7.2, w: 10, h: 0.25,
        fontSize: 8, color: c.footerText,
        align: "left", fontFace: "Arial",
      });
    }
  }

  const output = await pptx.write({ outputType: "nodebuffer" });
  return Buffer.from(output as ArrayBuffer);
}

// ── DOCX 生成（顧問報告格式）────────────────────────────────────

function parseMdToParagraphs(content: string): Paragraph[] {
  const result: Paragraph[] = [];

  for (const raw of content.split("\n")) {
    const line = raw.trim();

    if (!line) {
      result.push(new Paragraph({ text: "" }));
      continue;
    }

    if (line.startsWith("# ")) {
      result.push(
        new Paragraph({ text: line.slice(2), heading: HeadingLevel.HEADING_1 })
      );
    } else if (line.startsWith("## ")) {
      result.push(
        new Paragraph({ text: line.slice(3), heading: HeadingLevel.HEADING_2 })
      );
    } else if (line.startsWith("### ")) {
      result.push(
        new Paragraph({ text: line.slice(4), heading: HeadingLevel.HEADING_3 })
      );
    } else if (/^[-*]\s+/.test(line)) {
      result.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line.replace(/^[-*]\s+/, "").replace(/\*\*(.+?)\*\*/g, "$1"),
            }),
          ],
          bullet: { level: 0 },
        })
      );
    } else if (/^\d+\.\s+/.test(line)) {
      result.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line.replace(/^\d+\.\s+/, "").replace(/\*\*(.+?)\*\*/g, "$1"),
            }),
          ],
          bullet: { level: 0 },
        })
      );
    } else {
      // 支援行內粗體
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      const runs = parts.map((p) =>
        p.startsWith("**") && p.endsWith("**")
          ? new TextRun({ text: p.slice(2, -2), bold: true })
          : new TextRun({ text: p })
      );
      result.push(new Paragraph({ children: runs }));
    }
  }

  return result;
}

export async function generateDOCX(
  title: string,
  content: string,
  companyName: string
): Promise<Buffer> {
  const doc = new Document({
    styles: {
      default: {
        heading1: {
          run: { size: 32, bold: true, color: NAVY },
          paragraph: { spacing: { before: 400, after: 200 } },
        },
        heading2: {
          run: { size: 26, bold: true, color: NAVY },
          paragraph: { spacing: { before: 320, after: 160 } },
        },
        heading3: {
          run: { size: 22, bold: true, color: "444444" },
          paragraph: { spacing: { before: 240, after: 120 } },
        },
        document: {
          run: { size: 22, font: "Arial" },
          paragraph: { spacing: { line: 276, after: 120 } },
        },
      },
    },
    sections: [
      {
        properties: {},
        children: [
          // 標題頁
          new Paragraph({
            children: [
              new TextRun({ text: title, size: 44, bold: true, color: NAVY }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 1440, after: 480 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: companyName, size: 24, color: "555555" }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 160 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: new Date().toLocaleDateString("zh-TW", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }),
                size: 20,
                color: "999999",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 1440 },
          }),
          // 正文
          ...parseMdToParagraphs(content),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}

// ── XLSX 生成（財務/數據報表格式）───────────────────────────────

interface XLSXRow {
  headers: string[];
  rows: string[][];
  sheetName?: string;
}

/**
 * 解析內容為試算表資料結構
 * 支援 JSON 格式（headers + rows）及 Markdown 表格
 */
function parseContentToXLSX(title: string, content: string): XLSXRow[] {
  // 嘗試解析 JSON 格式
  try {
    const parsed = JSON.parse(content);
    if (parsed.headers && parsed.rows) {
      return [{ headers: parsed.headers, rows: parsed.rows, sheetName: title }];
    }
    if (Array.isArray(parsed)) {
      return parsed.map((sheet: XLSXRow, i: number) => ({
        headers: sheet.headers || [],
        rows: sheet.rows || [],
        sheetName: sheet.sheetName || `Sheet${i + 1}`,
      }));
    }
  } catch {
    // 非 JSON，繼續解析 Markdown
  }

  // 解析 Markdown 表格或列表
  const sheets: XLSXRow[] = [];
  let current: XLSXRow | null = null;
  let sectionTitle = title;

  for (const raw of content.split("\n")) {
    const line = raw.trim();
    if (!line) continue;

    if (line.startsWith("## ") || line.startsWith("# ")) {
      if (current && (current.headers.length > 0 || current.rows.length > 0)) {
        sheets.push(current);
      }
      sectionTitle = line.replace(/^#+\s+/, "");
      current = { headers: [], rows: [], sheetName: sectionTitle.slice(0, 31) };
    } else if (line.includes("|")) {
      // Markdown 表格行
      const cells = line.split("|").map(c => c.trim()).filter(Boolean);
      if (cells.every(c => /^-+$/.test(c))) continue; // 分隔行
      if (!current) current = { headers: [], rows: [], sheetName: sectionTitle.slice(0, 31) };
      if (current.headers.length === 0) {
        current.headers = cells;
      } else {
        current.rows.push(cells);
      }
    } else if (/^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line)) {
      if (!current) current = { headers: [], rows: [], sheetName: sectionTitle.slice(0, 31) };
      if (current.headers.length === 0) {
        current.headers = ["項目", "內容"];
      }
      const text = line.replace(/^[-*\d.]+\s+/, "").replace(/\*\*/g, "");
      const [label, ...rest] = text.split("：");
      current.rows.push([label, rest.join("：") || ""]);
    }
  }

  if (current && (current.headers.length > 0 || current.rows.length > 0)) {
    sheets.push(current);
  }

  // 若仍無結構，建立一個單欄摘要表
  if (sheets.length === 0) {
    const lines = content
      .split("\n")
      .map(l => l.trim())
      .filter(l => l && !l.startsWith("#"));
    sheets.push({
      headers: ["內容摘要"],
      rows: lines.slice(0, 500).map(l => [l.replace(/\*\*/g, "")]),
      sheetName: title.slice(0, 31),
    });
  }

  return sheets;
}

// ── PE 級財務 Excel（Hillhouse / 私募基金）────────────────────────

function buildHillhousePESheets(workbook: ExcelJS.Workbook): void {
  const NAVY_ARGB = "FF1B2B4B";
  const NAVY2_ARGB = "FF2D4270";
  const WHITE_ARGB = "FFFFFFFF";
  const ALT_ARGB = "FFF5F7FA";
  const LGRAY_ARGB = "FFEEEFF2";

  const hFont = (sz = 10): Partial<ExcelJS.Font> => ({
    name: "Calibri", size: sz, bold: true, color: { argb: WHITE_ARGB },
  });
  const bFont: Partial<ExcelJS.Font> = { name: "Calibri", size: 10, color: { argb: "FF1C1C1C" } };
  const bBold: Partial<ExcelJS.Font> = { name: "Calibri", size: 10, bold: true, color: { argb: "FF1C1C1C" } };

  const navyFill = (argb = NAVY_ARGB): ExcelJS.Fill => ({
    type: "pattern", pattern: "solid", fgColor: { argb },
  });
  const altFill: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: ALT_ARGB } };
  const lgFill: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: LGRAY_ARGB } };

  const bdr: Partial<ExcelJS.Borders> = {
    top:    { style: "thin", color: { argb: "FFE5E7EB" } },
    bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
    left:   { style: "thin", color: { argb: "FFE5E7EB" } },
    right:  { style: "thin", color: { argb: "FFE5E7EB" } },
  };

  // ── Sheet 1: Portfolio Summary ──────────────────────────────────
  const ws1 = workbook.addWorksheet("Portfolio Summary");

  // Title row
  ws1.mergeCells("A1:L1");
  const t1 = ws1.getCell("A1");
  t1.value = "Hillhouse Capital — Portfolio Summary  |  As of Q4 2024";
  t1.font = hFont(13);
  t1.fill = navyFill();
  t1.alignment = { horizontal: "center", vertical: "middle" };
  ws1.getRow(1).height = 34;

  // Header row
  const portHeaders = [
    "Portfolio Company", "Investment Date", "Vintage Year",
    "Committed Capital\n(USD M)", "Invested Capital\n(USD M)",
    "Realized Value\n(USD M)", "Unrealized NAV\n(USD M)", "Total Value\n(USD M)",
    "IRR (%)", "MOIC (x)", "DPI (x)", "TVPI (x)",
  ];
  const hr1 = ws1.addRow(portHeaders);
  hr1.height = 42;
  hr1.eachCell((cell) => {
    cell.font = hFont();
    cell.fill = navyFill(NAVY2_ARGB);
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = bdr;
  });

  // Portfolio data
  const port = [
    ["ByteDance Series C",        "Mar 2019", 2019,  150,  150,  310,   85, 395, 28.5, 2.63, 2.07, 2.63],
    ["Meituan Pre-IPO",           "Nov 2018", 2018,  120,  120,  285,    0, 285, 24.8, 2.38, 2.38, 2.38],
    ["Sea Limited Series D",      "Jun 2020", 2020,  200,  200,  180,  240, 420, 22.1, 2.10, 0.90, 2.10],
    ["Grab Holdings Series H",    "Mar 2021", 2021,  180,  180,   60,  195, 255, 15.4, 1.42, 0.33, 1.42],
    ["Xiaomi Pre-IPO",            "Jul 2018", 2018,  100,  100,  240,    0, 240, 31.2, 2.40, 2.40, 2.40],
    ["Nongfu Spring Pre-IPO",     "Apr 2020", 2020,   80,   80,   45,   95, 140, 18.7, 1.75, 0.56, 1.75],
    ["CATL Series C",             "Sep 2022", 2022,  250,  250,    0,  280, 280, 12.3, 1.12, 0.00, 1.12],
  ];
  port.forEach((row, idx) => {
    const dr = ws1.addRow(row);
    dr.height = 22;
    dr.eachCell({ includeEmpty: true }, (cell, col) => {
      cell.font = bFont;
      cell.border = bdr;
      if (idx % 2 === 1) cell.fill = altFill;
      cell.alignment = {
        horizontal: col <= 3 ? "left" : "right",
        vertical: "middle",
      };
      if (col >= 4 && col <= 8 && typeof cell.value === "number") cell.numFmt = '#,##0.0';
      if (col === 9 && typeof cell.value === "number") cell.numFmt = '0.0"%"';
      if (col >= 10 && typeof cell.value === "number") cell.numFmt = '0.00"x"';
    });
  });

  // Total row
  const totRow = ws1.addRow(["Portfolio Total / Weighted Avg", "", "", 1080, 1080, 1120, 895, 2015, 22.4, 1.87, 1.04, 1.87]);
  totRow.height = 26;
  totRow.eachCell({ includeEmpty: true }, (cell, col) => {
    cell.font = { ...hFont(), color: { argb: WHITE_ARGB } };
    cell.fill = navyFill();
    cell.border = bdr;
    cell.alignment = { horizontal: col <= 3 ? "left" : "right", vertical: "middle" };
    if (col >= 4 && col <= 8 && typeof cell.value === "number") cell.numFmt = '#,##0.0';
    if (col === 9 && typeof cell.value === "number") cell.numFmt = '0.0"%"';
    if (col >= 10 && typeof cell.value === "number") cell.numFmt = '0.00"x"';
  });

  ws1.columns = [
    { width: 30 }, { width: 16 }, { width: 14 },
    { width: 18 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 16 },
    { width: 10 }, { width: 11 }, { width: 10 }, { width: 10 },
  ];
  ws1.views = [{ state: "frozen", xSplit: 0, ySplit: 2 }];

  // ── Sheet 2: Vintage Year Analysis ─────────────────────────────
  const ws2 = workbook.addWorksheet("Vintage Year Analysis");

  ws2.mergeCells("A1:J1");
  const t2 = ws2.getCell("A1");
  t2.value = "Vintage Year Performance vs. Benchmark  |  Hillhouse Capital";
  t2.font = hFont(13);
  t2.fill = navyFill();
  t2.alignment = { horizontal: "center", vertical: "middle" };
  ws2.getRow(1).height = 34;

  const vHeaders = [
    "Vintage\nYear", "# Inv.", "Total Committed\n(USD M)",
    "IRR (%)", "MOIC (x)", "DPI (x)", "TVPI (x)",
    "S&P 500\nSame Period (%)", "Top Quartile\nPE Benchmark (%)", "Alpha vs.\nBenchmark",
  ];
  const hr2 = ws2.addRow(vHeaders);
  hr2.height = 42;
  hr2.eachCell((cell) => {
    cell.font = hFont();
    cell.fill = navyFill(NAVY2_ARGB);
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = bdr;
  });

  const vintage = [
    [2018, 2,  220,  27.8, 2.40, 2.40, 2.40,  12.4, 22.0, "+5.8%"],
    [2019, 1,  150,  28.5, 2.63, 2.07, 2.63,  18.2, 24.0, "+4.5%"],
    [2020, 2,  280,  20.8, 1.96, 0.80, 1.96,  26.8, 20.0, "+0.8%"],
    [2021, 1,  180,  15.4, 1.42, 0.33, 1.42,  14.5, 18.0, "-2.6%"],
    [2022, 1,  250,  12.3, 1.12, 0.00, 1.12,  -8.2, 16.0, "-3.7%"],
    [2023, 0,    0, "N/A","N/A","N/A","N/A",  24.1, 18.5, "—"],
    [2024, 0,    0, "N/A","N/A","N/A","N/A",  22.3, 19.0, "—"],
  ];
  vintage.forEach((row, idx) => {
    const dr = ws2.addRow(row);
    dr.height = 22;
    dr.eachCell({ includeEmpty: true }, (cell, col) => {
      cell.font = bFont;
      cell.border = bdr;
      if (idx % 2 === 1) cell.fill = altFill;
      cell.alignment = { horizontal: col <= 2 ? "center" : "right", vertical: "middle" };
      if (typeof cell.value === "number") {
        if (col === 3) cell.numFmt = '#,##0.0';
        else if (col === 4) cell.numFmt = '0.0"%"';
        else if (col >= 5 && col <= 7) cell.numFmt = '0.00"x"';
        else if (col === 8 || col === 9) cell.numFmt = '0.0"%"';
      }
    });
  });

  ws2.columns = [
    { width: 12 }, { width: 8 }, { width: 20 },
    { width: 10 }, { width: 11 }, { width: 10 }, { width: 10 },
    { width: 20 }, { width: 24 }, { width: 16 },
  ];
  ws2.views = [{ state: "frozen", xSplit: 0, ySplit: 2 }];

  // ── Sheet 3: Cash Flow Waterfall ────────────────────────────────
  const ws3 = workbook.addWorksheet("Cash Flow Waterfall");

  ws3.mergeCells("A1:F1");
  const t3 = ws3.getCell("A1");
  t3.value = "Annual Cash Flow Waterfall  |  Hillhouse Capital Fund I";
  t3.font = hFont(13);
  t3.fill = navyFill();
  t3.alignment = { horizontal: "center", vertical: "middle" };
  ws3.getRow(1).height = 34;

  const cfHeaders = [
    "Year", "Capital Called\n(USD M)", "Distributions\n(USD M)",
    "Net Cash Flow\n(USD M)", "Cumulative\n(USD M)", "Notes",
  ];
  const hr3 = ws3.addRow(cfHeaders);
  hr3.height = 42;
  hr3.eachCell((cell) => {
    cell.font = hFont();
    cell.fill = navyFill(NAVY2_ARGB);
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = bdr;
  });

  const cf = [
    [2019, -380,   0,  -380, -380, "Initial deployment — ByteDance & Meituan vintage"],
    [2020, -280,  85,  -195, -575, "Sea Limited, Nongfu Spring entry"],
    [2021, -180, 160,   -20, -595, "Grab entry; Xiaomi partial exit"],
    [2022, -250, 310,    60, -535, "CATL entry; ByteDance partial realization"],
    [2023,    0, 285,   285, -250, "Meituan full exit — DPI 0.5x milestone reached"],
    [2024,    0, 200,   200,  -50, "Ongoing distributions — DPI 1.0x target on track"],
  ];
  cf.forEach((row, idx) => {
    const dr = ws3.addRow(row);
    dr.height = 22;
    dr.eachCell({ includeEmpty: true }, (cell, col) => {
      cell.border = bdr;
      if (idx % 2 === 1) cell.fill = altFill;
      if (col === 1) {
        cell.font = bBold;
        cell.alignment = { horizontal: "center", vertical: "middle" };
      } else if (col <= 5) {
        cell.font = bFont;
        cell.alignment = { horizontal: "right", vertical: "middle" };
        if (typeof cell.value === "number") {
          cell.numFmt = '#,##0.0;[Red](#,##0.0)';
        }
      } else {
        cell.font = { ...bFont, color: { argb: "FF555555" } };
        cell.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
      }
    });
  });

  // DPI Milestone section
  ws3.addRow([]);
  const mlTitle = ws3.addRow(["DPI Milestones", "", "", "", "", ""]);
  mlTitle.getCell(1).font = { name: "Calibri", size: 11, bold: true, color: { argb: NAVY_ARGB } };
  mlTitle.height = 22;

  const milestones = [
    ["0.5x DPI", "✅ Achieved", "Q4 2023",         "", "", "Meituan full exit triggered milestone"],
    ["1.0x DPI", "🔄 On Track", "Q2 2025 (proj.)", "", "", "Pending Sea Limited + remaining distributions"],
    ["1.5x DPI", "📅 Target",   "Q4 2027 (proj.)", "", "", "Subject to CATL / Grab monetization events"],
  ];
  milestones.forEach((row, idx) => {
    const dr = ws3.addRow(row);
    dr.height = 22;
    dr.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = bFont;
      cell.border = bdr;
      if (idx % 2 === 0) cell.fill = lgFill;
      cell.alignment = { horizontal: "left", vertical: "middle" };
    });
  });

  ws3.columns = [
    { width: 12 }, { width: 22 }, { width: 22 }, { width: 22 }, { width: 22 }, { width: 44 },
  ];
  ws3.views = [{ state: "frozen", xSplit: 0, ySplit: 2 }];
}

function isHillhousePEContext(title: string, companyName: string, userRole?: string): boolean {
  const t = (title + companyName + (userRole ?? "")).toLowerCase();
  return (
    t.includes("hillhouse") ||
    t.includes("私募") ||
    (t.includes("irr") && t.includes("tvpi")) ||
    (t.includes("lp") && t.includes("季報")) ||
    (userRole === "投資總監" || userRole === "財務")
  );
}

export async function generateXLSX(
  title: string,
  content: string,
  companyName: string,
  userRole?: string
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = companyName;
  workbook.created = new Date();

  // PE 模式：Hillhouse / 私募基金 → 生成 3-sheet PE 級 Excel
  if (isHillhousePEContext(title, companyName, userRole)) {
    buildHillhousePESheets(workbook);
    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }

  const headerFill: ExcelJS.Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1B2B4B" }, // NAVY
  };
  const headerFont: Partial<ExcelJS.Font> = {
    name: "Arial",
    size: 11,
    bold: true,
    color: { argb: "FFFFFFFF" },
  };
  const bodyFont: Partial<ExcelJS.Font> = {
    name: "Arial",
    size: 10,
    color: { argb: "FF1C1C1C" },
  };
  const altFill: ExcelJS.Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF5F7FA" },
  };
  const borderStyle: Partial<ExcelJS.Borders> = {
    bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
  };

  const sheets = parseContentToXLSX(title, content);

  for (const sheetData of sheets) {
    const sheetName = (sheetData.sheetName || "Sheet1").slice(0, 31);
    const ws = workbook.addWorksheet(sheetName);

    // 標題行
    if (sheetData.headers.length > 0) {
      const headerRow = ws.addRow(sheetData.headers);
      headerRow.eachCell((cell) => {
        cell.fill = headerFill;
        cell.font = headerFont;
        cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
        cell.border = borderStyle;
      });
      headerRow.height = 24;
    }

    // 資料行
    sheetData.rows.forEach((row, idx) => {
      const dataRow = ws.addRow(row);
      dataRow.eachCell((cell) => {
        cell.font = bodyFont;
        cell.alignment = { vertical: "middle", wrapText: true };
        cell.border = borderStyle;
        if (idx % 2 === 1) cell.fill = altFill;
      });
      dataRow.height = 20;
    });

    // 自動調整欄寬
    ws.columns.forEach((col) => {
      let maxLen = 10;
      col.eachCell?.({ includeEmpty: false }, (cell) => {
        const len = String(cell.value ?? "").length;
        if (len > maxLen) maxLen = len;
      });
      col.width = Math.min(maxLen + 4, 50);
    });

    // 凍結標題行
    ws.views = [{ state: "frozen", ySplit: 1 }];
  }

  // 若沒有工作表（不應發生）補一個空的
  if (workbook.worksheets.length === 0) {
    workbook.addWorksheet("Sheet1");
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

// ── PDF 生成（Puppeteer HTML→PDF，BCG 顧問風格）──────────────────

/** 將 Markdown 內容轉成結構化 HTML 頁面段落 */
function mdToHtmlSections(content: string): string {
  const lines = content.split("\n");
  let html = "";
  let inList = false;

  const closeList = () => {
    if (inList) { html += "</ul>\n"; inList = false; }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (!line.trim()) {
      closeList();
      continue;
    }

    if (line.startsWith("# ")) {
      closeList();
      // H1 → 跳過（已用作封面標題）
    } else if (line.startsWith("## ")) {
      closeList();
      html += `<h2>${escHtml(line.slice(3))}</h2>\n`;
    } else if (line.startsWith("### ")) {
      closeList();
      html += `<h3>${escHtml(line.slice(4))}</h3>\n`;
    } else if (/^[-*]\s+/.test(line)) {
      if (!inList) { html += "<ul>\n"; inList = true; }
      html += `<li>${inlineMd(line.replace(/^[-*]\s+/, ""))}</li>\n`;
    } else if (/^\d+\.\s+/.test(line)) {
      if (!inList) { html += "<ul>\n"; inList = true; }
      html += `<li>${inlineMd(line.replace(/^\d+\.\s+/, ""))}</li>\n`;
    } else {
      closeList();
      html += `<p>${inlineMd(line)}</p>\n`;
    }
  }
  closeList();
  return html;
}

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inlineMd(s: string): string {
  return escHtml(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

function buildPdfHtml(title: string, content: string, companyName: string): string {
  const date = new Date().toLocaleDateString("zh-TW", {
    year: "numeric", month: "long", day: "numeric",
  });
  const bodyHtml = mdToHtmlSections(content);

  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }

  @page { size: A4; margin: 0; }

  body {
    font-family: "PingFang TC", "Noto Sans TC", "Microsoft JhengHei", "Heiti TC", Arial, sans-serif;
    font-size: 11pt;
    color: #1C1C1C;
    background: #fff;
  }

  /* ── 封面 ── */
  .cover {
    width: 210mm;
    height: 297mm;
    background: #1B2B4B;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 48pt;
    page-break-after: always;
  }
  .cover-accent {
    position: absolute;
    left: 0; top: 0;
    width: 8pt; height: 100%;
    background: #C9A84C;
  }
  .cover-bottom-line {
    position: absolute;
    left: 0; bottom: 24pt;
    width: 100%; height: 3pt;
    background: #C9A84C;
  }
  .cover-title {
    font-size: 28pt;
    font-weight: 700;
    color: #FFFFFF;
    line-height: 1.3;
    margin-bottom: 24pt;
    max-width: 480pt;
  }
  .cover-subtitle {
    font-size: 12pt;
    color: #C9A84C;
    letter-spacing: 0.05em;
  }
  .cover-confidential {
    position: absolute;
    left: 48pt; bottom: 32pt;
    font-size: 7pt;
    color: #888888;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  /* ── 正文頁 ── */
  .page {
    width: 210mm;
    min-height: 297mm;
    padding: 0 0 40pt 0;
    page-break-after: always;
    position: relative;
  }

  /* 頁首 */
  .page-header {
    background: #1B2B4B;
    padding: 14pt 48pt 14pt 48pt;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24pt;
  }
  .page-header-title {
    font-size: 10pt;
    color: #FFFFFF;
    font-weight: 600;
    letter-spacing: 0.03em;
  }
  .page-header-accent {
    width: 20pt; height: 100%;
    min-height: 40pt;
    background: #C9A84C;
    margin: -14pt -0pt -14pt 12pt;
    flex-shrink: 0;
  }

  /* 正文內容 */
  .page-body {
    padding: 0 48pt;
  }

  h2 {
    font-size: 16pt;
    font-weight: 700;
    color: #1B2B4B;
    margin-top: 22pt;
    margin-bottom: 8pt;
    padding-bottom: 6pt;
    border-bottom: 2pt solid #C9A84C;
  }
  h3 {
    font-size: 12pt;
    font-weight: 600;
    color: #1B2B4B;
    margin-top: 14pt;
    margin-bottom: 5pt;
  }
  p {
    font-size: 11pt;
    line-height: 1.75;
    color: #333;
    margin-bottom: 8pt;
  }
  ul {
    list-style: none;
    padding-left: 0;
    margin-bottom: 10pt;
  }
  ul li {
    font-size: 11pt;
    line-height: 1.75;
    color: #333;
    padding-left: 18pt;
    position: relative;
    margin-bottom: 4pt;
  }
  ul li::before {
    content: "▸";
    position: absolute;
    left: 0;
    color: #C9A84C;
    font-size: 10pt;
  }
  strong { color: #1B2B4B; font-weight: 700; }
  em { font-style: italic; color: #555; }

  /* 頁尾 */
  .page-footer {
    position: absolute;
    bottom: 16pt;
    left: 48pt; right: 48pt;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 0.5pt solid #E5E7EB;
    padding-top: 6pt;
  }
  .page-footer-text {
    font-size: 7pt;
    color: #999;
    letter-spacing: 0.05em;
  }
</style>
</head>
<body>

<!-- 封面 -->
<div class="cover">
  <div class="cover-accent"></div>
  <div class="cover-title">${escHtml(title)}</div>
  <div class="cover-subtitle">${escHtml(companyName)}　·　${escHtml(date)}</div>
  <div class="cover-confidential">CONFIDENTIAL</div>
  <div class="cover-bottom-line"></div>
</div>

<!-- 正文 -->
<div class="page">
  <div class="page-header">
    <span class="page-header-title">${escHtml(companyName)}</span>
    <div class="page-header-accent"></div>
  </div>
  <div class="page-body">
    ${bodyHtml}
  </div>
  <div class="page-footer">
    <span class="page-footer-text">${escHtml(companyName)}  |  Confidential</span>
    <span class="page-footer-text">${escHtml(date)}</span>
  </div>
</div>

</body>
</html>`;
}

export async function generatePDF(
  title: string,
  content: string,
  companyName: string
): Promise<Buffer> {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    headless: true,
  });

  try {
    const page = await browser.newPage();
    const html = buildPdfHtml(title, content, companyName);
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
