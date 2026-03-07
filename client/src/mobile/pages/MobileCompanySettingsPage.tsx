/**
 * 企業設定頁面 — 標準表單式公司基本資料設定
 * 取代原本的品牌定位對話流程
 */
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import MobileHeader from "../components/MobileHeader";
import { useI18n } from "@/i18n";
import { trpc } from "@/lib/trpc";

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

// OneDrive 連接組件
function OneDriveSection() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const userId = "dev-user-001"; // 從 auth 獲取

  // 檢查連接狀態
  const statusQuery = trpc.onedrive.status.useQuery({ userId });
  
  useEffect(() => {
    if (statusQuery.data) {
      setIsConnected(statusQuery.data.connected);
    }
  }, [statusQuery.data]);

  // 獲取授權 URL
  const authUrlQuery = trpc.onedrive.getAuthUrl.useQuery(undefined, {
    enabled: false,
  });

  // 斷開連接
  const disconnectMutation = trpc.onedrive.disconnect.useMutation();

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const result = await authUrlQuery.refetch();
      if (result.data?.url) {
        // 開啟授權視窗
        window.open(result.data.url, "_blank", "width=600,height=700");
        toast.info("請在彈出視窗中完成 Microsoft 登入");
      }
    } catch (error) {
      toast.error("無法連接 OneDrive");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectMutation.mutateAsync({ userId });
      setIsConnected(false);
      toast.success("已斷開 OneDrive 連接");
    } catch (error) {
      toast.error("斷開連接失敗");
    }
  };

  return (
    <div className="bg-white mx-4 mt-4 rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">知識庫設定</h2>
        <p className="text-xs text-gray-500 mt-0.5">連接雲端硬碟作為 AI 知識庫來源</p>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-3">
            {/* OneDrive 圖示 */}
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0078D4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-sm text-gray-900">Microsoft OneDrive</p>
              <p className="text-xs text-gray-500">
                {isConnected ? "已連接" : "未連接"}
              </p>
            </div>
          </div>

          {isConnected ? (
            <button
              onClick={handleDisconnect}
              className="px-3 py-1.5 text-sm text-red-600 bg-red-50 rounded-lg active:bg-red-100"
            >
              斷開
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="px-3 py-1.5 text-sm text-white bg-gray-900 rounded-lg active:scale-95 disabled:opacity-50"
            >
              {isConnecting ? "連接中..." : "連接"}
            </button>
          )}
        </div>

        {isConnected && (
          <p className="mt-3 text-xs text-green-600 flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            OneDrive 文件將作為 AI 知識庫來源
          </p>
        )}
      </div>
    </div>
  );
}

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

  // Web 爬取 mutation
  const crawlMutation = trpc.company.crawlWebsite.useMutation();

  // 從網站抓取品牌和產品（真正的 Web 爬取）
  const fetchBrandsFromWebsite = async () => {
    if (!formData.website.trim()) {
      toast.error("請先輸入公司網站");
      return;
    }

    // 驗證 URL 格式
    let url = formData.website.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }
    
    try {
      new URL(url);
    } catch {
      toast.error("請輸入有效的網址");
      return;
    }

    setIsFetchingBrands(true);
    toast.info("正在分析網站內容...");

    try {
      // 呼叫真正的 Web 爬取 API
      const result = await crawlMutation.mutateAsync({ url });
      
      if (!result.success) {
        toast.error(result.error || "分析失敗");
        return;
      }

      // 更新品牌資料
      if (result.brands && result.brands.length > 0) {
        setFormData(prev => ({ 
          ...prev, 
          brands: result.brands,
          // 如果有公司名稱且目前是空的，自動填入
          companyName: prev.companyName || result.companyName || "",
          industry: prev.industry || result.industry || "",
          description: prev.description || result.description || "",
        }));
        setHasChanges(true);
        toast.success(`找到 ${result.brands.length} 個品牌！儲存後將自動建立群組`);
      } else {
        toast.warning("未找到品牌資訊，請手動新增");
      }
    } catch (error: any) {
      console.error("Crawl error:", error);
      toast.error(error.message || "抓取失敗，請稍後再試");
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

  // 建立品牌群組 mutation
  const createGroupsMutation = trpc.company.createBrandGroups.useMutation();

  const handleSave = async () => {
    if (!validate()) {
      toast.error("請填寫必填欄位");
      return;
    }

    setIsSaving(true);
    
    try {
      // 1. 儲存企業資料
      localStorage.setItem("companySettings", JSON.stringify(formData));
      
      // 2. 如果有品牌，自動建立群組並推薦 AI 員工
      if (formData.brands.length > 0) {
        toast.info("正在為品牌建立群組...");
        
        const result = await createGroupsMutation.mutateAsync({
          brands: formData.brands,
        });
        
        if (result.success) {
          toast.success(`已建立 ${result.groups.length} 個品牌群組，並推薦了 AI 員工！`);
        }
      } else {
        toast.success("企業資料已儲存！");
      }
      
      setHasChanges(false);
      setSaveSuccess(true);
      
      // 1.5 秒後返回 profile 頁面
      setTimeout(() => {
        navigate("/profile");
      }, 1500);
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error("儲存失敗：" + (error.message || "請稍後再試"));
    } finally {
      setIsSaving(false);
    }
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

            {/* 公司網站 + 自動抓取 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                公司網站
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => updateField("website", e.target.value)}
                  placeholder="https://www.example.com"
                  className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 transition-colors"
                />
                <button
                  onClick={fetchBrandsFromWebsite}
                  disabled={isFetchingBrands || !formData.website.trim()}
                  className="px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl disabled:opacity-50 active:scale-95 transition-transform flex items-center gap-1.5 whitespace-nowrap"
                >
                  {isFetchingBrands ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                        <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                      </svg>
                      抓取中
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      </svg>
                      抓取
                    </>
                  )}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
                </svg>
                輸入網址後點「抓取」，自動建立品牌與產品，並為每個品牌建立群組
              </p>
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

        {/* 品牌與產品（每個品牌會自動建立群組） */}
        <div className="bg-white mx-4 mt-4 rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">
                {locale === "zh" ? "品牌與產品" : "Brands & Products"}
              </h2>
              {formData.brands.length > 0 && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {formData.brands.length} 個品牌
                </span>
              )}
            </div>
            {formData.brands.length > 0 && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                儲存後將為每個品牌自動建立群組
              </p>
            )}
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

        {/* 知識庫設定 - OneDrive 整合 */}
        <OneDriveSection />

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
