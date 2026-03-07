/**
 * 企業設定頁面 — 標準表單式公司基本資料設定
 * 取代原本的品牌定位對話流程
 */
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import MobileHeader from "../components/MobileHeader";
import { useI18n } from "@/i18n";

interface Brand {
  name: string;
  products: string[];
}

interface CompanyInfo {
  companyName: string;
  industry: string;
  companySize: string;
  address: string;
  contactName: string;
  contactPhone: string;
  website: string;
  description: string;
  brands: Brand[];
}

const INDUSTRY_OPTIONS = [
  "科技/軟體", "電子商務", "金融/保險", "製造業", "零售/批發",
  "醫療/健康", "教育/培訓", "媒體/娛樂", "餐飲/服務", "其他"
];

const COMPANY_SIZE_OPTIONS = [
  "1-10 人", "11-50 人", "51-200 人", "201-500 人", "500 人以上"
];

export default function MobileCompanySettingsPage() {
  const [, navigate] = useLocation();
  const { locale } = useI18n();
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  const [formData, setFormData] = useState<CompanyInfo>({
    companyName: "",
    industry: "",
    companySize: "",
    address: "",
    contactName: "",
    contactPhone: "",
    website: "",
    description: "",
    brands: [],
  });
  
  const [isFetchingBrands, setIsFetchingBrands] = useState(false);

  const [errors, setErrors] = useState<Partial<Record<keyof CompanyInfo, string>>>({});

  // 載入已存的資料
  useEffect(() => {
    const saved = localStorage.getItem("companySettings");
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
  }, []);

  const updateField = (field: keyof CompanyInfo, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    // 清除該欄位的錯誤
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CompanyInfo, string>> = {};
    
    if (!formData.companyName.trim()) {
      newErrors.companyName = "請輸入公司名稱";
    }
    if (!formData.industry) {
      newErrors.industry = "請選擇產業類別";
    }
    if (!formData.companySize) {
      newErrors.companySize = "請選擇公司規模";
    }
    if (!formData.contactName.trim()) {
      newErrors.contactName = "請輸入聯絡人姓名";
    }
    if (!formData.contactPhone.trim()) {
      newErrors.contactPhone = "請輸入聯絡電話";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [saveSuccess, setSaveSuccess] = useState(false);

  // 自動抓取品牌和產品
  const fetchBrandsAndProducts = async () => {
    if (!formData.companyName.trim()) {
      toast.error("請先輸入公司名稱");
      return;
    }

    setIsFetchingBrands(true);
    toast.info("正在查詢品牌資訊...");

    try {
      // 模擬 AI 查詢（之後可接真正的 API）
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 根據公司名稱模擬返回品牌資料
      const companyName = formData.companyName.toLowerCase();
      let mockBrands: Brand[] = [];
      
      // 一些知名公司的模擬資料
      if (companyName.includes("apple") || companyName.includes("蘋果")) {
        mockBrands = [
          { name: "iPhone", products: ["iPhone 15 Pro", "iPhone 15", "iPhone SE"] },
          { name: "Mac", products: ["MacBook Pro", "MacBook Air", "iMac", "Mac mini"] },
          { name: "iPad", products: ["iPad Pro", "iPad Air", "iPad mini"] },
          { name: "Apple Watch", products: ["Watch Ultra", "Watch Series 9"] },
        ];
      } else if (companyName.includes("microsoft") || companyName.includes("微軟")) {
        mockBrands = [
          { name: "Office 365", products: ["Word", "Excel", "PowerPoint", "Teams"] },
          { name: "Azure", products: ["VM", "App Service", "Functions", "AI Services"] },
          { name: "Surface", products: ["Surface Pro", "Surface Laptop", "Surface Go"] },
        ];
      } else if (companyName.includes("sowork")) {
        mockBrands = [
          { name: "SoWork AI", products: ["AI 員工平台", "幕僚長", "AI 團隊管理"] },
        ];
      } else {
        // 通用模擬：為任何公司生成一個品牌
        mockBrands = [
          { name: formData.companyName.replace(/股份有限公司|有限公司|公司/g, "").trim(), products: ["主要產品", "服務項目"] },
        ];
      }

      setFormData(prev => ({ ...prev, brands: mockBrands }));
      setHasChanges(true);
      toast.success(`找到 ${mockBrands.length} 個品牌！`);
    } catch (error) {
      toast.error("抓取失敗，請稍後再試");
    } finally {
      setIsFetchingBrands(false);
    }
  };

  // 新增品牌
  const addBrand = () => {
    setFormData(prev => ({
      ...prev,
      brands: [...prev.brands, { name: "", products: [] }]
    }));
    setHasChanges(true);
  };

  // 更新品牌名稱
  const updateBrandName = (index: number, name: string) => {
    setFormData(prev => ({
      ...prev,
      brands: prev.brands.map((b, i) => i === index ? { ...b, name } : b)
    }));
    setHasChanges(true);
  };

  // 更新產品（逗號分隔）
  const updateBrandProducts = (index: number, productsStr: string) => {
    const products = productsStr.split(/[,，]/).map(p => p.trim()).filter(Boolean);
    setFormData(prev => ({
      ...prev,
      brands: prev.brands.map((b, i) => i === index ? { ...b, products } : b)
    }));
    setHasChanges(true);
  };

  // 刪除品牌
  const removeBrand = (index: number) => {
    setFormData(prev => ({
      ...prev,
      brands: prev.brands.filter((_, i) => i !== index)
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!validate()) {
      toast.error("請填寫必填欄位");
      return;
    }

    setIsSaving(true);
    
    // 模擬 API 儲存
    await new Promise(resolve => setTimeout(resolve, 600));
    
    localStorage.setItem("companySettings", JSON.stringify(formData));
    setIsSaving(false);
    setHasChanges(false);
    setSaveSuccess(true);
    
    toast.success("企業資料已儲存！");
    
    // 1.5 秒後返回 profile 頁面
    setTimeout(() => {
      navigate("/profile");
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <MobileHeader 
        title={locale === "zh" ? "企業設定" : "Company Settings"} 
        showBack 
        onBack={() => navigate("/profile")}
      />

      <div className="flex-1 overflow-y-auto">
        {/* 公司基本資訊 */}
        <div className="bg-white mx-4 mt-4 rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">
              {locale === "zh" ? "公司基本資訊" : "Company Information"}
            </h2>
          </div>

          <div className="p-4 space-y-4">
            {/* 公司名稱 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                公司名稱 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => updateField("companyName", e.target.value)}
                placeholder="例如：SoWork AI 股份有限公司"
                className={`w-full px-3 py-2.5 border rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 transition-colors ${errors.companyName ? "border-red-400" : "border-gray-200"}`}
              />
              {errors.companyName && (
                <p className="mt-1 text-xs text-red-500">{errors.companyName}</p>
              )}
            </div>

            {/* 產業類別 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                產業類別 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.industry}
                onChange={(e) => updateField("industry", e.target.value)}
                className={`w-full px-3 py-2.5 border rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 transition-colors appearance-none ${errors.industry ? "border-red-400" : "border-gray-200"}`}
              >
                <option value="">請選擇產業</option>
                {INDUSTRY_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              {errors.industry && (
                <p className="mt-1 text-xs text-red-500">{errors.industry}</p>
              )}
            </div>

            {/* 公司規模 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                公司規模 <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {COMPANY_SIZE_OPTIONS.map(size => (
                  <button
                    key={size}
                    onClick={() => updateField("companySize", size)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      formData.companySize === size
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              {errors.companySize && (
                <p className="mt-1 text-xs text-red-500">{errors.companySize}</p>
              )}
            </div>

            {/* 公司地址 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                公司地址
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => updateField("address", e.target.value)}
                placeholder="例如：台北市信義區信義路五段 7 號"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 transition-colors"
              />
            </div>

            {/* 公司網站 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                公司網站
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => updateField("website", e.target.value)}
                placeholder="https://www.example.com"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* 聯絡人資訊 */}
        <div className="bg-white mx-4 mt-4 rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">
              {locale === "zh" ? "聯絡人資訊" : "Contact Information"}
            </h2>
          </div>

          <div className="p-4 space-y-4">
            {/* 聯絡人姓名 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                聯絡人姓名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.contactName}
                onChange={(e) => updateField("contactName", e.target.value)}
                placeholder="請輸入姓名"
                className={`w-full px-3 py-2.5 border rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 transition-colors ${errors.contactName ? "border-red-400" : "border-gray-200"}`}
              />
              {errors.contactName && (
                <p className="mt-1 text-xs text-red-500">{errors.contactName}</p>
              )}
            </div>

            {/* 聯絡電話 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                聯絡電話 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => updateField("contactPhone", e.target.value)}
                placeholder="例如：02-1234-5678"
                className={`w-full px-3 py-2.5 border rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 transition-colors ${errors.contactPhone ? "border-red-400" : "border-gray-200"}`}
              />
              {errors.contactPhone && (
                <p className="mt-1 text-xs text-red-500">{errors.contactPhone}</p>
              )}
            </div>
          </div>
        </div>

        {/* 品牌與產品 */}
        <div className="bg-white mx-4 mt-4 rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">
              {locale === "zh" ? "品牌與產品" : "Brands & Products"}
            </h2>
            <button
              onClick={fetchBrandsAndProducts}
              disabled={isFetchingBrands || !formData.companyName.trim()}
              className="text-xs font-medium text-white bg-gray-900 px-3 py-1.5 rounded-full disabled:opacity-50 active:scale-95 transition-transform flex items-center gap-1.5"
            >
              {isFetchingBrands ? (
                <>
                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                  </svg>
                  抓取中...
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z" />
                  </svg>
                  自動抓取
                </>
              )}
            </button>
          </div>

          <div className="p-4 space-y-4">
            {formData.brands.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                    <line x1="7" y1="7" x2="7.01" y2="7"/>
                  </svg>
                </div>
                <p className="text-sm text-gray-500">尚未設定品牌</p>
                <p className="text-xs text-gray-400 mt-1">點擊「自動抓取」或手動新增</p>
              </div>
            ) : (
              formData.brands.map((brand, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={brand.name}
                      onChange={(e) => updateBrandName(index, e.target.value)}
                      placeholder="品牌名稱"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                    <button
                      onClick={() => removeBrand(index)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 active:bg-red-100"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">產品（逗號分隔）</label>
                    <input
                      type="text"
                      value={brand.products.join(", ")}
                      onChange={(e) => updateBrandProducts(index, e.target.value)}
                      placeholder="產品A, 產品B, 產品C"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>
                  {brand.products.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {brand.products.map((product, pIndex) => (
                        <span key={pIndex} className="text-xs bg-white text-gray-600 px-2 py-1 rounded-full border border-gray-200">
                          {product}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}

            <button
              onClick={addBrand}
              className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              新增品牌
            </button>
          </div>
        </div>

        {/* 公司簡介 */}
        <div className="bg-white mx-4 mt-4 mb-6 rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">
              {locale === "zh" ? "公司簡介" : "Company Description"}
            </h2>
          </div>

          <div className="p-4">
            <textarea
              value={formData.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="簡述您的公司業務、產品或服務..."
              rows={4}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 transition-colors resize-none"
            />
            <p className="mt-1.5 text-xs text-gray-400 text-right">
              {formData.description.length} / 500
            </p>
          </div>
        </div>
      </div>

      {/* 底部儲存按鈕 */}
      <div className="flex-shrink-0 bg-white border-t border-gray-100 px-4 py-4">
        <button
          onClick={handleSave}
          disabled={isSaving || saveSuccess}
          className={`w-full py-3.5 rounded-xl font-semibold active:scale-[0.98] transition-all disabled:opacity-70 ${
            saveSuccess 
              ? "bg-green-600 text-white" 
              : "bg-gray-900 text-white"
          }`}
        >
          {saveSuccess ? (
            <span className="flex items-center justify-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              儲存成功！
            </span>
          ) : isSaving ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
              </svg>
              儲存中...
            </span>
          ) : (
            locale === "zh" ? "儲存設定" : "Save Settings"
          )}
        </button>
      </div>
    </div>
  );
}
