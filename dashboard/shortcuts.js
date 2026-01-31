/**
 * clawVERSE Dashboard - 快捷键系统
 * 支持全局快捷键、页面导航、操作快捷键、搜索快捷键
 */

// 快捷键管理器
class ShortcutManager {
    constructor() {
        this.shortcuts = new Map();
        this.isHelpVisible = false;
        this.isSettingsVisible = false;
        this.modifier = navigator.platform.indexOf('Mac') >= 0 ? 'Cmd' : 'Ctrl';
        
        this.init();
    }

    init() {
        this.registerDefaultShortcuts();
        this.bindEvents();
        this.createHelpModal();
        this.createSettingsPanel();
        this.createSearchModal();
    }

    // 注册默认快捷键
    registerDefaultShortcuts() {
        // 全局快捷键
        this.register('?', {
            description: '显示/隐藏帮助',
            category: '全局',
            action: () => this.toggleHelp()
        });

        this.register('Escape', {
            description: '关闭模态框/搜索/帮助',
            category: '全局',
            action: () => this.handleEscape()
        });

        this.register(`${this.modifier}+S`, {
            description: '保存当前设置',
            category: '操作',
            action: () => this.saveCurrentSettings()
        });

        this.register(`${this.modifier}+K`, {
            description: '打开搜索',
            category: '搜索',
            action: () => this.openSearch()
        });

        this.register(`${this.modifier}+/`, {
            description: '显示/隐藏帮助',
            category: '全局',
            action: () => this.toggleHelp()
        });

        // 页面导航快捷键 (g + key)
        this.register('g d', {
            description: '跳转到 Dashboard',
            category: '导航',
            action: () => this.navigateTo('dashboard')
        });

        this.register('g a', {
            description: '跳转到 Agent 议会',
            category: '导航',
            action: () => this.navigateTo('agents')
        });

        this.register('g m', {
            description: '跳转到民主讨论',
            category: '导航',
            action: () => this.navigateTo('democracy')
        });

        this.register('g c', {
            description: '跳转到开发团队',
            category: '导航',
            action: () => this.navigateTo('console')
        });

        this.register('g l', {
            description: '跳转到操作日志',
            category: '导航',
            action: () => this.navigateTo('logs')
        });

        this.register('g s', {
            description: '跳转到设置中心',
            category: '导航',
            action: () => this.navigateTo('settings')
        });

        // 操作快捷键
        this.register(`${this.modifier}+N`, {
            description: '新建项目/任务',
            category: '操作',
            action: () => this.createNew()
        });

        this.register(`${this.modifier}+R`, {
            description: '刷新数据',
            category: '操作',
            action: () => this.refreshData()
        });

        this.register(`${this.modifier}+,`, {
            description: '打开设置',
            category: '操作',
            action: () => this.openSettings()
        });

        this.register('h', {
            description: '显示历史记录',
            category: '操作',
            action: () => this.showHistory()
        });

        this.register('f', {
            description: '聚焦搜索框',
            category: '搜索',
            action: () => this.openSearch()
        });

        // 通知快捷键
        this.register(`${this.modifier}+Shift+N`, {
            description: '查看通知',
            category: '通知',
            action: () => this.showNotifications()
        });

        // 主题切换
        this.register(`${this.modifier}+T`, {
            description: '切换主题',
            category: '操作',
            action: () => this.toggleTheme()
        });
    }

    // 注册快捷键
    register(key, options) {
        this.shortcuts.set(key.toLowerCase(), {
            key: key,
            ...options
        });
    }

    // 绑定事件
    bindEvents() {
        document.addEventListener('keydown', (e) => {
            this.handleKeydown(e);
        });
    }

    // 处理键盘事件
    handleKeydown(e) {
        // 忽略输入框中的快捷键（除了 Ctrl+K）
        const isInput = e.target.tagName === 'INPUT' || 
                       e.target.tagName === 'TEXTAREA' ||
                       e.target.contentEditable === 'true';

        if (isInput && e.key !== 'Escape') {
            return;
        }

        // 构建当前按下的键组合
        let combo = '';
        
        if (e.ctrlKey || e.metaKey) {
            combo += 'ctrl+';
        }
        if (e.shiftKey) {
            combo += 'shift+';
        }
        if (e.altKey) {
            combo += 'alt+';
        }
        
        combo += e.key.toLowerCase();

        // 处理两键组合 (g + key)
        if (e.key.toLowerCase() === 'g' && !combo.includes('ctrl+') && !combo.includes('alt+')) {
            this.waitingForSecondKey = true;
            setTimeout(() => {
                this.waitingForSecondKey = false;
            }, 500);
            return;
        }

        if (this.waitingForSecondKey && !e.ctrlKey && !e.altKey) {
            const gCombo = 'g+' + e.key.toLowerCase();
            if (this.shortcuts.has(gCombo)) {
                e.preventDefault();
                this.waitingForSecondKey = false;
                this.shortcuts.get(gCombo).action();
                return;
            }
        }

        // 检查普通快捷键
        if (this.shortcuts.has(combo)) {
            e.preventDefault();
            this.shortcuts.get(combo).action();
        }

        // 单键快捷键
        if (!combo.includes('ctrl+') && !combo.includes('alt+') && !combo.includes('shift+')) {
            const singleKey = e.key.toLowerCase();
            if (this.shortcuts.has(singleKey) && singleKey !== 'g') {
                e.preventDefault();
                this.shortcuts.get(singleKey).action();
            }
        }
    }

    // 处理 Escape 键
    handleEscape() {
        if (this.isHelpVisible) {
            this.hideHelp();
        } else if (this.isSettingsVisible) {
            this.hideSettings();
        } else if (this.searchModal && this.searchModal.style.display === 'block') {
            this.hideSearch();
        }
    }

    // 切换帮助面板
    toggleHelp() {
        if (this.isHelpVisible) {
            this.hideHelp();
        } else {
            this.showHelp();
        }
    }

    showHelp() {
        this.isHelpVisible = true;
        this.createHelpModal();
        document.body.appendChild(this.helpModal);
        setTimeout(() => {
            this.helpModal.classList.add('visible');
        }, 10);
    }

    hideHelp() {
        this.isHelpVisible = false;
        if (this.helpModal) {
            this.helpModal.classList.remove('visible');
            setTimeout(() => {
                if (this.helpModal.parentNode) {
                    this.helpModal.parentNode.removeChild(this.helpModal);
                }
            }, 300);
        }
    }

    // 创建帮助模态框
    createHelpModal() {
        if (this.helpModal) return;

        this.helpModal = document.createElement('div');
        this.helpModal.className = 'shortcut-modal';
        this.helpModal.innerHTML = `
            <div class="shortcut-modal-content">
                <div class="shortcut-modal-header">
                    <h2>⌨️ 快捷键帮助</h2>
                    <button class="shortcut-close" onclick="shortcutManager.hideHelp()">×</button>
                </div>
                <div class="shortcut-modal-body">
                    ${this.generateHelpContent()}
                </div>
                <div class="shortcut-modal-footer">
                    <span>按 <kbd>?</kbd> 或 <kbd>${this.modifier}+/</kbd> 关闭</span>
                </div>
            </div>
        `;

        // 点击背景关闭
        this.helpModal.addEventListener('click', (e) => {
            if (e.target === this.helpModal) {
                this.hideHelp();
            }
        });
    }

    // 生成帮助内容
    generateHelpContent() {
        const categories = {};
        
        this.shortcuts.forEach((value, key) => {
            if (!categories[value.category]) {
                categories[value.category] = [];
            }
            categories[value.category].push({ key, ...value });
        });

        let html = '';
        const categoryNames = {
            '全局': '🌐 全局快捷键',
            '导航': '🧭 页面导航 (按 g 再按其他键)',
            '搜索': '🔍 搜索快捷键',
            '操作': '⚡ 操作快捷键',
            '通知': '🔔 通知快捷键'
        };

        for (const [category, items] of Object.entries(categories)) {
            html += `
                <div class="shortcut-category">
                    <h3>${categoryNames[category] || category}</h3>
                    <div class="shortcut-list">
                        ${items.map(item => `
                            <div class="shortcut-item">
                                <kbd>${this.formatKey(item.key)}</kbd>
                                <span class="shortcut-desc">${item.description}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        return html;
    }

    // 格式化键名显示
    formatKey(key) {
        return key.toUpperCase()
            .replace('CTRL+', 'Ctrl+')
            .replace('CMD+', 'Cmd+')
            .replace('SHIFT+', 'Shift+')
            .replace('ALT+', 'Alt+')
            .replace('+', ' + ');
    }

    // 导航功能
    navigateTo(page) {
        const pageMap = {
            'dashboard': '/dashboard/',
            'agents': '/dashboard/agents',
            'democracy': '/dashboard/democracy',
            'console': '/dashboard/console',
            'logs': '/dashboard/logs',
            'settings': '/dashboard/settings'
        };

        if (pageMap[page]) {
            window.location.href = pageMap[page];
        }
    }

    // 保存设置
    saveCurrentSettings() {
        // 触发保存事件
        const event = new CustomEvent('shortcutSave');
        document.dispatchEvent(event);
        
        this.showNotification('💾 设置已保存', 'success');
    }

    // 打开搜索
    openSearch() {
        this.showSearchModal();
    }

    // 刷新数据
    refreshData() {
        const event = new CustomEvent('shortcutRefresh');
        document.dispatchEvent(event);
        
        this.showNotification('🔄 数据已刷新', 'success');
    }

    // 打开设置
    openSettings() {
        this.toggleSettings();
    }

    // 切换主题
    toggleTheme() {
        const event = new CustomEvent('shortcutToggleTheme');
        document.dispatchEvent(event);
    }

    // 新建项目
    createNew() {
        const event = new CustomEvent('shortcutCreateNew');
        document.dispatchEvent(event);
        this.showNotification('📝 新建项目/任务', 'info');
    }

    // 显示历史记录
    showHistory() {
        const event = new CustomEvent('shortcutShowHistory');
        document.dispatchEvent(event);
    }

    // 显示通知
    showNotifications() {
        const event = new CustomEvent('shortcutShowNotifications');
        document.dispatchEvent(event);
    }

    // 设置面板
    toggleSettings() {
        if (this.isSettingsVisible) {
            this.hideSettings();
        } else {
            this.showSettings();
        }
    }

    showSettings() {
        this.isSettingsVisible = true;
        this.createSettingsPanel();
        document.body.appendChild(this.settingsPanel);
        setTimeout(() => {
            this.settingsPanel.classList.add('visible');
        }, 10);
    }

    hideSettings() {
        this.isSettingsVisible = false;
        if (this.settingsPanel) {
            this.settingsPanel.classList.remove('visible');
            setTimeout(() => {
                if (this.settingsPanel.parentNode) {
                    this.settingsPanel.parentNode.removeChild(this.settingsPanel);
                }
            }, 300);
        }
    }

    // 创建设置面板
    createSettingsPanel() {
        if (this.settingsPanel) return;

        this.settingsPanel = document.createElement('div');
        this.settingsPanel.className = 'shortcut-modal';
        this.settingsPanel.innerHTML = `
            <div class="shortcut-modal-content settings-panel">
                <div class="shortcut-modal-header">
                    <h2>⚙️ 快捷键设置</h2>
                    <button class="shortcut-close" onclick="shortcutManager.hideSettings()">×</button>
                </div>
                <div class="shortcut-modal-body">
                    <div class="settings-section">
                        <h3>启用快捷键</h3>
                        <label class="toggle">
                            <input type="checkbox" id="enableShortcuts" checked>
                            <span class="toggle-slider"></span>
                            <span class="toggle-label">启用全局快捷键</span>
                        </label>
                    </div>
                    <div class="settings-section">
                        <h3>音效反馈</h3>
                        <label class="toggle">
                            <input type="checkbox" id="enableSound" checked>
                            <span class="toggle-slider"></span>
                            <span class="toggle-label">启用按键音效</span>
                        </label>
                    </div>
                    <div class="settings-section">
                        <h3>视觉反馈</h3>
                        <label class="toggle">
                            <input type="checkbox" id="enableVisual" checked>
                            <span class="toggle-slider"></span>
                            <span class="toggle-label">启用按键动画</span>
                        </label>
                    </div>
                    <div class="settings-section">
                        <h3>重置快捷键</h3>
                        <button class="btn-reset" onclick="shortcutManager.resetShortcuts()">
                            🔄 恢复默认设置
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.settingsPanel.addEventListener('click', (e) => {
            if (e.target === this.settingsPanel) {
                this.hideSettings();
            }
        });
    }

    // 搜索功能
    showSearchModal() {
        this.createSearchModal();
        document.body.appendChild(this.searchModal);
        this.searchInput.focus();
        setTimeout(() => {
            this.searchModal.classList.add('visible');
        }, 10);
    }

    hideSearch() {
        if (this.searchModal) {
            this.searchModal.classList.remove('visible');
            setTimeout(() => {
                if (this.searchModal.parentNode) {
                    this.searchModal.parentNode.removeChild(this.searchModal);
                }
            }, 300);
        }
    }

    createSearchModal() {
        if (this.searchModal) return;

        this.searchModal = document.createElement('div');
        this.searchModal.className = 'shortcut-modal';
        this.searchModal.innerHTML = `
            <div class="shortcut-modal-content search-modal">
                <div class="search-container">
                    <input type="text" 
                           id="shortcutSearchInput" 
                           placeholder="🔍 搜索功能、页面或操作..."
                           autocomplete="off">
                    <div class="search-results" id="searchResults"></div>
                </div>
                <div class="search-footer">
                    <span><kbd>↑</kbd> <kbd>↓</kbd> 导航</span>
                    <span><kbd>Enter</kbd> 确认</span>
                    <span><kbd>Esc</kbd> 关闭</span>
                </div>
            </div>
        `;

        this.searchInput = this.searchModal.querySelector('#shortcutSearchInput');
        this.searchResults = this.searchModal.querySelector('#searchResults');

        // 搜索事件
        this.searchInput.addEventListener('input', (e) => {
            this.performSearch(e.target.value);
        });

        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideSearch();
            } else if (e.key === 'Enter') {
                this.selectFirstResult();
            }
        });

        this.searchModal.addEventListener('click', (e) => {
            if (e.target === this.searchModal) {
                this.hideSearch();
            }
        });
    }

    performSearch(query) {
        if (!query.trim()) {
            this.searchResults.innerHTML = '';
            return;
        }

        const results = [];
        this.shortcuts.forEach((value, key) => {
            if (key.includes(query.toLowerCase()) || 
                value.description.toLowerCase().includes(query.toLowerCase()) ||
                value.category.toLowerCase().includes(query.toLowerCase())) {
                results.push({ key, ...value });
            }
        });

        if (results.length > 0) {
            this.searchResults.innerHTML = results.map(item => `
                <div class="search-result-item" data-key="${item.key}">
                    <kbd>${this.formatKey(item.key)}</kbd>
                    <span class="result-desc">${item.description}</span>
                    <span class="result-category">${item.category}</span>
                </div>
            `).join('');
        } else {
            this.searchResults.innerHTML = '<div class="no-results">未找到结果</div>';
        }
    }

    selectFirstResult() {
        const first = this.searchResults.querySelector('.search-result-item');
        if (first) {
            const key = first.dataset.key;
            this.shortcuts.get(key)?.action();
            this.hideSearch();
        }
    }

    // 显示通知
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `shortcut-notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 2000);
    }

    // 重置设置
    resetShortcuts() {
        localStorage.removeItem('shortcutSettings');
        this.showNotification('🔄 快捷键设置已重置', 'success');
    }
}

// 创建全局实例
const shortcutManager = new ShortcutManager();

// 导出供外部使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ShortcutManager, shortcutManager };
}

// 添加样式
const shortcutStyles = document.createElement('style');
shortcutStyles.textContent = `
    /* 快捷键模态框样式 */
    .shortcut-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
        backdrop-filter: blur(4px);
    }

    .shortcut-modal.visible {
        opacity: 1;
    }

    .shortcut-modal-content {
        background: var(--bg-primary, #1a1a2e);
        border-radius: 16px;
        max-width: 600px;
        max-height: 80vh;
        width: 90%;
        overflow: hidden;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        border: 1px solid var(--border-color, #333);
        transform: scale(0.9);
        transition: transform 0.3s ease;
    }

    .shortcut-modal.visible .shortcut-modal-content {
        transform: scale(1);
    }

    .shortcut-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        border-bottom: 1px solid var(--border-color, #333);
        background: var(--bg-secondary, #16213e);
    }

    .shortcut-modal-header h2 {
        margin: 0;
        font-size: 1.5em;
        color: var(--text-primary, #fff);
    }

    .shortcut-close {
        background: none;
        border: none;
        font-size: 2em;
        cursor: pointer;
        color: var(--text-secondary, #aaa);
        padding: 0;
        line-height: 1;
        transition: color 0.2s;
    }

    .shortcut-close:hover {
        color: var(--text-primary, #fff);
    }

    .shortcut-modal-body {
        padding: 20px;
        overflow-y: auto;
        max-height: calc(80vh - 140px);
        color: var(--text-primary, #fff);
    }

    .shortcut-modal-footer {
        padding: 15px 20px;
        border-top: 1px solid var(--border-color, #333);
        text-align: center;
        color: var(--text-secondary, #aaa);
        font-size: 0.9em;
    }

    .shortcut-category {
        margin-bottom: 20px;
    }

    .shortcut-category h3 {
        margin: 0 0 10px 0;
        font-size: 1em;
        color: var(--accent-color, #00d4ff);
        padding-bottom: 8px;
        border-bottom: 1px solid var(--border-color, #333);
    }

    .shortcut-list {
        display: grid;
        gap: 8px;
    }

    .shortcut-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 12px;
        background: var(--bg-tertiary, #0f0f23);
        border-radius: 8px;
    }

    .shortcut-item kbd {
        background: var(--bg-secondary, #16213e);
        padding: 4px 10px;
        border-radius: 4px;
        font-family: monospace;
        font-size: 0.9em;
        color: var(--accent-color, #00d4ff);
        border: 1px solid var(--border-color, #333);
        min-width: 60px;
        text-align: center;
    }

    .shortcut-desc {
        flex: 1;
        color: var(--text-primary, #fff);
    }

    /* 设置面板样式 */
    .settings-section {
        margin-bottom: 24px;
    }

    .settings-section h3 {
        margin: 0 0 12px 0;
        font-size: 1em;
        color: var(--text-primary, #fff);
    }

    .toggle {
        display: flex;
        align-items: center;
        gap: 12px;
        cursor: pointer;
    }

    .toggle input {
        display: none;
    }

    .toggle-slider {
        width: 48px;
        height: 24px;
        background: var(--bg-tertiary, #333);
        border-radius: 24px;
        position: relative;
        transition: background 0.3s;
    }

    .toggle-slider::after {
        content: '';
        position: absolute;
        width: 20px;
        height: 20px;
        background: #fff;
        border-radius: 50%;
        top: 2px;
        left: 2px;
        transition: transform 0.3s;
    }

    .toggle input:checked + .toggle-slider {
        background: var(--accent-color, #00d4ff);
    }

    .toggle input:checked + .toggle-slider::after {
        transform: translateX(24px);
    }

    .toggle-label {
        color: var(--text-primary, #fff);
    }

    .btn-reset {
        background: var(--bg-secondary, #16213e);
        border: 1px solid var(--border-color, #333);
        color: var(--text-primary, #fff);
        padding: 10px 20px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
    }

    .btn-reset:hover {
        background: var(--accent-color, #00d4ff);
        color: #000;
    }

    /* 搜索模态框样式 */
    .search-modal {
        max-width: 500px;
    }

    .search-container {
        padding: 0;
    }

    .search-container input {
        width: 100%;
        padding: 16px 20px;
        font-size: 1.1em;
        border: none;
        border-bottom: 1px solid var(--border-color, #333);
        background: var(--bg-primary, #1a1a2e);
        color: var(--text-primary, #fff);
        outline: none;
        box-sizing: border-box;
    }

    .search-results {
        max-height: 300px;
        overflow-y: auto;
    }

    .search-result-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 20px;
        cursor: pointer;
        transition: background 0.2s;
        border-bottom: 1px solid var(--border-color, #222);
    }

    .search-result-item:hover,
    .search-result-item:focus {
        background: var(--bg-secondary, #16213e);
        outline: none;
    }

    .search-result-item kbd {
        background: var(--bg-tertiary, #0f0f23);
        padding: 4px 8px;
        border-radius: 4px;
        font-family: monospace;
        font-size: 0.85em;
        color: var(--accent-color, #00d4ff);
        min-width: 50px;
        text-align: center;
    }

    .result-desc {
        flex: 1;
        color: var(--text-primary, #fff);
    }

    .result-category {
        font-size: 0.8em;
        color: var(--text-secondary, #aaa);
        background: var(--bg-tertiary, #0f0f23);
        padding: 2px 8px;
        border-radius: 4px;
    }

    .search-footer {
        display: flex;
        justify-content: center;
        gap: 20px;
        padding: 12px;
        background: var(--bg-secondary, #16213e);
        color: var(--text-secondary, #aaa);
        font-size: 0.85em;
    }

    .search-footer kbd {
        background: var(--bg-tertiary, #0f0f23);
        padding: 2px 6px;
        border-radius: 3px;
        font-family: monospace;
    }

    .no-results {
        padding: 20px;
        text-align: center;
        color: var(--text-secondary, #aaa);
    }

    /* 通知样式 */
    .shortcut-notification {
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        padding: 12px 24px;
        border-radius: 8px;
        background: var(--bg-secondary, #16213e);
        color: var(--text-primary, #fff);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        z-index: 10001;
        transition: transform 0.3s ease, opacity 0.3s ease;
        opacity: 1;
    }

    .shortcut-notification.visible {
        transform: translateX(-50%) translateY(0);
    }

    .shortcut-notification.fade-out {
        opacity: 0;
        transform: translateX(-50%) translateY(-20px);
    }

    .shortcut-notification.success {
        border-left: 4px solid #10b981;
    }

    .shortcut-notification.error {
        border-left: 4px solid #ef4444;
    }

    .shortcut-notification.info {
        border-left: 4px solid #3b82f6;
    }

    /* 响应式 */
    @media (max-width: 768px) {
        .shortcut-modal-content {
            width: 95%;
            max-height: 90vh;
        }
        
        .shortcut-item {
            flex-wrap: wrap;
        }
        
        .shortcut-desc {
            width: 100%;
            margin-top: 4px;
        }
    }
`;

// 添加样式到页面
document.head.appendChild(shortcutStyles);

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('⌨️ 快捷键系统已加载 - 按 ? 查看帮助');
});
