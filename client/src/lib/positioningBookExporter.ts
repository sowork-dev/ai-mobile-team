/**
 * 定位書高品質匯出器
 *
 * 生成顧問公司水準的 Word (.docx) 和 PowerPoint (.pptx) 定位書文件
 * 目標客戶：BCG、Hillhouse、Microsoft、GroupM
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  TableCell,
  TableRow,
  Table,
  WidthType,
  ShadingType,
  PageBreak,
  Footer,
  Header,
  PageNumberElement,
  SectionType,
  TableLayoutType,
} from "docx";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DocChild = Paragraph | Table;
import PptxGenJS from "pptxgenjs";
import { saveAs } from "file-saver";
import type { PositioningPlan, BrandReasoningFlowResponse } from "../../../shared/brandPositioningTypes";

// ==================== 品牌色彩系統 ====================

const COLORS = {
  // 主色系（深藍，顧問公司感）
  primary: "1B2B4B",
  primaryLight: "2D4A7A",

  // 輔助色
  accent: "C9A84C",        // 金色
  accentDark: "9B7B35",

  // 中性色
  darkGray: "2D3748",
  mediumGray: "4A5568",
  lightGray: "718096",
  borderGray: "E2E8F0",
  bgLight: "F7F9FC",
  bgAccent: "EBF0F7",

  // 狀態色
  success: "2F855A",
  warning: "C05621",

  // 白色
  white: "FFFFFF",
};

// ==================== DOCX 輔助函數 ====================

function makeHeading1(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: true,
        size: 36, // 18pt
        color: COLORS.primary,
        font: "Calibri",
      }),
    ],
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 480, after: 240 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 4, color: COLORS.accent },
    },
  });
}

function makeHeading2(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: true,
        size: 28, // 14pt
        color: COLORS.primaryLight,
        font: "Calibri",
      }),
    ],
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 360, after: 160 },
  });
}

function makeHeading3(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: true,
        size: 24, // 12pt
        color: COLORS.mediumGray,
        font: "Calibri",
      }),
    ],
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 120 },
  });
}

function makeBody(text: string, options: { italic?: boolean; color?: string } = {}): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        size: 22, // 11pt
        color: options.color || COLORS.darkGray,
        font: "Calibri",
        italics: options.italic,
      }),
    ],
    spacing: { after: 120 },
    alignment: AlignmentType.JUSTIFIED,
  });
}

function makeLabel(label: string, value: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: `${label}　`,
        bold: true,
        size: 22,
        color: COLORS.primary,
        font: "Calibri",
      }),
      new TextRun({
        text: value,
        size: 22,
        color: COLORS.darkGray,
        font: "Calibri",
      }),
    ],
    spacing: { after: 100 },
  });
}

function makeBullet(text: string, level = 0): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        size: 22,
        color: COLORS.darkGray,
        font: "Calibri",
      }),
    ],
    bullet: { level },
    spacing: { after: 80 },
  });
}

function makeTaglineBox(chinese: string, english: string, scoreTotal?: number): Paragraph[] {
  const score = scoreTotal !== undefined ? `  •  驗證分數：${scoreTotal}/100` : "";
  return [
    new Paragraph({
      children: [
        new TextRun({
          text: chinese,
          bold: true,
          size: 36,
          color: COLORS.primary,
          font: "Calibri",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 160, after: 80 },
      shading: { type: ShadingType.CLEAR, fill: COLORS.bgAccent },
      border: {
        left: { style: BorderStyle.THICK, size: 12, color: COLORS.accent },
      },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: english + score,
          size: 22,
          color: COLORS.lightGray,
          italics: true,
          font: "Calibri",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
  ];
}

function makeScoreTable(scores: { label: string; score: number; max: number }[]): Table {
  const rows = scores.map(
    ({ label, score, max }) =>
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: label, size: 20, font: "Calibri", color: COLORS.darkGray })] })],
            width: { size: 3600, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: COLORS.bgLight },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: `${score} / ${max}`, size: 20, bold: true, font: "Calibri", color: score >= max * 0.7 ? COLORS.success : COLORS.warning })] })],
            width: { size: 1200, type: WidthType.DXA },
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: "█".repeat(Math.round((score / max) * 10)) + "░".repeat(10 - Math.round((score / max) * 10)), size: 18, font: "Courier New", color: COLORS.accent })],
            })],
            width: { size: 2400, type: WidthType.DXA },
          }),
        ],
      })
  );

  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
  });
}

function makeInfoTable(rows: [string, string][]): Table {
  const tableRows = rows.map(
    ([label, value]) =>
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: label, size: 20, bold: true, font: "Calibri", color: COLORS.primary })] })],
            width: { size: 3000, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: COLORS.bgAccent },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: value, size: 20, font: "Calibri", color: COLORS.darkGray })] })],
            width: { size: 6200, type: WidthType.DXA },
          }),
        ],
      })
  );

  return new Table({
    rows: tableRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
  });
}

function makeDivider(): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: "", size: 4 })],
    border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: COLORS.borderGray } },
    spacing: { before: 200, after: 200 },
  });
}

function makePageBreak(): Paragraph {
  return new Paragraph({ children: [new PageBreak()] });
}

// ==================== DOCX 主函數 ====================

export interface PositioningBookExportOptions {
  brandName: string;
  plan: PositioningPlan;
  planIndex?: number;        // 0 = 方案A, 1 = 方案B
  reportDate?: Date;
  author?: string;
  clientName?: string;       // 客戶名稱（用於頁眉）
}

/**
 * 生成專業定位書 Word 文件
 * 符合頂尖顧問公司交付標準
 */
export async function generatePositioningBookDOC(options: PositioningBookExportOptions): Promise<void> {
  const { brandName, plan, reportDate = new Date(), author = "品牌定位分析師", clientName } = options;
  const { reasoning, emotionalValueSlogan, functionalValueSlogan } = plan;
  const dateStr = reportDate.toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric" });

  // ---- 封面 ----
  const coverSection: DocChild[] = [
    new Paragraph({
      children: [new TextRun({ text: "", size: 80 })],
      spacing: { before: 2000 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "品牌定位策略書",
          bold: true,
          size: 72,
          color: COLORS.primary,
          font: "Calibri",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "BRAND POSITIONING STRATEGY REPORT",
          size: 24,
          color: COLORS.lightGray,
          font: "Calibri",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "─".repeat(40), color: COLORS.accent, size: 20, font: "Calibri" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: brandName,
          bold: true,
          size: 56,
          color: COLORS.primaryLight,
          font: "Calibri",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: plan.title,
          size: 28,
          color: COLORS.mediumGray,
          italics: true,
          font: "Calibri",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 1200 },
    }),
    new Paragraph({
      children: [new TextRun({ text: dateStr, size: 22, color: COLORS.lightGray, font: "Calibri" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [new TextRun({ text: author, size: 22, color: COLORS.lightGray, font: "Calibri" })],
      alignment: AlignmentType.CENTER,
    }),
    makePageBreak(),
  ];

  // ---- 目錄 ----
  const tocSection: DocChild[] = [
    makeHeading1("目  錄"),
    ...([
      ["1.", "執行摘要"],
      ["2.", "目標受眾分析"],
      ["3.", "市場空白洞察"],
      ["4.", "品牌核心優勢"],
      ["5.", "品牌個性輪廓"],
      ["6.", "定位策略方案"],
      ["7.", "標語推薦與驗證"],
    ].map(([num, title]) =>
      new Paragraph({
        children: [
          new TextRun({ text: `${num}  `, bold: true, size: 22, color: COLORS.primary, font: "Calibri" }),
          new TextRun({ text: title, size: 22, color: COLORS.darkGray, font: "Calibri" }),
        ],
        spacing: { after: 120 },
        indent: { left: 360 },
      })
    )),
    makePageBreak(),
  ];

  // ---- 執行摘要 ----
  const { targetAudience, marketGap, brandAdvantage, brandPersonality, tagline } = reasoning;

  const summarySection: DocChild[] = [
    makeHeading1("1.  執行摘要"),
    makeBody(
      `本報告針對「${brandName}」品牌，透過系統性的市場分析與品牌定位框架，` +
      `提出「${plan.title}」定位方案。此方案源於深度的受眾洞察、市場空白識別與品牌優勢盤點，` +
      `旨在建立具差異化且能引發情感共鳴的品牌定位。`
    ),
    makeDivider(),
    makeHeading2("核心定位標語"),
    ...makeTaglineBox(
      emotionalValueSlogan.chinese,
      emotionalValueSlogan.english,
      emotionalValueSlogan.validation?.totalScore
    ),
    makeHeading2("功能價值標語"),
    ...makeTaglineBox(
      functionalValueSlogan.chinese,
      functionalValueSlogan.english,
      functionalValueSlogan.validation?.totalScore
    ),
    makePageBreak(),
  ];

  // ---- 目標受眾 ----
  const audienceSection: DocChild[] = [
    makeHeading1("2.  目標受眾分析"),
    makeHeading2(targetAudience.title),
    makeBody(targetAudience.content),
    ...(targetAudience.details.ageRange ? [makeLabel("年齡層", targetAudience.details.ageRange)] : []),
    ...(targetAudience.details.characteristics?.length
      ? [makeHeading3("人口特徵"), ...targetAudience.details.characteristics.map(c => makeBullet(c))]
      : []),
    ...(targetAudience.details.painPoints?.length
      ? [makeHeading3("核心痛點"), ...targetAudience.details.painPoints.map(p => makeBullet(p))]
      : []),
    ...(targetAudience.details.motivations?.length
      ? [makeHeading3("消費動機"), ...targetAudience.details.motivations.map(m => makeBullet(m))]
      : []),
    makePageBreak(),
  ];

  // ---- 市場空白 ----
  const marketSection: DocChild[] = [
    makeHeading1("3.  市場空白洞察"),
    makeHeading2(marketGap.title),
    makeBody(marketGap.content),
    ...(marketGap.details.gapDescription ? [makeLabel("空白描述", marketGap.details.gapDescription)] : []),
    ...(marketGap.details.competitorAnalysis?.length
      ? [makeHeading3("競品格局"), ...marketGap.details.competitorAnalysis.map(c => makeBullet(c))]
      : []),
    ...(marketGap.details.opportunity ? [makeLabel("品牌機會", marketGap.details.opportunity)] : []),
    makePageBreak(),
  ];

  // ---- 品牌優勢 ----
  const advantageSection: DocChild[] = [
    makeHeading1("4.  品牌核心優勢"),
    makeHeading2(brandAdvantage.title),
    makeBody(brandAdvantage.content),
    ...(brandAdvantage.details.coreStrengths?.length
      ? [makeHeading3("核心優勢"), ...brandAdvantage.details.coreStrengths.map(s => makeBullet(s))]
      : []),
    ...(brandAdvantage.details.differentiators?.length
      ? [makeHeading3("差異化因素"), ...brandAdvantage.details.differentiators.map(d => makeBullet(d))]
      : []),
    ...(brandAdvantage.details.brandAssets?.length
      ? [makeHeading3("品牌資產"), ...brandAdvantage.details.brandAssets.map(a => makeBullet(a))]
      : []),
    makePageBreak(),
  ];

  // ---- 品牌個性 ----
  const personalitySection: DocChild[] = [
    makeHeading1("5.  品牌個性輪廓"),
    makeHeading2(brandPersonality.title),
    makeBody(brandPersonality.content),
    makeInfoTable([
      ["品牌原型", brandPersonality.details.archetype || "—"],
      ["溝通語調", brandPersonality.details.tone || "—"],
      ["溝通態度", brandPersonality.details.attitude || "—"],
    ]),
    new Paragraph({ spacing: { after: 200 } }),
    ...(brandPersonality.details.traits?.length
      ? [makeHeading3("個性特質"), ...brandPersonality.details.traits.map(t => makeBullet(t))]
      : []),
    makePageBreak(),
  ];

  // ---- 定位策略 ----
  const positioningSection: DocChild[] = [
    makeHeading1("6.  定位策略方案"),
    makeHeading2("情緒價值導向策略"),
    makeBody(tagline.versionA.focus),
    makeInfoTable([
      ["策略焦點", tagline.versionA.focus],
      ["中文標語", tagline.versionA.chineseTagline],
      ["英文標語", tagline.versionA.englishTagline],
    ]),
    new Paragraph({ spacing: { after: 240 } }),
    makeHeading2("功能加值導向策略"),
    makeBody(tagline.versionB.focus),
    makeInfoTable([
      ["策略焦點", tagline.versionB.focus],
      ["中文標語", tagline.versionB.chineseTagline],
      ["英文標語", tagline.versionB.englishTagline],
    ]),
    makePageBreak(),
  ];

  // ---- 標語驗證 ----
  const buildValidationRows = (v: any) =>
    v
      ? [
          { label: "獨佔性", score: v.exclusivity ?? 0, max: 10 },
          { label: "記憶點", score: v.memorability ?? 0, max: 10 },
          { label: "態度感", score: v.attitude ?? 0, max: 10 },
          { label: "節奏感", score: v.rhythm ?? 0, max: 10 },
          { label: "情緒張力", score: v.emotionalTension ?? 0, max: 10 },
          { label: "對比結構", score: v.contrastStructure ?? 0, max: 10 },
        ]
      : [];

  const validationSection: DocChild[] = [
    makeHeading1("7.  標語推薦與驗證"),
    makeBody("以下驗證採用六維度評估框架，從獨佔性、記憶點、態度感、節奏感、情緒張力、對比結構六個維度對標語進行量化評分。"),
    makeHeading2("情緒價值標語驗證"),
    ...makeTaglineBox(
      tagline.versionA.chineseTagline,
      tagline.versionA.englishTagline,
      tagline.versionA.sixStepValidation?.totalScore
    ),
    ...(tagline.versionA.sixStepValidation
      ? [
          makeHeading3("六維度評分"),
          makeScoreTable(buildValidationRows(tagline.versionA.sixStepValidation)),
          new Paragraph({ spacing: { after: 200 } }),
        ]
      : []),
    makeHeading2("功能加值標語驗證"),
    ...makeTaglineBox(
      tagline.versionB.chineseTagline,
      tagline.versionB.englishTagline,
      tagline.versionB.sixStepValidation?.totalScore
    ),
    ...(tagline.versionB.sixStepValidation
      ? [
          makeHeading3("六維度評分"),
          makeScoreTable(buildValidationRows(tagline.versionB.sixStepValidation)),
          new Paragraph({ spacing: { after: 200 } }),
        ]
      : []),
  ];

  // ---- 頁眉頁腳 ----
  const headerText = clientName ? `${clientName}  ·  品牌定位策略書` : "品牌定位策略書";

  const pageHeader = new Header({
    children: [
      new Paragraph({
        children: [
          new TextRun({ text: headerText, size: 18, color: COLORS.lightGray, font: "Calibri" }),
          new TextRun({ text: "  |  ", size: 18, color: COLORS.borderGray }),
          new TextRun({ text: brandName, size: 18, bold: true, color: COLORS.primary, font: "Calibri" }),
        ],
        border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: COLORS.borderGray } },
        spacing: { after: 100 },
      }),
    ],
  });

  const pageFooter = new Footer({
    children: [
      new Paragraph({
        children: [
          new TextRun({ text: `${dateStr}  ·  Confidential`, size: 18, color: COLORS.lightGray, font: "Calibri" }),
          new TextRun({ text: "  ·  第 ", size: 18, color: COLORS.lightGray }),
          new PageNumberElement(),
          new TextRun({ text: " 頁", size: 18, color: COLORS.lightGray }),
        ],
        alignment: AlignmentType.CENTER,
        border: { top: { style: BorderStyle.SINGLE, size: 2, color: COLORS.borderGray } },
      }),
    ],
  });

  // ---- 組裝文件 ----
  const doc = new Document({
    creator: author,
    title: `${brandName} 品牌定位策略書`,
    description: plan.title,
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 22 },
        },
      },
    },
    sections: [
      {
        properties: {
          type: SectionType.CONTINUOUS,
        },
        headers: { default: pageHeader },
        footers: { default: pageFooter },
        children: [
          ...coverSection,
          ...tocSection,
          ...summarySection,
          ...audienceSection,
          ...marketSection,
          ...advantageSection,
          ...personalitySection,
          ...positioningSection,
          ...validationSection,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${brandName}_品牌定位策略書.docx`);
}

// ==================== PPTX 色彩與樣式常數 ====================

const PPT = {
  // 簡報尺寸（inch）
  W: 13.33,
  H: 7.5,

  // 色彩
  bg: "FFFFFF",
  primary: "1B2B4B",
  primaryLight: "2D4A7A",
  accent: "C9A84C",
  textDark: "2D3748",
  textMid: "4A5568",
  textLight: "718096",
  bgSlate: "F0F4F8",
  bgAccent: "EBF0F7",
  bgLight: "F7FAFC",
  divider: "CBD5E0",

  // 字型
  font: "Calibri",
};

// ==================== PPTX 輔助函數 ====================

function addSectionTag(slide: PptxGenJS.Slide, text: string): void {
  slide.addText(text, {
    x: 0.4,
    y: 0.3,
    w: 2.5,
    h: 0.28,
    fontSize: 8,
    bold: true,
    color: PPT.accent,
    fontFace: PPT.font,
    align: "left",
    charSpacing: 2,
  });
}

function addSlideTitle(slide: PptxGenJS.Slide, title: string, y = 0.65): void {
  slide.addText(title, {
    x: 0.4,
    y,
    w: PPT.W - 0.8,
    h: 0.7,
    fontSize: 28,
    bold: true,
    color: PPT.primary,
    fontFace: PPT.font,
    align: "left",
  });
  // 標題下方分隔線
  slide.addShape("rect", {
    x: 0.4,
    y: y + 0.72,
    w: 1.2,
    h: 0.04,
    fill: { color: PPT.accent },
    line: { color: PPT.accent },
  });
}

function addBullets(
  slide: PptxGenJS.Slide,
  items: string[],
  opts: { x?: number; y?: number; w?: number; fontSize?: number } = {}
): void {
  const { x = 0.4, y = 1.6, w = PPT.W - 0.8, fontSize = 13 } = opts;
  const textArr: PptxGenJS.TextProps[] = items.map(item => ({
    text: item,
    options: {
      bullet: { type: "bullet" },
      fontSize,
      color: PPT.textDark,
      fontFace: PPT.font,
      paraSpaceAfter: 6,
    },
  }));
  slide.addText(textArr, {
    x,
    y,
    w,
    h: Math.min(items.length * 0.5 + 0.2, 5.5),
    valign: "top",
  });
}

function addBottomBar(slide: PptxGenJS.Slide, brandName: string, dateStr: string): void {
  slide.addShape("rect", {
    x: 0,
    y: PPT.H - 0.35,
    w: PPT.W,
    h: 0.35,
    fill: { color: PPT.primary },
  });
  slide.addText(`${brandName}  ·  品牌定位策略書`, {
    x: 0.3,
    y: PPT.H - 0.3,
    w: 7,
    h: 0.25,
    fontSize: 8,
    color: "AABBCC",
    fontFace: PPT.font,
    align: "left",
  });
  slide.addText(`Confidential  ·  ${dateStr}`, {
    x: PPT.W - 4,
    y: PPT.H - 0.3,
    w: 3.7,
    h: 0.25,
    fontSize: 8,
    color: "AABBCC",
    fontFace: PPT.font,
    align: "right",
  });
}

/**
 * 生成專業定位書 PowerPoint 簡報
 * 16-18 張投影片，符合顧問公司提案水準
 */
export async function generatePositioningBookPPT(options: PositioningBookExportOptions): Promise<void> {
  const { brandName, plan, reportDate = new Date(), author = "品牌定位分析師" } = options;
  const { reasoning, emotionalValueSlogan, functionalValueSlogan } = plan;
  const dateStr = reportDate.toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric" });
  const { targetAudience, marketGap, brandAdvantage, brandPersonality, tagline } = reasoning;

  const pptx = new PptxGenJS();
  pptx.author = author;
  pptx.title = `${brandName} 品牌定位策略書`;
  pptx.layout = "LAYOUT_WIDE";
  pptx.subject = plan.title;

  // 定義母版主題
  pptx.defineSlideMaster({
    title: "MASTER_SLIDE",
    background: { color: PPT.bg },
  });

  // ==================== 第 1 張：封面 ====================
  const cover = pptx.addSlide();
  // 左側深藍色塊
  cover.addShape("rect", {
    x: 0,
    y: 0,
    w: 5.2,
    h: PPT.H,
    fill: { color: PPT.primary },
  });
  // 金色細條
  cover.addShape("rect", {
    x: 5.2,
    y: 0,
    w: 0.08,
    h: PPT.H,
    fill: { color: PPT.accent },
  });
  // 右側白底
  cover.addShape("rect", {
    x: 5.28,
    y: 0,
    w: PPT.W - 5.28,
    h: PPT.H,
    fill: { color: PPT.bg },
  });
  cover.addText("品牌定位", { x: 0.5, y: 1.5, w: 4.5, h: 0.8, fontSize: 14, color: PPT.accent, fontFace: PPT.font, bold: true, charSpacing: 4 });
  cover.addText("策略書", { x: 0.5, y: 2.0, w: 4.5, h: 0.8, fontSize: 44, color: PPT.bg, fontFace: PPT.font, bold: true });
  cover.addText("BRAND POSITIONING\nSTRATEGY REPORT", { x: 0.5, y: 3.0, w: 4.5, h: 1.0, fontSize: 11, color: "8899AA", fontFace: PPT.font, align: "left" });
  cover.addText(brandName, { x: 5.5, y: 1.8, w: 7.5, h: 1.2, fontSize: 36, bold: true, color: PPT.primary, fontFace: PPT.font });
  cover.addText(plan.title, { x: 5.5, y: 2.9, w: 7.5, h: 0.7, fontSize: 16, color: PPT.textMid, fontFace: PPT.font, italic: true });
  cover.addShape("rect", { x: 5.5, y: 3.7, w: 6.5, h: 0.04, fill: { color: PPT.divider } });
  cover.addText(dateStr, { x: 5.5, y: 3.85, w: 4, h: 0.35, fontSize: 12, color: PPT.textLight, fontFace: PPT.font });
  cover.addText(author, { x: 5.5, y: 4.2, w: 4, h: 0.35, fontSize: 12, color: PPT.textLight, fontFace: PPT.font });

  // ==================== 第 2 張：議程 ====================
  const agenda = pptx.addSlide();
  agenda.background = { color: PPT.bg };
  addBottomBar(agenda, brandName, dateStr);
  addSectionTag(agenda, "AGENDA");
  addSlideTitle(agenda, "本次報告議程");

  const agendaItems = [
    ["01", "執行摘要 —— 核心定位一覽"],
    ["02", "目標受眾分析 —— Who We Speak To"],
    ["03", "市場空白洞察 —— Where The Gap Lies"],
    ["04", "品牌核心優勢 —— What Makes Us Different"],
    ["05", "品牌個性輪廓 —— How We Communicate"],
    ["06", "定位策略方案 —— The Positioning Strategy"],
    ["07", "標語推薦與驗證 —— Tagline Validation"],
  ];

  agendaItems.forEach(([num, title], i) => {
    const y = 1.6 + i * 0.68;
    agenda.addShape("rect", { x: 0.4, y, w: 0.45, h: 0.45, fill: { color: i % 2 === 0 ? PPT.primary : PPT.primaryLight } });
    agenda.addText(num, { x: 0.4, y, w: 0.45, h: 0.45, fontSize: 11, bold: true, color: PPT.bg, fontFace: PPT.font, align: "center", valign: "middle" });
    agenda.addText(title, { x: 1.05, y: y + 0.04, w: 11.5, h: 0.4, fontSize: 14, color: PPT.textDark, fontFace: PPT.font, align: "left" });
  });

  // ==================== 第 3 張：執行摘要 ====================
  const exec = pptx.addSlide();
  exec.background = { color: PPT.bgSlate };
  addBottomBar(exec, brandName, dateStr);
  addSectionTag(exec, "01  EXECUTIVE SUMMARY");
  addSlideTitle(exec, "執行摘要");

  // 左側情緒標語卡片
  exec.addShape("rect", { x: 0.4, y: 1.6, w: 5.9, h: 2.4, fill: { color: PPT.primary }, line: { color: PPT.primary } });
  exec.addShape("rect", { x: 0.4, y: 1.6, w: 0.1, h: 2.4, fill: { color: PPT.accent } });
  exec.addText("情緒價值標語", { x: 0.7, y: 1.7, w: 5.4, h: 0.35, fontSize: 9, color: PPT.accent, fontFace: PPT.font, bold: true, charSpacing: 2 });
  exec.addText(emotionalValueSlogan.chinese, { x: 0.7, y: 2.05, w: 5.4, h: 1.1, fontSize: 24, bold: true, color: PPT.bg, fontFace: PPT.font, align: "left", wrap: true });
  exec.addText(emotionalValueSlogan.english, { x: 0.7, y: 3.15, w: 5.4, h: 0.5, fontSize: 10, color: "AABBCC", fontFace: PPT.font, italic: true });
  if (emotionalValueSlogan.validation?.totalScore) {
    exec.addText(`驗證分數 ${emotionalValueSlogan.validation.totalScore}/100`, { x: 0.7, y: 3.7, w: 5.4, h: 0.25, fontSize: 9, color: PPT.accent, fontFace: PPT.font });
  }

  // 右側功能標語卡片
  exec.addShape("rect", { x: 6.8, y: 1.6, w: 6.1, h: 2.4, fill: { color: PPT.bgAccent }, line: { color: PPT.divider } });
  exec.addShape("rect", { x: 6.8, y: 1.6, w: 0.1, h: 2.4, fill: { color: PPT.primaryLight } });
  exec.addText("功能加值標語", { x: 7.1, y: 1.7, w: 5.6, h: 0.35, fontSize: 9, color: PPT.primaryLight, fontFace: PPT.font, bold: true, charSpacing: 2 });
  exec.addText(functionalValueSlogan.chinese, { x: 7.1, y: 2.05, w: 5.6, h: 1.1, fontSize: 24, bold: true, color: PPT.primary, fontFace: PPT.font, align: "left", wrap: true });
  exec.addText(functionalValueSlogan.english, { x: 7.1, y: 3.15, w: 5.6, h: 0.5, fontSize: 10, color: PPT.textLight, fontFace: PPT.font, italic: true });
  if (functionalValueSlogan.validation?.totalScore) {
    exec.addText(`驗證分數 ${functionalValueSlogan.validation.totalScore}/100`, { x: 7.1, y: 3.7, w: 5.6, h: 0.25, fontSize: 9, color: PPT.primaryLight, fontFace: PPT.font });
  }

  // 底部摘要文字
  exec.addText(targetAudience.summary, {
    x: 0.4, y: 4.3, w: PPT.W - 0.8, h: 0.8,
    fontSize: 11, color: PPT.textMid, fontFace: PPT.font, align: "center", wrap: true,
  });

  // ==================== 第 4 張：目標受眾 ====================
  const audSlide = pptx.addSlide();
  audSlide.background = { color: PPT.bg };
  addBottomBar(audSlide, brandName, dateStr);
  addSectionTag(audSlide, "02  TARGET AUDIENCE");
  addSlideTitle(audSlide, "目標受眾分析");
  audSlide.addText(targetAudience.content, {
    x: 0.4, y: 1.55, w: PPT.W - 0.8, h: 1.1,
    fontSize: 12, color: PPT.textDark, fontFace: PPT.font, wrap: true,
  });

  const audDetails = [
    ...(targetAudience.details.ageRange ? [`年齡層：${targetAudience.details.ageRange}`] : []),
    ...(targetAudience.details.characteristics || []).map(c => `特徵：${c}`),
    ...(targetAudience.details.painPoints || []).map(p => `痛點：${p}`),
    ...(targetAudience.details.motivations || []).map(m => `動機：${m}`),
  ];
  if (audDetails.length > 0) {
    addBullets(audSlide, audDetails, { y: 2.85 });
  }

  // ==================== 第 5 張：市場空白 ====================
  const mktSlide = pptx.addSlide();
  mktSlide.background = { color: PPT.bgSlate };
  addBottomBar(mktSlide, brandName, dateStr);
  addSectionTag(mktSlide, "03  MARKET GAP");
  addSlideTitle(mktSlide, "市場空白洞察");

  // 3 個 insight 卡片
  const insights = [
    { label: "市場缺口", text: marketGap.details.gapDescription || marketGap.summary },
    { label: "品牌機會", text: marketGap.details.opportunity || marketGap.content },
    { label: "競品格局", text: (marketGap.details.competitorAnalysis || []).slice(0, 2).join(" / ") || marketGap.summary },
  ];
  const cardW = (PPT.W - 0.8 - 0.3) / 3;
  insights.forEach(({ label, text }, i) => {
    const x = 0.4 + i * (cardW + 0.15);
    mktSlide.addShape("rect", { x, y: 1.6, w: cardW, h: 3.8, fill: { color: PPT.bg }, line: { color: PPT.divider, width: 1 } });
    mktSlide.addShape("rect", { x, y: 1.6, w: cardW, h: 0.06, fill: { color: i === 0 ? PPT.accent : i === 1 ? PPT.primary : PPT.primaryLight } });
    mktSlide.addText(label, { x: x + 0.15, y: 1.75, w: cardW - 0.3, h: 0.35, fontSize: 10, bold: true, color: PPT.primary, fontFace: PPT.font });
    mktSlide.addText(text, { x: x + 0.15, y: 2.15, w: cardW - 0.3, h: 3.0, fontSize: 11, color: PPT.textDark, fontFace: PPT.font, wrap: true, valign: "top" });
  });

  // ==================== 第 6 張：品牌優勢 ====================
  const advSlide = pptx.addSlide();
  advSlide.background = { color: PPT.bg };
  addBottomBar(advSlide, brandName, dateStr);
  addSectionTag(advSlide, "04  BRAND ADVANTAGE");
  addSlideTitle(advSlide, "品牌核心優勢");
  advSlide.addText(brandAdvantage.content, {
    x: 0.4, y: 1.55, w: PPT.W - 0.8, h: 0.9, fontSize: 12, color: PPT.textDark, fontFace: PPT.font, wrap: true,
  });

  // 三欄優勢
  const threeCol = [
    { title: "核心優勢", items: brandAdvantage.details.coreStrengths || [] },
    { title: "差異化因素", items: brandAdvantage.details.differentiators || [] },
    { title: "品牌資產", items: brandAdvantage.details.brandAssets || [] },
  ].filter(c => c.items.length > 0);

  const cW = threeCol.length > 0 ? (PPT.W - 0.8) / threeCol.length : PPT.W - 0.8;
  threeCol.forEach(({ title, items }, i) => {
    const x = 0.4 + i * cW;
    advSlide.addShape("rect", { x, y: 2.65, w: cW - 0.1, h: 0.38, fill: { color: PPT.primary } });
    advSlide.addText(title, { x: x + 0.1, y: 2.65, w: cW - 0.2, h: 0.38, fontSize: 11, bold: true, color: PPT.bg, fontFace: PPT.font, valign: "middle" });
    items.slice(0, 5).forEach((item, j) => {
      advSlide.addShape("rect", { x, y: 3.05 + j * 0.65, w: cW - 0.1, h: 0.58, fill: { color: j % 2 === 0 ? PPT.bgLight : PPT.bg }, line: { color: PPT.divider, width: 0.5 } });
      advSlide.addText(`• ${item}`, { x: x + 0.1, y: 3.08 + j * 0.65, w: cW - 0.25, h: 0.52, fontSize: 10, color: PPT.textDark, fontFace: PPT.font, wrap: true, valign: "middle" });
    });
  });

  // ==================== 第 7 張：品牌個性 ====================
  const perSlide = pptx.addSlide();
  perSlide.background = { color: PPT.bgSlate };
  addBottomBar(perSlide, brandName, dateStr);
  addSectionTag(perSlide, "05  BRAND PERSONALITY");
  addSlideTitle(perSlide, "品牌個性輪廓");

  // 左側文字
  perSlide.addText(brandPersonality.content, {
    x: 0.4, y: 1.6, w: 7.0, h: 1.4, fontSize: 12, color: PPT.textDark, fontFace: PPT.font, wrap: true,
  });

  // 右側個性指標卡片
  const perCards = [
    { label: "品牌原型", value: brandPersonality.details.archetype || "—" },
    { label: "溝通語調", value: brandPersonality.details.tone || "—" },
    { label: "溝通態度", value: brandPersonality.details.attitude || "—" },
  ];
  perCards.forEach(({ label, value }, i) => {
    perSlide.addShape("rect", { x: 8.0, y: 1.6 + i * 1.0, w: 5.0, h: 0.85, fill: { color: PPT.bg }, line: { color: PPT.divider } });
    perSlide.addText(label, { x: 8.15, y: 1.65 + i * 1.0, w: 1.8, h: 0.35, fontSize: 9, color: PPT.textLight, fontFace: PPT.font });
    perSlide.addText(value, { x: 8.15, y: 2.0 + i * 1.0, w: 4.7, h: 0.4, fontSize: 14, bold: true, color: PPT.primary, fontFace: PPT.font, wrap: true });
  });

  // 個性特質標籤雲
  if (brandPersonality.details.traits?.length) {
    perSlide.addText("個性特質", { x: 0.4, y: 3.2, w: 7.0, h: 0.35, fontSize: 10, bold: true, color: PPT.primary, fontFace: PPT.font });
    brandPersonality.details.traits.slice(0, 6).forEach((trait, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const tagW = 2.1;
      perSlide.addShape("rect", {
        x: 0.4 + col * (tagW + 0.15), y: 3.65 + row * 0.55, w: tagW, h: 0.42,
        fill: { color: i % 2 === 0 ? PPT.primary : PPT.primaryLight },
      });
      perSlide.addText(trait, {
        x: 0.4 + col * (tagW + 0.15), y: 3.65 + row * 0.55, w: tagW, h: 0.42,
        fontSize: 11, bold: true, color: PPT.bg, fontFace: PPT.font, align: "center", valign: "middle",
      });
    });
  }

  // ==================== 第 8 張：定位策略 - 情緒 ====================
  const posA = pptx.addSlide();
  posA.background = { color: PPT.bg };
  addBottomBar(posA, brandName, dateStr);
  addSectionTag(posA, "06  POSITIONING STRATEGY  ·  情緒價值導向");
  addSlideTitle(posA, "定位策略方案 A —— 情緒價值導向");

  // 大標語
  posA.addShape("rect", { x: 0.4, y: 1.55, w: PPT.W - 0.8, h: 1.6, fill: { color: PPT.primary } });
  posA.addShape("rect", { x: 0.4, y: 1.55, w: 0.1, h: 1.6, fill: { color: PPT.accent } });
  posA.addText(tagline.versionA.chineseTagline, {
    x: 0.7, y: 1.65, w: PPT.W - 1.1, h: 0.9,
    fontSize: 30, bold: true, color: PPT.bg, fontFace: PPT.font,
  });
  posA.addText(tagline.versionA.englishTagline, {
    x: 0.7, y: 2.55, w: PPT.W - 1.1, h: 0.5,
    fontSize: 13, color: "AABBCC", fontFace: PPT.font, italic: true,
  });

  posA.addText("策略焦點", { x: 0.4, y: 3.35, w: 2, h: 0.35, fontSize: 10, bold: true, color: PPT.primary, fontFace: PPT.font });
  posA.addText(tagline.versionA.focus, {
    x: 0.4, y: 3.7, w: PPT.W - 0.8, h: 2.8,
    fontSize: 12, color: PPT.textDark, fontFace: PPT.font, wrap: true, valign: "top",
  });

  // ==================== 第 9 張：定位策略 - 功能 ====================
  const posB = pptx.addSlide();
  posB.background = { color: PPT.bgSlate };
  addBottomBar(posB, brandName, dateStr);
  addSectionTag(posB, "06  POSITIONING STRATEGY  ·  功能加值導向");
  addSlideTitle(posB, "定位策略方案 B —— 功能加值導向");

  posB.addShape("rect", { x: 0.4, y: 1.55, w: PPT.W - 0.8, h: 1.6, fill: { color: PPT.bgAccent }, line: { color: PPT.divider } });
  posB.addShape("rect", { x: 0.4, y: 1.55, w: 0.1, h: 1.6, fill: { color: PPT.primaryLight } });
  posB.addText(tagline.versionB.chineseTagline, {
    x: 0.7, y: 1.65, w: PPT.W - 1.1, h: 0.9,
    fontSize: 30, bold: true, color: PPT.primary, fontFace: PPT.font,
  });
  posB.addText(tagline.versionB.englishTagline, {
    x: 0.7, y: 2.55, w: PPT.W - 1.1, h: 0.5,
    fontSize: 13, color: PPT.textLight, fontFace: PPT.font, italic: true,
  });

  posB.addText("策略焦點", { x: 0.4, y: 3.35, w: 2, h: 0.35, fontSize: 10, bold: true, color: PPT.primary, fontFace: PPT.font });
  posB.addText(tagline.versionB.focus, {
    x: 0.4, y: 3.7, w: PPT.W - 0.8, h: 2.8,
    fontSize: 12, color: PPT.textDark, fontFace: PPT.font, wrap: true, valign: "top",
  });

  // ==================== 第 10 張：標語驗證 ====================
  const valSlide = pptx.addSlide();
  valSlide.background = { color: PPT.bg };
  addBottomBar(valSlide, brandName, dateStr);
  addSectionTag(valSlide, "07  TAGLINE VALIDATION");
  addSlideTitle(valSlide, "標語六維度驗證");

  const validationDimensions = [
    { key: "exclusivity", label: "獨佔性" },
    { key: "memorability", label: "記憶點" },
    { key: "attitude", label: "態度感" },
    { key: "rhythm", label: "節奏感" },
    { key: "emotionalTension", label: "情緒張力" },
    { key: "contrastStructure", label: "對比結構" },
  ];

  // 說明文字
  valSlide.addText("六維度評分框架（每維度滿分 10 分，總計 100 分）", {
    x: 0.4, y: 1.55, w: PPT.W - 0.8, h: 0.35,
    fontSize: 10, color: PPT.textLight, fontFace: PPT.font,
  });

  // 表頭
  const colXBase = 0.4;
  const colWLabel = 2.2;
  const colWBar = 4.0;
  const colWScoreA = 1.5;
  const colWScoreB = 1.5;

  ["維度", "評分視覺化", "方案A分數", "方案B分數"].forEach((h, i) => {
    const colXArr = [colXBase, colXBase + colWLabel + 0.1, colXBase + colWLabel + colWBar + 0.2, colXBase + colWLabel + colWBar + colWScoreA + 0.3];
    valSlide.addShape("rect", { x: colXArr[i], y: 1.95, w: [colWLabel, colWBar, colWScoreA, colWScoreB][i], h: 0.35, fill: { color: PPT.primary } });
    valSlide.addText(h, { x: colXArr[i] + 0.05, y: 1.95, w: [colWLabel, colWBar, colWScoreA, colWScoreB][i] - 0.1, h: 0.35, fontSize: 9, bold: true, color: PPT.bg, fontFace: PPT.font, valign: "middle" });
  });

  validationDimensions.forEach(({ key, label }, i) => {
    const rowY = 2.35 + i * 0.62;
    const bg = i % 2 === 0 ? PPT.bgLight : PPT.bg;
    const scoreA = (tagline.versionA.sixStepValidation as any)?.[key] ?? 0;
    const scoreB = (tagline.versionB.sixStepValidation as any)?.[key] ?? 0;

    // 標籤
    valSlide.addShape("rect", { x: colXBase, y: rowY, w: colWLabel, h: 0.55, fill: { color: bg } });
    valSlide.addText(label, { x: colXBase + 0.1, y: rowY + 0.07, w: colWLabel - 0.2, h: 0.42, fontSize: 11, color: PPT.textDark, fontFace: PPT.font, valign: "middle" });

    // 視覺化長條（方案A）
    const barX = colXBase + colWLabel + 0.1;
    valSlide.addShape("rect", { x: barX, y: rowY, w: colWBar, h: 0.55, fill: { color: bg } });
    if (scoreA > 0) {
      valSlide.addShape("rect", { x: barX + 0.05, y: rowY + 0.15, w: (scoreA / 10) * (colWBar / 2 - 0.1), h: 0.26, fill: { color: PPT.primary } });
    }
    if (scoreB > 0) {
      valSlide.addShape("rect", { x: barX + 0.05 + colWBar / 2, y: rowY + 0.15, w: (scoreB / 10) * (colWBar / 2 - 0.1), h: 0.26, fill: { color: PPT.primaryLight } });
    }

    // 分數A
    const scoreAX = colXBase + colWLabel + colWBar + 0.2;
    valSlide.addShape("rect", { x: scoreAX, y: rowY, w: colWScoreA, h: 0.55, fill: { color: bg } });
    valSlide.addText(`${scoreA}/10`, { x: scoreAX, y: rowY, w: colWScoreA, h: 0.55, fontSize: 12, bold: true, color: scoreA >= 7 ? "2F855A" : PPT.textDark, fontFace: PPT.font, align: "center", valign: "middle" });

    // 分數B
    const scoreBX = scoreAX + colWScoreA + 0.1;
    valSlide.addShape("rect", { x: scoreBX, y: rowY, w: colWScoreB, h: 0.55, fill: { color: bg } });
    valSlide.addText(`${scoreB}/10`, { x: scoreBX, y: rowY, w: colWScoreB, h: 0.55, fontSize: 12, bold: true, color: scoreB >= 7 ? "2F855A" : PPT.textDark, fontFace: PPT.font, align: "center", valign: "middle" });
  });

  // 總分彙整
  const totalA = tagline.versionA.sixStepValidation?.totalScore ?? "—";
  const totalB = tagline.versionB.sixStepValidation?.totalScore ?? "—";
  valSlide.addShape("rect", { x: 0.4, y: 7.05, w: PPT.W - 0.8, h: 0.05, fill: { color: PPT.accent } });

  // ==================== 第 11 張：結論 ====================
  const concl = pptx.addSlide();
  concl.background = { color: PPT.primary };
  addSectionTag(concl, "CONCLUSION");
  concl.addText("建議採用定位方案", {
    x: 1.5, y: 1.5, w: 10, h: 0.6,
    fontSize: 16, color: PPT.accent, fontFace: PPT.font, bold: true, charSpacing: 2,
  });
  concl.addText(
    `${brandName}\n${plan.title}`,
    { x: 1.5, y: 2.1, w: 10, h: 2.0, fontSize: 36, bold: true, color: PPT.bg, fontFace: PPT.font, align: "left" }
  );
  concl.addShape("rect", { x: 1.5, y: 4.3, w: 8, h: 0.04, fill: { color: PPT.accent } });

  // 兩個標語摘要
  concl.addText(emotionalValueSlogan.chinese, {
    x: 1.5, y: 4.5, w: 5.5, h: 0.65,
    fontSize: 18, bold: true, color: PPT.bg, fontFace: PPT.font,
  });
  concl.addText(`分數：${totalA}/100`, {
    x: 1.5, y: 5.15, w: 5.5, h: 0.35,
    fontSize: 10, color: "8899AA", fontFace: PPT.font,
  });
  concl.addText(functionalValueSlogan.chinese, {
    x: 7.3, y: 4.5, w: 5.5, h: 0.65,
    fontSize: 18, bold: true, color: "CCDDEE", fontFace: PPT.font,
  });
  concl.addText(`分數：${totalB}/100`, {
    x: 7.3, y: 5.15, w: 5.5, h: 0.35,
    fontSize: 10, color: "8899AA", fontFace: PPT.font,
  });

  concl.addShape("rect", { x: 0, y: PPT.H - 0.35, w: PPT.W, h: 0.35, fill: { color: "0D1A2E" } });
  concl.addText("Confidential  ·  " + dateStr, {
    x: 0, y: PPT.H - 0.3, w: PPT.W, h: 0.25,
    fontSize: 8, color: "556677", fontFace: PPT.font, align: "center",
  });

  // ==================== 匯出 ====================
  await pptx.writeFile({ fileName: `${brandName}_品牌定位策略書.pptx` });
}

/**
 * 從完整的 BrandReasoningFlowResponse 匯出定位書
 * 會針對每個 positioningPlan 生成獨立文件，或合併成一份
 */
export async function exportPositioningBook(
  data: BrandReasoningFlowResponse,
  format: "docx" | "pptx" | "both",
  planIndex = 0,
  clientName?: string
): Promise<void> {
  const plan = data.positioningPlans?.[planIndex];
  if (!plan) {
    throw new Error("定位方案資料不存在");
  }

  const opts: PositioningBookExportOptions = {
    brandName: data.brand.name,
    plan,
    planIndex,
    reportDate: new Date(),
    author: "品牌定位分析師",
    clientName,
  };

  if (format === "docx" || format === "both") {
    await generatePositioningBookDOC(opts);
  }
  if (format === "pptx" || format === "both") {
    await generatePositioningBookPPT(opts);
  }
}
