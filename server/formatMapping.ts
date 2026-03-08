/**
 * 職位 → 輸出格式映射
 * 根據用戶職位自動選擇最適合的文件格式與 PPT 頁數
 */

export interface FormatConfig {
  defaultFormat: "pptx" | "docx" | "xlsx";
  pptSlides?: number;
  formats: Array<"pptx" | "docx" | "xlsx">;
}

export const ROLE_FORMAT_MAP: Record<string, FormatConfig> = {
  // 顧問類
  "consultant":    { defaultFormat: "pptx", pptSlides: 8,  formats: ["pptx", "docx"] },
  "管理顧問":      { defaultFormat: "pptx", pptSlides: 8,  formats: ["pptx", "docx"] },
  "顧問":          { defaultFormat: "pptx", pptSlides: 8,  formats: ["pptx", "docx"] },
  "bcg":           { defaultFormat: "pptx", pptSlides: 8,  formats: ["pptx", "docx"] },
  "mckinsey":      { defaultFormat: "pptx", pptSlides: 8,  formats: ["pptx", "docx"] },
  "bain":          { defaultFormat: "pptx", pptSlides: 8,  formats: ["pptx", "docx"] },

  // 財務類
  "finance":       { defaultFormat: "xlsx", formats: ["xlsx", "docx", "pptx"] },
  "財務":          { defaultFormat: "xlsx", formats: ["xlsx", "docx", "pptx"] },
  "cfo":           { defaultFormat: "xlsx", formats: ["xlsx", "pptx"] },
  "會計":          { defaultFormat: "xlsx", formats: ["xlsx", "docx"] },
  "financial":     { defaultFormat: "xlsx", formats: ["xlsx", "docx", "pptx"] },

  // 行銷類
  "marketing":     { defaultFormat: "pptx", pptSlides: 11, formats: ["pptx", "docx"] },
  "行銷":          { defaultFormat: "pptx", pptSlides: 11, formats: ["pptx", "docx"] },
  "cmo":           { defaultFormat: "pptx", pptSlides: 11, formats: ["pptx", "docx"] },
  "brand":         { defaultFormat: "pptx", pptSlides: 11, formats: ["pptx", "docx"] },
  "品牌":          { defaultFormat: "pptx", pptSlides: 11, formats: ["pptx", "docx"] },

  // HR 類
  "hr":            { defaultFormat: "docx", formats: ["docx", "xlsx"] },
  "人資":          { defaultFormat: "docx", formats: ["docx", "xlsx"] },
  "招募":          { defaultFormat: "docx", formats: ["docx", "xlsx"] },
  "hrbp":          { defaultFormat: "docx", formats: ["docx", "xlsx"] },

  // 業務類
  "sales":         { defaultFormat: "pptx", pptSlides: 8,  formats: ["pptx", "xlsx"] },
  "業務":          { defaultFormat: "pptx", pptSlides: 8,  formats: ["pptx", "xlsx"] },
  "cso":           { defaultFormat: "pptx", pptSlides: 8,  formats: ["pptx", "xlsx"] },

  // 預設
  "default":       { defaultFormat: "pptx", pptSlides: 11, formats: ["pptx", "docx", "xlsx"] },
};

/**
 * 根據職位字串模糊匹配最適合的格式設定
 */
export function getFormatForRole(role: string): FormatConfig {
  if (!role) return ROLE_FORMAT_MAP["default"];

  const lower = role.toLowerCase();
  for (const [key, config] of Object.entries(ROLE_FORMAT_MAP)) {
    if (key === "default") continue;
    if (lower.includes(key.toLowerCase())) {
      return config;
    }
  }
  return ROLE_FORMAT_MAP["default"];
}
