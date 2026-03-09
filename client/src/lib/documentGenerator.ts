/**
 * 文件生成器 — 真正生成各種格式的檔案
 * 支援：PDF, XLS, PPT, DOC, Markdown, CSV, CODE
 */
import jsPDF from "jspdf";
import "jspdf-autotable";
import ExcelJS from "exceljs";
import PptxGenJS from "pptxgenjs";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { saveAs } from "file-saver";
import JSZip from "jszip";

// 擴展 jsPDF 類型
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface GenerateOptions {
  title: string;
  content: string;
  author?: string;
  date?: Date;
  tableData?: { headers: string[]; rows: string[][] };
  slides?: { title: string; content: string[] }[];
  codeLanguage?: string;
}

/**
 * 生成 PDF 文件
 */
export async function generatePDF(options: GenerateOptions): Promise<void> {
  const doc = new jsPDF();
  const { title, content, author, date, tableData } = options;
  
  // 標題
  doc.setFontSize(20);
  doc.text(title, 20, 20);
  
  // 元資料
  doc.setFontSize(10);
  doc.setTextColor(128);
  const metaY = 30;
  if (author) doc.text(`作者: ${author}`, 20, metaY);
  if (date) doc.text(`日期: ${date.toLocaleDateString()}`, 20, metaY + 5);
  
  // 內容
  doc.setFontSize(12);
  doc.setTextColor(0);
  const lines = doc.splitTextToSize(content, 170);
  doc.text(lines, 20, 45);
  
  // 如果有表格數據
  if (tableData) {
    doc.autoTable({
      head: [tableData.headers],
      body: tableData.rows,
      startY: 80,
      theme: "grid",
      headStyles: { fillColor: [30, 30, 30] },
    });
  }
  
  // 下載
  doc.save(`${title}.pdf`);
}

/**
 * 生成 Excel 試算表
 */
export async function generateXLS(options: GenerateOptions): Promise<void> {
  const { title, tableData } = options;
  
  if (!tableData) {
    throw new Error("Excel 需要表格數據");
  }
  
  const workbook = new ExcelJS.Workbook();
  workbook.creator = options.author || "AI旗艦隊";
  workbook.created = options.date || new Date();
  
  const worksheet = workbook.addWorksheet(title);
  
  // 添加標題行
  worksheet.addRow(tableData.headers);
  
  // 設定標題樣式
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E1E1E" },
  };
  
  // 添加數據行
  tableData.rows.forEach(row => {
    worksheet.addRow(row);
  });
  
  // 自動調整列寬
  worksheet.columns.forEach(column => {
    column.width = 15;
  });
  
  // 下載
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  saveAs(blob, `${title}.xlsx`);
}

/**
 * Hillhouse Capital — PE 級財務 Excel（3 sheets: Portfolio Summary / Vintage Year / Cash Flow Waterfall）
 */
export async function generateHillhousePEXls(): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Hillhouse Capital";
  workbook.created = new Date();

  const NAVY = "FF1B2B4B";
  const NAVY2 = "FF2D4270";
  const WHITE = "FFFFFFFF";
  const ALT = "FFF5F7FA";
  const LGRAY = "FFEEEFF2";

  const hFont = (sz = 10): Partial<ExcelJS.Font> => ({
    name: "Calibri", size: sz, bold: true, color: { argb: WHITE },
  });
  const bFont: Partial<ExcelJS.Font> = { name: "Calibri", size: 10, color: { argb: "FF1C1C1C" } };
  const bBold: Partial<ExcelJS.Font> = { name: "Calibri", size: 10, bold: true, color: { argb: "FF1C1C1C" } };
  const navyFill = (argb = NAVY): ExcelJS.Fill => ({ type: "pattern", pattern: "solid", fgColor: { argb } });
  const altFill: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: ALT } };
  const lgFill: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: LGRAY } };
  const bdr: Partial<ExcelJS.Borders> = {
    top:    { style: "thin", color: { argb: "FFE5E7EB" } },
    bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
    left:   { style: "thin", color: { argb: "FFE5E7EB" } },
    right:  { style: "thin", color: { argb: "FFE5E7EB" } },
  };

  // ── Sheet 1: Portfolio Summary ──────────────────────────────────
  const ws1 = workbook.addWorksheet("Portfolio Summary");

  ws1.mergeCells("A1:L1");
  const t1 = ws1.getCell("A1");
  t1.value = "Hillhouse Capital — Portfolio Summary  |  As of Q4 2024";
  t1.font = hFont(13);
  t1.fill = navyFill();
  t1.alignment = { horizontal: "center", vertical: "middle" };
  ws1.getRow(1).height = 34;

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
    cell.fill = navyFill(NAVY2);
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = bdr;
  });

  const port: (string | number)[][] = [
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
      cell.alignment = { horizontal: col <= 3 ? "left" : "right", vertical: "middle" };
      if (col >= 4 && col <= 8 && typeof cell.value === "number") cell.numFmt = "#,##0.0";
      if (col === 9 && typeof cell.value === "number") cell.numFmt = '0.0"%"';
      if (col >= 10 && typeof cell.value === "number") cell.numFmt = '0.00"x"';
    });
  });

  const totRow = ws1.addRow(["Portfolio Total / Weighted Avg", "", "", 1080, 1080, 1120, 895, 2015, 22.4, 1.87, 1.04, 1.87]);
  totRow.height = 26;
  totRow.eachCell({ includeEmpty: true }, (cell, col) => {
    cell.font = { ...hFont(), color: { argb: WHITE } };
    cell.fill = navyFill();
    cell.border = bdr;
    cell.alignment = { horizontal: col <= 3 ? "left" : "right", vertical: "middle" };
    if (col >= 4 && col <= 8 && typeof cell.value === "number") cell.numFmt = "#,##0.0";
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
    cell.fill = navyFill(NAVY2);
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = bdr;
  });

  const vintage: (string | number)[][] = [
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
        if (col === 3) cell.numFmt = "#,##0.0";
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
    cell.fill = navyFill(NAVY2);
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = bdr;
  });

  const cf: (string | number)[][] = [
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
        if (typeof cell.value === "number") cell.numFmt = "#,##0.0;[Red](#,##0.0)";
      } else {
        cell.font = { ...bFont, color: { argb: "FF555555" } };
        cell.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
      }
    });
  });

  ws3.addRow([]);
  const mlTitle = ws3.addRow(["DPI Milestones", "", "", "", "", ""]);
  mlTitle.getCell(1).font = { name: "Calibri", size: 11, bold: true, color: { argb: NAVY } };
  mlTitle.height = 22;

  const milestones: string[][] = [
    ["0.5x DPI", "✅ Achieved",  "Q4 2023",         "", "", "Meituan full exit triggered milestone"],
    ["1.0x DPI", "🔄 On Track", "Q2 2025 (proj.)",  "", "", "Pending Sea Limited + remaining distributions"],
    ["1.5x DPI", "📅 Target",   "Q4 2027 (proj.)",  "", "", "Subject to CATL / Grab monetization events"],
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

  // Download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  saveAs(blob, "Hillhouse_Capital_PE_Fund_Report_Q4_2024.xlsx");
}

/**
 * 生成 PowerPoint 簡報
 */
export async function generatePPT(options: GenerateOptions): Promise<void> {
  const { title, content, slides, author } = options;
  
  const pptx = new PptxGenJS();
  pptx.author = author || "AI旗艦隊";
  pptx.title = title;
  
  // 封面頁
  const coverSlide = pptx.addSlide();
  coverSlide.addText(title, {
    x: 0.5,
    y: 2,
    w: "90%",
    h: 1.5,
    fontSize: 36,
    bold: true,
    color: "1E1E1E",
    align: "center",
  });
  coverSlide.addText(options.date?.toLocaleDateString() || new Date().toLocaleDateString(), {
    x: 0.5,
    y: 4,
    w: "90%",
    fontSize: 18,
    color: "666666",
    align: "center",
  });
  
  // 如果有自定義投影片
  if (slides && slides.length > 0) {
    slides.forEach(slideData => {
      const slide = pptx.addSlide();
      slide.addText(slideData.title, {
        x: 0.5,
        y: 0.5,
        w: "90%",
        fontSize: 28,
        bold: true,
        color: "1E1E1E",
      });
      
      slideData.content.forEach((text, index) => {
        slide.addText(`• ${text}`, {
          x: 0.5,
          y: 1.5 + index * 0.6,
          w: "90%",
          fontSize: 18,
          color: "333333",
        });
      });
    });
  } else {
    // 從內容自動生成投影片
    const contentSlide = pptx.addSlide();
    contentSlide.addText("內容摘要", {
      x: 0.5,
      y: 0.5,
      w: "90%",
      fontSize: 28,
      bold: true,
      color: "1E1E1E",
    });
    contentSlide.addText(content, {
      x: 0.5,
      y: 1.5,
      w: "90%",
      h: 4,
      fontSize: 16,
      color: "333333",
      valign: "top",
    });
  }
  
  // 下載
  pptx.writeFile({ fileName: `${title}.pptx` });
}

/**
 * 生成 Word 文件
 */
export async function generateDOC(options: GenerateOptions): Promise<void> {
  const { title, content, author, date } = options;
  
  const doc = new Document({
    creator: author || "AI旗艦隊",
    title: title,
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: title,
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `日期: ${(date || new Date()).toLocaleDateString()}`,
                color: "888888",
                size: 20,
              }),
            ],
          }),
          new Paragraph({ text: "" }), // 空行
          ...content.split("\n").map(
            line =>
              new Paragraph({
                children: [
                  new TextRun({
                    text: line,
                    size: 24,
                  }),
                ],
              })
          ),
        ],
      },
    ],
  });
  
  const buffer = await Packer.toBlob(doc);
  saveAs(buffer, `${title}.docx`);
}

/**
 * 生成 Markdown 文件
 */
export function generateMarkdown(options: GenerateOptions): void {
  const { title, content, author, date } = options;
  
  let markdown = `# ${title}\n\n`;
  if (author || date) {
    markdown += `> ${author ? `作者: ${author}` : ""} ${date ? `| 日期: ${date.toLocaleDateString()}` : ""}\n\n`;
  }
  markdown += content;
  
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  saveAs(blob, `${title}.md`);
}

/**
 * 生成 CSV 文件
 */
export function generateCSV(options: GenerateOptions): void {
  const { title, tableData } = options;
  
  if (!tableData) {
    throw new Error("CSV 需要表格數據");
  }
  
  let csv = tableData.headers.join(",") + "\n";
  tableData.rows.forEach(row => {
    csv += row.map(cell => `"${cell}"`).join(",") + "\n";
  });
  
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  saveAs(blob, `${title}.csv`);
}

/**
 * 生成程式碼文件
 */
export function generateCode(options: GenerateOptions): void {
  const { title, content, codeLanguage } = options;
  
  const ext = codeLanguage === "python" ? "py" 
    : codeLanguage === "javascript" ? "js"
    : codeLanguage === "typescript" ? "ts"
    : codeLanguage === "sql" ? "sql"
    : "txt";
  
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  saveAs(blob, `${title}.${ext}`);
}

/**
 * 統一導出介面
 */
export async function generateDocument(
  format: "pdf" | "xls" | "ppt" | "doc" | "markdown" | "csv" | "code",
  options: GenerateOptions
): Promise<void> {
  switch (format) {
    case "pdf":
      return generatePDF(options);
    case "xls":
      return generateXLS(options);
    case "ppt":
      return generatePPT(options);
    case "doc":
      return generateDOC(options);
    case "markdown":
      return generateMarkdown(options);
    case "csv":
      return generateCSV(options);
    case "code":
      return generateCode(options);
    default:
      throw new Error(`不支援的格式: ${format}`);
  }
}

/**
 * 一鍵導出全部格式 (ZIP)
 */
export async function generateAllFormats(
  formats: ("pdf" | "xls" | "ppt" | "doc" | "markdown" | "csv")[],
  options: GenerateOptions
): Promise<void> {
  const zip = new JSZip();
  const { title, content, author, date, tableData, slides } = options;

  // 生成 PDF
  if (formats.includes("pdf")) {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(title, 20, 20);
    doc.setFontSize(10);
    doc.setTextColor(128);
    if (author) doc.text(`作者: ${author}`, 20, 30);
    if (date) doc.text(`日期: ${date.toLocaleDateString()}`, 20, 35);
    doc.setFontSize(12);
    doc.setTextColor(0);
    const lines = doc.splitTextToSize(content, 170);
    doc.text(lines, 20, 45);
    if (tableData) {
      doc.autoTable({
        head: [tableData.headers],
        body: tableData.rows,
        startY: 80,
        theme: "grid",
        headStyles: { fillColor: [30, 30, 30] },
      });
    }
    zip.file(`${title}.pdf`, doc.output("blob"));
  }

  // 生成 XLS
  if (formats.includes("xls") && tableData) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = author || "AI旗艦隊";
    const worksheet = workbook.addWorksheet(title);
    worksheet.addRow(tableData.headers);
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E1E1E" } };
    tableData.rows.forEach(row => worksheet.addRow(row));
    worksheet.columns.forEach(col => col.width = 15);
    const buffer = await workbook.xlsx.writeBuffer();
    zip.file(`${title}.xlsx`, buffer);
  }

  // 生成 PPT
  if (formats.includes("ppt")) {
    const pptx = new PptxGenJS();
    pptx.author = author || "AI旗艦隊";
    pptx.title = title;
    const coverSlide = pptx.addSlide();
    coverSlide.addText(title, { x: 0.5, y: 2, w: "90%", h: 1.5, fontSize: 36, bold: true, color: "1E1E1E", align: "center" });
    coverSlide.addText(date?.toLocaleDateString() || new Date().toLocaleDateString(), { x: 0.5, y: 4, w: "90%", fontSize: 18, color: "666666", align: "center" });
    if (slides && slides.length > 0) {
      slides.forEach(slideData => {
        const slide = pptx.addSlide();
        slide.addText(slideData.title, { x: 0.5, y: 0.5, w: "90%", fontSize: 28, bold: true, color: "1E1E1E" });
        slideData.content.forEach((text, i) => {
          slide.addText(`• ${text}`, { x: 0.5, y: 1.5 + i * 0.6, w: "90%", fontSize: 18, color: "333333" });
        });
      });
    } else {
      const contentSlide = pptx.addSlide();
      contentSlide.addText("內容摘要", { x: 0.5, y: 0.5, w: "90%", fontSize: 28, bold: true, color: "1E1E1E" });
      contentSlide.addText(content, { x: 0.5, y: 1.5, w: "90%", h: 4, fontSize: 16, color: "333333", valign: "top" });
    }
    const pptBlob = await pptx.write({ outputType: "blob" }) as Blob;
    zip.file(`${title}.pptx`, pptBlob);
  }

  // 生成 DOC
  if (formats.includes("doc")) {
    const docObj = new Document({
      creator: author || "AI旗艦隊",
      title: title,
      sections: [{
        properties: {},
        children: [
          new Paragraph({ text: title, heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ children: [new TextRun({ text: `日期: ${(date || new Date()).toLocaleDateString()}`, color: "888888", size: 20 })] }),
          new Paragraph({ text: "" }),
          ...content.split("\n").map(line => new Paragraph({ children: [new TextRun({ text: line, size: 24 })] })),
        ],
      }],
    });
    const docBuffer = await Packer.toBlob(docObj);
    zip.file(`${title}.docx`, docBuffer);
  }

  // 生成 Markdown
  if (formats.includes("markdown")) {
    let markdown = `# ${title}\n\n`;
    if (author || date) {
      markdown += `> ${author ? `作者: ${author}` : ""} ${date ? `| 日期: ${date.toLocaleDateString()}` : ""}\n\n`;
    }
    markdown += content;
    zip.file(`${title}.md`, markdown);
  }

  // 生成 CSV
  if (formats.includes("csv") && tableData) {
    let csv = tableData.headers.join(",") + "\n";
    tableData.rows.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(",") + "\n";
    });
    zip.file(`${title}.csv`, "\ufeff" + csv);
  }

  // 生成並下載 ZIP
  const zipBlob = await zip.generateAsync({ type: "blob" });
  saveAs(zipBlob, `${title}_全部格式.zip`);
}
