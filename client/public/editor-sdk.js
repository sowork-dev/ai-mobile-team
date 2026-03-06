/**
 * SoWork.ai 視覺編輯器 SDK
 * 讓用戶可以直接在官網上編輯文字內容
 * 
 * 使用方式：
 * <script src="https://your-domain.com/editor-sdk.js"></script>
 * <script>
 *   window.SoworkEditor.init({
 *     apiEndpoint: 'https://api.sowork.ai',
 *     brandBookId: 'YOUR_BRAND_ID',
 *     onSave: async (changes) => { ... }
 *   });
 * </script>
 */

(function(window) {
  'use strict';

  // 編輯器狀態
  const state = {
    isEditMode: false,
    token: null,
    config: null,
    brandBook: null,
    changes: [],
    selectedElement: null,
    originalContent: new Map(),
  };

  // 樣式定義
  const styles = `
    .sowork-toolbar {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 999999;
      display: flex;
      gap: 8px;
      padding: 12px 16px;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      animation: sowork-slide-in 0.3s ease-out;
    }

    @keyframes sowork-slide-in {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .sowork-toolbar-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .sowork-toolbar-btn:hover {
      transform: translateY(-2px);
    }

    .sowork-toolbar-btn.primary {
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      color: white;
    }

    .sowork-toolbar-btn.secondary {
      background: rgba(255, 255, 255, 0.1);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .sowork-toolbar-btn.success {
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      color: white;
    }

    .sowork-toolbar-btn.danger {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
    }

    .sowork-toolbar-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    .sowork-editable {
      outline: 2px dashed transparent;
      transition: all 0.2s ease;
      cursor: text;
    }

    .sowork-editable:hover {
      outline-color: #f97316;
      background: rgba(249, 115, 22, 0.1);
    }

    .sowork-editable.editing {
      outline: 2px solid #f97316;
      background: rgba(249, 115, 22, 0.15);
    }

    .sowork-editable.modified {
      outline: 2px solid #22c55e;
      background: rgba(34, 197, 94, 0.1);
    }

    .sowork-sidebar {
      position: fixed;
      top: 0;
      right: -400px;
      width: 400px;
      height: 100vh;
      background: #1a1a2e;
      z-index: 999998;
      transition: right 0.3s ease;
      overflow-y: auto;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .sowork-sidebar.open {
      right: 0;
    }

    .sowork-sidebar-header {
      padding: 20px;
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      color: white;
    }

    .sowork-sidebar-header h2 {
      margin: 0 0 8px 0;
      font-size: 18px;
      font-weight: 600;
    }

    .sowork-sidebar-header p {
      margin: 0;
      font-size: 14px;
      opacity: 0.9;
    }

    .sowork-sidebar-content {
      padding: 20px;
      color: white;
    }

    .sowork-sidebar-section {
      margin-bottom: 24px;
    }

    .sowork-sidebar-section h3 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: #f97316;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .sowork-change-item {
      padding: 12px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      margin-bottom: 8px;
    }

    .sowork-change-item .selector {
      font-size: 12px;
      color: #888;
      margin-bottom: 8px;
    }

    .sowork-change-item .original {
      font-size: 13px;
      color: #ef4444;
      text-decoration: line-through;
      margin-bottom: 4px;
    }

    .sowork-change-item .new {
      font-size: 13px;
      color: #22c55e;
    }

    .sowork-popup {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #1a1a2e;
      border-radius: 16px;
      padding: 24px;
      z-index: 1000000;
      min-width: 400px;
      max-width: 600px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: white;
    }

    .sowork-popup h3 {
      margin: 0 0 16px 0;
      font-size: 18px;
      font-weight: 600;
    }

    .sowork-popup-content {
      margin-bottom: 20px;
    }

    .sowork-popup-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .sowork-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 999999;
    }

    .sowork-brand-check-result {
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 16px;
    }

    .sowork-brand-check-result.compliant {
      background: rgba(34, 197, 94, 0.2);
      border: 1px solid #22c55e;
    }

    .sowork-brand-check-result.non-compliant {
      background: rgba(239, 68, 68, 0.2);
      border: 1px solid #ef4444;
    }

    .sowork-score {
      font-size: 48px;
      font-weight: 700;
      text-align: center;
      margin-bottom: 8px;
    }

    .sowork-score.high { color: #22c55e; }
    .sowork-score.medium { color: #f97316; }
    .sowork-score.low { color: #ef4444; }

    .sowork-issues-list, .sowork-suggestions-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .sowork-issues-list li, .sowork-suggestions-list li {
      padding: 8px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      font-size: 14px;
    }

    .sowork-issues-list li:last-child, .sowork-suggestions-list li:last-child {
      border-bottom: none;
    }

    .sowork-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
    }

    .sowork-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(255, 255, 255, 0.1);
      border-top-color: #f97316;
      border-radius: 50%;
      animation: sowork-spin 1s linear infinite;
    }

    @keyframes sowork-spin {
      to { transform: rotate(360deg); }
    }

    .sowork-toast {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      padding: 12px 24px;
      background: #1a1a2e;
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      z-index: 1000001;
      animation: sowork-toast-in 0.3s ease-out;
    }

    .sowork-toast.success {
      border-left: 4px solid #22c55e;
    }

    .sowork-toast.error {
      border-left: 4px solid #ef4444;
    }

    @keyframes sowork-toast-in {
      from {
        opacity: 0;
        transform: translate(-50%, 20px);
      }
      to {
        opacity: 1;
        transform: translate(-50%, 0);
      }
    }
  `;

  // 工具函數
  function injectStyles() {
    const styleEl = document.createElement('style');
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);
  }

  function getUniqueSelector(element) {
    if (element.id) return `#${element.id}`;
    
    let path = [];
    while (element && element.nodeType === Node.ELEMENT_NODE) {
      let selector = element.tagName.toLowerCase();
      if (element.className) {
        const classes = element.className.split(/\s+/).filter(c => c && !c.startsWith('sowork-'));
        if (classes.length) {
          selector += '.' + classes.slice(0, 2).join('.');
        }
      }
      path.unshift(selector);
      element = element.parentElement;
      if (path.length > 4) break;
    }
    return path.join(' > ');
  }

  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `sowork-toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  // API 呼叫
  async function apiCall(endpoint, method = 'GET', data = null) {
    const url = `${state.config.apiEndpoint}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    if (data) {
      options.body = JSON.stringify(data);
    }
    const response = await fetch(url, options);
    return response.json();
  }

  async function verifyToken(token) {
    try {
      const result = await apiCall(`/trpc/analytics.verifyEditToken?input=${encodeURIComponent(JSON.stringify({ token }))}`);
      return result.result?.data || { valid: false };
    } catch (error) {
      console.error('Token verification failed:', error);
      return { valid: false };
    }
  }

  async function checkBrandCompliance(text, brandId) {
    try {
      const result = await apiCall('/trpc/analytics.checkBrandCompliance', 'POST', {
        text,
        brandId,
      });
      return result.result?.data;
    } catch (error) {
      console.error('Brand check failed:', error);
      throw error;
    }
  }

  async function aiRewrite(originalText, brandId, context = '') {
    try {
      const result = await apiCall('/trpc/analytics.aiRewrite', 'POST', {
        originalText,
        brandId,
        context,
      });
      return result.result?.data;
    } catch (error) {
      console.error('AI rewrite failed:', error);
      throw error;
    }
  }

  // UI 組件
  function createToolbar() {
    const toolbar = document.createElement('div');
    toolbar.className = 'sowork-toolbar';
    toolbar.id = 'sowork-toolbar';
    toolbar.innerHTML = `
      <button class="sowork-toolbar-btn secondary" id="sowork-toggle-sidebar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 12h18M3 6h18M3 18h18"/>
        </svg>
        變更列表
      </button>
      <button class="sowork-toolbar-btn secondary" id="sowork-brand-check" disabled>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        品牌檢查
      </button>
      <button class="sowork-toolbar-btn primary" id="sowork-ai-rewrite" disabled>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
        </svg>
        AI 改寫
      </button>
      <button class="sowork-toolbar-btn success" id="sowork-save" disabled>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
          <polyline points="17,21 17,13 7,13 7,21"/>
          <polyline points="7,3 7,8 15,8"/>
        </svg>
        儲存 (<span id="sowork-change-count">0</span>)
      </button>
      <button class="sowork-toolbar-btn danger" id="sowork-exit">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
        退出
      </button>
    `;
    document.body.appendChild(toolbar);
    
    // 綁定事件
    document.getElementById('sowork-toggle-sidebar').addEventListener('click', toggleSidebar);
    document.getElementById('sowork-brand-check').addEventListener('click', handleBrandCheck);
    document.getElementById('sowork-ai-rewrite').addEventListener('click', handleAiRewrite);
    document.getElementById('sowork-save').addEventListener('click', handleSave);
    document.getElementById('sowork-exit').addEventListener('click', exitEditMode);
  }

  function createSidebar() {
    const sidebar = document.createElement('div');
    sidebar.className = 'sowork-sidebar';
    sidebar.id = 'sowork-sidebar';
    sidebar.innerHTML = `
      <div class="sowork-sidebar-header">
        <h2>SoWork.ai 編輯器</h2>
        <p>點擊頁面上的文字開始編輯</p>
      </div>
      <div class="sowork-sidebar-content">
        <div class="sowork-sidebar-section" id="sowork-brand-info">
          <h3>品牌定位</h3>
          <div id="sowork-brand-details">載入中...</div>
        </div>
        <div class="sowork-sidebar-section">
          <h3>變更列表 (<span id="sowork-sidebar-count">0</span>)</h3>
          <div id="sowork-changes-list">尚無變更</div>
        </div>
      </div>
    `;
    document.body.appendChild(sidebar);
  }

  function toggleSidebar() {
    const sidebar = document.getElementById('sowork-sidebar');
    sidebar.classList.toggle('open');
  }

  function updateChangesList() {
    const list = document.getElementById('sowork-changes-list');
    const count = document.getElementById('sowork-change-count');
    const sidebarCount = document.getElementById('sowork-sidebar-count');
    const saveBtn = document.getElementById('sowork-save');
    
    count.textContent = state.changes.length;
    sidebarCount.textContent = state.changes.length;
    saveBtn.disabled = state.changes.length === 0;
    
    if (state.changes.length === 0) {
      list.innerHTML = '尚無變更';
      return;
    }
    
    list.innerHTML = state.changes.map((change, index) => `
      <div class="sowork-change-item">
        <div class="selector">${change.selector}</div>
        <div class="original">${change.originalText.substring(0, 50)}${change.originalText.length > 50 ? '...' : ''}</div>
        <div class="new">${change.newText.substring(0, 50)}${change.newText.length > 50 ? '...' : ''}</div>
      </div>
    `).join('');
  }

  function updateBrandInfo() {
    const details = document.getElementById('sowork-brand-details');
    if (!state.brandBook) {
      details.innerHTML = '<p style="color: #888;">未關聯品牌定位</p>';
      return;
    }
    
    details.innerHTML = `
      <p><strong>品牌：</strong>${state.brandBook.brandName}</p>
      <p><strong>調性：</strong>${state.brandBook.tone?.join('、') || '未設定'}</p>
      <p><strong>目標受眾：</strong>${state.brandBook.targetAudience || '未設定'}</p>
      <p><strong>關鍵字：</strong>${state.brandBook.preferredKeywords?.join('、') || '未設定'}</p>
    `;
  }

  // 編輯功能
  function makeEditable() {
    const editableSelectors = 'h1, h2, h3, h4, h5, h6, p, span, a, li, td, th, label, button';
    const elements = document.querySelectorAll(editableSelectors);
    
    elements.forEach(el => {
      // 跳過 SDK 自己的元素
      if (el.closest('.sowork-toolbar') || el.closest('.sowork-sidebar') || el.closest('.sowork-popup')) {
        return;
      }
      
      // 只處理有文字內容的元素
      if (el.textContent.trim().length < 2) return;
      
      el.classList.add('sowork-editable');
      
      // 儲存原始內容
      if (!state.originalContent.has(el)) {
        state.originalContent.set(el, el.textContent);
      }
      
      el.addEventListener('click', handleElementClick);
    });
  }

  function handleElementClick(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const el = e.currentTarget;
    
    // 取消之前選中的元素
    if (state.selectedElement && state.selectedElement !== el) {
      state.selectedElement.classList.remove('editing');
      state.selectedElement.contentEditable = 'false';
    }
    
    // 選中當前元素
    state.selectedElement = el;
    el.classList.add('editing');
    el.contentEditable = 'true';
    el.focus();
    
    // 啟用按鈕
    document.getElementById('sowork-brand-check').disabled = !state.brandBook;
    document.getElementById('sowork-ai-rewrite').disabled = !state.brandBook;
    
    // 監聽失焦事件
    el.addEventListener('blur', handleElementBlur, { once: true });
  }

  function handleElementBlur(e) {
    const el = e.target;
    el.classList.remove('editing');
    el.contentEditable = 'false';
    
    const originalText = state.originalContent.get(el);
    const newText = el.textContent;
    
    if (originalText !== newText) {
      el.classList.add('modified');
      
      // 檢查是否已有此元素的變更
      const selector = getUniqueSelector(el);
      const existingIndex = state.changes.findIndex(c => c.selector === selector);
      
      if (existingIndex >= 0) {
        state.changes[existingIndex].newText = newText;
      } else {
        state.changes.push({
          selector,
          element: el,
          originalText,
          newText,
          contentType: el.tagName.toLowerCase(),
        });
      }
      
      updateChangesList();
    }
  }

  // 品牌檢查
  async function handleBrandCheck() {
    if (!state.selectedElement || !state.brandBook) return;
    
    const text = state.selectedElement.textContent;
    
    // 顯示載入中
    showPopup('品牌定位檢查', '<div class="sowork-loading"><div class="sowork-spinner"></div></div>');
    
    try {
      const result = await checkBrandCompliance(text, state.brandBook.id);
      
      const scoreClass = result.score >= 80 ? 'high' : result.score >= 60 ? 'medium' : 'low';
      const resultClass = result.compliant ? 'compliant' : 'non-compliant';
      
      showPopup('品牌定位檢查', `
        <div class="sowork-brand-check-result ${resultClass}">
          <div class="sowork-score ${scoreClass}">${result.score}</div>
          <p style="text-align: center; margin: 0;">${result.compliant ? '符合品牌定位' : '需要調整'}</p>
        </div>
        ${result.issues?.length ? `
          <h4 style="margin: 16px 0 8px;">問題：</h4>
          <ul class="sowork-issues-list">
            ${result.issues.map(i => `<li>⚠️ ${i}</li>`).join('')}
          </ul>
        ` : ''}
        ${result.suggestions?.length ? `
          <h4 style="margin: 16px 0 8px;">建議：</h4>
          <ul class="sowork-suggestions-list">
            ${result.suggestions.map(s => `<li>💡 ${s}</li>`).join('')}
          </ul>
        ` : ''}
      `, [
        { text: '關閉', class: 'secondary', action: closePopup },
        { text: 'AI 改寫', class: 'primary', action: () => { closePopup(); handleAiRewrite(); } },
      ]);
    } catch (error) {
      showPopup('錯誤', `<p>品牌檢查失敗：${error.message}</p>`, [
        { text: '關閉', class: 'secondary', action: closePopup },
      ]);
    }
  }

  // AI 改寫
  async function handleAiRewrite() {
    if (!state.selectedElement || !state.brandBook) return;
    
    const originalText = state.selectedElement.textContent;
    
    // 顯示載入中
    showPopup('AI 改寫中...', '<div class="sowork-loading"><div class="sowork-spinner"></div></div>');
    
    try {
      const result = await aiRewrite(originalText, state.brandBook.id);
      
      showPopup('AI 改寫建議', `
        <div style="margin-bottom: 16px;">
          <h4 style="margin: 0 0 8px; color: #888;">原文：</h4>
          <p style="padding: 12px; background: rgba(239, 68, 68, 0.1); border-radius: 8px; margin: 0;">${originalText}</p>
        </div>
        <div style="margin-bottom: 16px;">
          <h4 style="margin: 0 0 8px; color: #22c55e;">改寫後：</h4>
          <p style="padding: 12px; background: rgba(34, 197, 94, 0.1); border-radius: 8px; margin: 0;">${result.rewrittenText}</p>
        </div>
        <div>
          <h4 style="margin: 0 0 8px; color: #888;">改寫理由：</h4>
          <p style="font-size: 14px; color: #888; margin: 0;">${result.reasoning}</p>
        </div>
      `, [
        { text: '取消', class: 'secondary', action: closePopup },
        { text: '套用改寫', class: 'success', action: () => {
          state.selectedElement.textContent = result.rewrittenText;
          state.selectedElement.classList.add('modified');
          
          const selector = getUniqueSelector(state.selectedElement);
          const existingIndex = state.changes.findIndex(c => c.selector === selector);
          
          if (existingIndex >= 0) {
            state.changes[existingIndex].newText = result.rewrittenText;
          } else {
            state.changes.push({
              selector,
              element: state.selectedElement,
              originalText,
              newText: result.rewrittenText,
              contentType: state.selectedElement.tagName.toLowerCase(),
            });
          }
          
          updateChangesList();
          closePopup();
          showToast('已套用 AI 改寫');
        }},
      ]);
    } catch (error) {
      showPopup('錯誤', `<p>AI 改寫失敗：${error.message}</p>`, [
        { text: '關閉', class: 'secondary', action: closePopup },
      ]);
    }
  }

  // 儲存變更
  async function handleSave() {
    if (state.changes.length === 0) return;
    
    try {
      if (state.config.onSave) {
        await state.config.onSave(state.changes.map(c => ({
          selector: c.selector,
          originalText: c.originalText,
          newText: c.newText,
          contentType: c.contentType,
        })));
      }
      
      // 更新原始內容
      state.changes.forEach(change => {
        state.originalContent.set(change.element, change.newText);
        change.element.classList.remove('modified');
      });
      
      state.changes = [];
      updateChangesList();
      showToast('變更已儲存');
    } catch (error) {
      showToast('儲存失敗：' + error.message, 'error');
    }
  }

  // 彈窗
  function showPopup(title, content, actions = []) {
    closePopup();
    
    const overlay = document.createElement('div');
    overlay.className = 'sowork-overlay';
    overlay.id = 'sowork-overlay';
    overlay.addEventListener('click', closePopup);
    
    const popup = document.createElement('div');
    popup.className = 'sowork-popup';
    popup.id = 'sowork-popup';
    popup.innerHTML = `
      <h3>${title}</h3>
      <div class="sowork-popup-content">${content}</div>
      <div class="sowork-popup-actions">
        ${actions.map((a, i) => `
          <button class="sowork-toolbar-btn ${a.class}" data-action="${i}">${a.text}</button>
        `).join('')}
      </div>
    `;
    
    popup.querySelectorAll('[data-action]').forEach((btn, i) => {
      btn.addEventListener('click', actions[i].action);
    });
    
    document.body.appendChild(overlay);
    document.body.appendChild(popup);
  }

  function closePopup() {
    document.getElementById('sowork-overlay')?.remove();
    document.getElementById('sowork-popup')?.remove();
  }

  // 退出編輯模式
  function exitEditMode() {
    if (state.changes.length > 0) {
      if (!confirm('您有未儲存的變更，確定要退出嗎？')) {
        return;
      }
    }
    
    // 還原所有變更
    state.changes.forEach(change => {
      change.element.textContent = change.originalText;
      change.element.classList.remove('modified');
    });
    
    // 移除編輯功能
    document.querySelectorAll('.sowork-editable').forEach(el => {
      el.classList.remove('sowork-editable', 'editing', 'modified');
      el.contentEditable = 'false';
      el.removeEventListener('click', handleElementClick);
    });
    
    // 移除 UI
    document.getElementById('sowork-toolbar')?.remove();
    document.getElementById('sowork-sidebar')?.remove();
    
    // 重置狀態
    state.isEditMode = false;
    state.changes = [];
    state.selectedElement = null;
    state.originalContent.clear();
    
    // 移除 URL 參數
    const url = new URL(window.location.href);
    url.searchParams.delete('sowork_edit');
    url.searchParams.delete('token');
    window.history.replaceState({}, '', url);
  }

  // 初始化
  async function init(config) {
    state.config = {
      apiEndpoint: '',
      brandBookId: null,
      onSave: null,
      ...config,
    };
    
    // 檢查 URL 參數
    const urlParams = new URLSearchParams(window.location.search);
    const isEditMode = urlParams.get('sowork_edit') === 'true';
    const token = urlParams.get('token');
    
    if (!isEditMode || !token) {
      console.log('SoWork Editor: Not in edit mode');
      return;
    }
    
    // 驗證 Token
    const tokenResult = await verifyToken(token);
    if (!tokenResult.valid) {
      alert('編輯連結無效或已過期，請重新生成');
      return;
    }
    
    state.token = token;
    state.brandBook = tokenResult.brandBook;
    state.isEditMode = true;
    
    // 注入樣式
    injectStyles();
    
    // 建立 UI
    createToolbar();
    createSidebar();
    updateBrandInfo();
    
    // 啟用編輯功能
    makeEditable();
    
    console.log('SoWork Editor: Initialized successfully');
  }

  // 導出 API
  window.SoworkEditor = {
    init,
    getChanges: () => state.changes,
    save: handleSave,
    exit: exitEditMode,
  };

})(window);
