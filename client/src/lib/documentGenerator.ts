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
  workbook.creator = options.author || "AI Mobile Team";
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
 * 生成 PowerPoint 簡報
 */
export async function generatePPT(options: GenerateOptions): Promise<void> {
  const { title, content, slides, author } = options;
  
  const pptx = new PptxGenJS();
  pptx.author = author || "AI Mobile Team";
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
    creator: author || "AI Mobile Team",
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
    workbook.creator = author || "AI Mobile Team";
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
    pptx.author = author || "AI Mobile Team";
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
      creator: author || "AI Mobile Team",
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
