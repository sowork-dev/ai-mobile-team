/**
 * 企業設定頁面 — 標準表單式公司基本資料設定
 * 取代原本的品牌定位對話流程
 */
import { useState, useEffect, useRef } from "react";
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


export default function MobileCompanySettingsPage() {
  const [, navigate] = useLocation();
  const { locale } = useI18n();
  const [isSaving, setIsSaving] = useState(false);
  const [_hasChanges, setHasChanges] = useState(false);
  
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

  // ── OneDrive 整合 ──────────────────────────────────────────────────────────
  const onedrivePopupRef = useRef<Window | null>(null);

  const onedriveStatus = trpc.onedrive.status.useQuery(undefined, {
    refetchInterval: 5000, // 每 5 秒輪詢一次（等待 OAuth 完成）
  });
  const onedriveConnect = trpc.onedrive.connect.useMutation();
  const onedriveDisconnect = trpc.onedrive.disconnect.useMutation();
  const onedriveListFiles = trpc.onedrive.listFiles.useQuery(undefined, {
    enabled: !!onedriveStatus.data?.connected,
  });
  const onedriveScanKnowledge = trpc.onedrive.scanKnowledge.useMutation();

  const isOnedriveConnected = onedriveStatus.data?.connected ?? false;

  // 開啟 OAuth 授權視窗
  const handleOnedriveConnect = async () => {
    try {
      const { authUrl } = await onedriveConnect.mutateAsync({});
      const popup = window.open(authUrl, "onedrive-auth", "width=600,height=700,scrollbars=yes");
      onedrivePopupRef.current = popup;

      // 監聽 popup 送回的 message
      const handler = (e: MessageEvent) => {
        if (e.data?.type === "onedrive-connected") {
          toast.success("OneDrive 連接成功！");
          onedriveStatus.refetch();
          onedriveListFiles.refetch();
          window.removeEventListener("message", handler);
        }
      };
      window.addEventListener("message", handler);
    } catch (err: any) {
      toast.error("無法取得授權網址：" + (err.message || "請稍後再試"));
    }
  };

  // 掃描 OneDrive 知識庫
  const handleScanKnowledge = async () => {
    try {
      toast.info("正在掃描 OneDrive 知識庫...");
      const result = await onedriveScanKnowledge.mutateAsync({});
      toast.success(`掃描完成！找到 ${result.count} 個文件`);
    } catch (err: any) {
      toast.error("掃描失敗：" + (err.message || "請確認 OneDrive 已連接"));
    }
  };

  // 斷開 OneDrive
  const handleOnedriveDisconnect = async () => {
    await onedriveDisconnect.mutateAsync({});
    toast.success("已斷開 OneDrive 連接");
    onedriveStatus.refetch();
  };
  // ── /OneDrive ──────────────────────────────────────────────────────────────

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

        {/* OneDrive 知識庫整合 */}
        <div className="bg-white mx-4 mt-4 rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              {/* OneDrive 圖示 */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6.5 20C4.01 20 2 17.99 2 15.5C2 13.24 3.66 11.37 5.83 11.04C5.64 10.56 5.5 10.05 5.5 9.5C5.5 7.01 7.51 5 10 5C11.78 5 13.32 6.01 14.1 7.49C14.56 7.18 15.11 7 15.7 7C17.52 7 19 8.48 19 10.3C19 10.45 18.99 10.6 18.97 10.75C21.22 11.14 23 13.14 23 15.5C23 17.99 20.99 20 18.5 20H6.5Z" fill="#0078D4"/>
              </svg>
              <h2 className="font-semibold text-gray-900">
                {locale === "zh" ? "OneDrive 知識庫" : "OneDrive Knowledge Base"}
              </h2>
              {isOnedriveConnected && (
                <span className="ml-auto text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                  已連接
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              連接 OneDrive 後，AI 員工可掃描您的文件作為知識庫
            </p>
          </div>

          <div className="p-4 space-y-3">
            {isOnedriveConnected ? (
              <>
                {/* 已連接狀態 */}
                <div className="flex items-center gap-3 bg-blue-50 rounded-xl p-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-blue-900">
                      {onedriveStatus.data?.userName || "Microsoft 帳號"}
                    </p>
                    <p className="text-xs text-blue-600 truncate">
                      {onedriveStatus.data?.userEmail || "已連接"}
                    </p>
                  </div>
                </div>

                {/* 文件列表 */}
                {onedriveListFiles.data?.files && onedriveListFiles.data.files.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs font-medium text-gray-600 mb-2">
                      根目錄檔案（{onedriveListFiles.data.files.length} 個）
                    </p>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {onedriveListFiles.data.files.slice(0, 10).map((file) => (
                        <div key={file.id} className="flex items-center gap-2 text-xs text-gray-600">
                          {file.type === "folder" ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="#F59E0B" stroke="none"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="#6B7280" stroke="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8" fill="none" stroke="white" strokeWidth="2"/></svg>
                          )}
                          <span className="truncate">{file.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 操作按鈕 */}
                <div className="flex gap-2">
                  <button
                    onClick={handleScanKnowledge}
                    disabled={onedriveScanKnowledge.isPending}
                    className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl disabled:opacity-50 active:scale-95 transition-transform flex items-center justify-center gap-1.5"
                  >
                    {onedriveScanKnowledge.isPending ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                          <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                        </svg>
                        掃描中
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                        </svg>
                        掃描知識庫
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleOnedriveDisconnect}
                    className="px-4 py-2.5 border border-gray-200 text-gray-600 text-sm rounded-xl active:scale-95 transition-transform"
                  >
                    斷開
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-500 text-center py-2">
                  尚未連接 OneDrive
                </p>
                <button
                  onClick={handleOnedriveConnect}
                  disabled={onedriveConnect.isPending}
                  className="w-full py-3 bg-[#0078D4] text-white text-sm font-medium rounded-xl disabled:opacity-50 active:scale-95 transition-transform flex items-center justify-center gap-2"
                >
                  {onedriveConnect.isPending ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                        <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                      </svg>
                      取得授權中
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6.5 20C4.01 20 2 17.99 2 15.5C2 13.24 3.66 11.37 5.83 11.04C5.64 10.56 5.5 10.05 5.5 9.5C5.5 7.01 7.51 5 10 5C11.78 5 13.32 6.01 14.1 7.49C14.56 7.18 15.11 7 15.7 7C17.52 7 19 8.48 19 10.3C19 10.45 18.99 10.6 18.97 10.75C21.22 11.14 23 13.14 23 15.5C23 17.99 20.99 20 18.5 20H6.5Z"/>
                      </svg>
                      連接 OneDrive
                    </>
                  )}
                </button>
              </>
            )}
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
