/**
 * 知識庫服務 - 整合 agent_knowledge_base 資料表
 * 支援查詢、儲存、搜尋、文件解析 (TXT/DOCX/PDF)
 */
import { query } from "./db.js";
import JSZip from "jszip";
import { PDFParse } from "pdf-parse";

// ============ 類型定義 ============

export type KnowledgeType =
  | "brand_client"
  | "brand_employer"
  | "brand_market"
  | "industry"
  | "methodology_tool"
  | "methodology_own";

export type KnowledgeSourceType =
  | "research_report"
  | "conference"
  | "article"
  | "collaboration"
  | "internal"
  | "ai_generated";

export interface KnowledgeEntry {
  id: number;
  agentId: number;
  type: KnowledgeType;
  title: string;
  content: string;
  source?: string;
  sourceType?: KnowledgeSourceType;
  acquiredAt: string;
  validUntil?: string;
  version?: number;
  wordCount?: number;
  tags?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgeSearchResult {
  entry: KnowledgeEntry;
  relevanceScore: number;
}

// ============ 查詢函數 ============

/**
 * 獲取指定 agent 的所有知識庫條目
 */
export async function getAgentKnowledge(
  agentId: number,
  activeOnly = true
): Promise<KnowledgeEntry[]> {
  const rows = await query<any>(
    `SELECT * FROM agent_knowledge_base
     WHERE agentId = ? ${activeOnly ? "AND isActive = 1" : ""}
     ORDER BY createdAt DESC`,
    [agentId]
  );
  return rows.map(parseRow);
}

/**
 * 搜尋知識庫 - 支援全文搜尋
 * 重要：agentId 隔離 — 若傳入 agentId，僅搜尋該 agent 的知識庫，確保不同 agent 互不干擾。
 *       若不傳 agentId，則搜尋所有 agent（僅限管理用途）。
 */
export async function searchKnowledge(
  keyword: string,
  agentId?: number,
  limit = 5
): Promise<KnowledgeEntry[]> {
  const params: any[] = [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`];
  let sql = `
    SELECT * FROM agent_knowledge_base
    WHERE isActive = 1
      AND (title LIKE ? OR content LIKE ? OR tags LIKE ?)
  `;

  if (agentId !== undefined) {
    sql += ` AND agentId = ?`;
    params.push(agentId);
  }

  sql += ` ORDER BY createdAt DESC LIMIT ${Number(limit)}`;

  const rows = await query<any>(sql, params);
  return rows.map(parseRow);
}

/**
 * 嚴格 agent 隔離搜尋 - 必須指定 agentId，不跨 agent 查詢
 */
export async function searchAgentKnowledge(
  keyword: string,
  agentId: number,
  limit = 5
): Promise<KnowledgeEntry[]> {
  return searchKnowledge(keyword, agentId, limit);
}

/**
 * 根據關鍵字獲取知識庫上下文字串（供 AI 使用）
 * 同時搜尋所有 agent 的知識庫
 */
export async function getKnowledgeContext(
  userQuery: string,
  agentId?: number,
  maxCharsPerEntry = 2000,
  maxEntries = 5
): Promise<string> {
  try {
    // 拆解查詢關鍵字
    const keywords = userQuery
      .replace(/[^\w\u4e00-\u9fff\s]/g, " ")
      .split(/\s+/)
      .filter((k) => k.length >= 2)
      .slice(0, 3);

    if (keywords.length === 0) return "";

    // 用第一個關鍵字搜尋
    const results = await searchKnowledge(keywords[0], agentId, maxEntries);

    if (results.length === 0) return "";

    const formatted = results
      .map((e) => {
        const snippet = e.content.slice(0, maxCharsPerEntry);
        const tags = e.tags?.join(", ") || "";
        return `【${e.title}】${tags ? ` [${tags}]` : ""}\n${snippet}`;
      })
      .join("\n\n---\n\n");

    return `\n\n=== 品牌知識庫 ===\n${formatted}\n=== 知識庫結束 ===`;
  } catch (error) {
    console.error("getKnowledgeContext error:", error);
    return "";
  }
}

// ============ 儲存函數 ============

export interface SaveKnowledgeInput {
  agentId: number;
  type: KnowledgeType;
  title: string;
  content: string;
  source?: string;
  sourceType?: KnowledgeSourceType;
  tags?: string[];
  acquiredAt?: string; // YYYY-MM format, defaults to now
}

/**
 * 儲存新的知識庫條目
 */
export async function saveKnowledgeEntry(
  input: SaveKnowledgeInput
): Promise<number> {
  const now = new Date();
  const acquiredAt =
    input.acquiredAt ||
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const wordCount = input.content.split(/\s+/).length;
  const tags = input.tags ? JSON.stringify(input.tags) : null;

  const result = await query<any>(
    `INSERT INTO agent_knowledge_base
       (agentId, type, title, content, source, sourceType, acquiredAt, wordCount, tags, isActive)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [
      input.agentId,
      input.type,
      input.title,
      input.content,
      input.source || null,
      input.sourceType || "internal",
      acquiredAt,
      wordCount,
      tags,
    ]
  );

  return (result as any).insertId;
}

/**
 * 刪除知識庫條目（軟刪除）
 */
export async function deleteKnowledgeEntry(id: number): Promise<boolean> {
  await query(`UPDATE agent_knowledge_base SET isActive = 0 WHERE id = ?`, [
    id,
  ]);
  return true;
}

// ============ 文件解析 ============

export type FileType = "txt" | "pdf" | "docx";

/**
 * 從 base64 內容解析文件文字
 */
export async function parseFileContent(
  base64Content: string,
  fileType: FileType
): Promise<string> {
  const buffer = Buffer.from(base64Content, "base64");

  switch (fileType) {
    case "txt":
      return buffer.toString("utf-8");

    case "pdf": {
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      return result.text.trim();
    }

    case "docx": {
      return parseDocxBuffer(buffer);
    }

    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

/**
 * 從 DOCX buffer 提取純文字（使用 JSZip 解析）
 */
async function parseDocxBuffer(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const docXml = zip.file("word/document.xml");
  if (!docXml) throw new Error("Invalid DOCX file: missing word/document.xml");

  const xmlContent = await docXml.async("string");

  // 提取 <w:t> 文字節點並合并
  const textParts: string[] = [];
  const regex = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g;
  let match;
  while ((match = regex.exec(xmlContent)) !== null) {
    textParts.push(match[1]);
  }

  return textParts.join(" ").replace(/\s+/g, " ").trim();
}

// ============ 工具函數 ============

function parseRow(row: any): KnowledgeEntry {
  return {
    id: row.id,
    agentId: row.agentId,
    type: row.type,
    title: row.title,
    content: row.content,
    source: row.source,
    sourceType: row.sourceType,
    acquiredAt: row.acquiredAt,
    validUntil: row.validUntil,
    version: row.version,
    wordCount: row.wordCount,
    tags: row.tags
      ? typeof row.tags === "string"
        ? JSON.parse(row.tags)
        : row.tags
      : [],
    isActive: row.isActive === 1,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}
