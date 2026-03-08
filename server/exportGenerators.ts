/**
 * 文件導出生成器
 * 生成真實可下載的 PPTX 和 DOCX 文件（顧問風格）
 */
import pptxgen from "pptxgenjs";
import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Packer,
} from "docx";

// ── 顏色常數（pptxgenjs 不帶 #）─────────────────────────────────
const NAVY = "1B2B4B";
const GOLD = "C9A84C";
const WHITE = "FFFFFF";
const DARK = "1C1C1C";
const GRAY = "888888";

// ── Markdown 解析：轉成投影片資料 ────────────────────────────────
interface SlideData {
  title: string;
  bullets: string[];
  isCover?: boolean;
}

function parseMdToSlides(
  title: string,
  content: string,
  companyName: string
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

  return slides.slice(0, 12);
}

// ── PPTX 生成（BCG/McKinsey 顧問風格）──────────────────────────
export async function generatePPTX(
  title: string,
  content: string,
  companyName: string
): Promise<Buffer> {
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_WIDE"; // 13.33" × 7.5"

  const slides = parseMdToSlides(title, content, companyName);

  for (const data of slides) {
    const slide = pptx.addSlide();

    if (data.isCover) {
      // ── 封面 ──────────────────────────────────────────────
      slide.background = { color: NAVY };

      // 左側金色裝飾條
      slide.addShape("rect" as any, {
        x: 0,
        y: 0,
        w: 0.12,
        h: "100%",
        fill: { color: GOLD },
        line: { color: GOLD, width: 0 },
      });

      // 底部金色細線
      slide.addShape("rect" as any, {
        x: 0,
        y: 6.92,
        w: "100%",
        h: 0.08,
        fill: { color: GOLD },
        line: { color: GOLD, width: 0 },
      });

      // 主標題
      slide.addText(data.title, {
        x: 0.55,
        y: 1.8,
        w: 12,
        h: 2.2,
        fontSize: 36,
        bold: true,
        color: WHITE,
        align: "left",
        fontFace: "Arial",
        valign: "middle",
        wrap: true,
      });

      // 公司名稱 + 日期
      slide.addText(`${data.bullets[0]}  ·  ${data.bullets[1]}`, {
        x: 0.55,
        y: 4.3,
        w: 12,
        h: 0.5,
        fontSize: 14,
        color: GOLD,
        align: "left",
        fontFace: "Arial",
      });

      // Confidential 標記
      slide.addText("CONFIDENTIAL", {
        x: 0.55,
        y: 7.15,
        w: 5,
        h: 0.25,
        fontSize: 8,
        color: GRAY,
        align: "left",
        fontFace: "Arial",
      });
    } else {
      // ── 內容頁 ────────────────────────────────────────────
      slide.background = { color: WHITE };

      // 頂部 navy 橫條
      slide.addShape("rect" as any, {
        x: 0,
        y: 0,
        w: "100%",
        h: 0.85,
        fill: { color: NAVY },
        line: { color: NAVY, width: 0 },
      });

      // 右側金色矩形裝飾
      slide.addShape("rect" as any, {
        x: 12.53,
        y: 0,
        w: 0.8,
        h: 0.85,
        fill: { color: GOLD },
        line: { color: GOLD, width: 0 },
      });

      // 頁面標題
      slide.addText(data.title, {
        x: 0.4,
        y: 0,
        w: 11.8,
        h: 0.85,
        fontSize: 20,
        bold: true,
        color: WHITE,
        align: "left",
        fontFace: "Arial",
        valign: "middle",
      });

      // 金色分隔短線
      slide.addShape("rect" as any, {
        x: 0.4,
        y: 0.9,
        w: 1.8,
        h: 0.04,
        fill: { color: GOLD },
        line: { color: GOLD, width: 0 },
      });

      // 要點內容
      if (data.bullets.length > 0) {
        const bulletText = data.bullets.map((b) => `• ${b}`).join("\n");
        slide.addText(bulletText, {
          x: 0.5,
          y: 1.1,
          w: 12,
          h: 5.9,
          fontSize: 15,
          color: DARK,
          align: "left",
          valign: "top",
          fontFace: "Arial",
          lineSpacingMultiple: 1.6,
          wrap: true,
        });
      }

      // 頁尾
      slide.addText(`${companyName}  |  Confidential`, {
        x: 0.4,
        y: 7.2,
        w: 10,
        h: 0.25,
        fontSize: 8,
        color: GRAY,
        align: "left",
        fontFace: "Arial",
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
