/**
 * AI Chat Module - clawVERSE Dashboard
 * AI 对话集成模块
 * 
 * 功能：
 * - AI 助手聊天窗口
 * - 自然语言查询
 * - 智能建议
 * - 命令执行
 */

(function(global) {
    'use strict';

    // AI Chat 配置
    const AI_CHAT_CONFIG = {
        endpoint: '/api/ai/chat',
        suggestionsEndpoint: '/api/ai/suggestions',
        commandsEndpoint: '/api/ai/commands',
        maxMessages: 50,
        typingSpeed: 30,
        autoScroll: true,
        theme: {
            primary: '#6366f1',
            secondary: '#8b5cf6',
            background: '#1e1e2e',
            userMessage: '#3b82f6',
            aiMessage: '#1e293b'
        }
    };

    // AI 命令映射
    const AI_COMMANDS = {
        'help': { handler: 'showHelp', description: '显示帮助信息' },
        'status': { handler: 'showStatus', description: '显示系统状态' },
        'search': { handler: 'performSearch', description: '执行搜索' },
        'export': { handler: 'exportData', description: '导出数据' },
        'theme': { handler: 'toggleTheme', description: '切换主题' },
        'stats': { handler: 'showStats', description: '显示统计信息' },
        'clear': { handler: 'clearChat', description: '清空对话' },
        'navigate': { handler: 'navigate', description: '导航到页面' }
    };

    // 智能建议模板
    const SUGGESTION_TEMPLATES = [
        '查看系统状态',
        '搜索最近的日志',
        '导出数据报表',
        '切换主题模式',
        '显示用户统计'
    ];

    /**
     * AI Chat 类
     */
    class AIChat {
        constructor(containerId) {
            this.container = document.getElementById(containerId);
            if (!this.container) {
                console.error(`AI Chat container #${containerId} not found`);
                return;
            }
            this.messages = [];
            this.isProcessing = false;
            this.conversationId = this.generateId();
            this.init();
        }

        /**
         * 初始化 AI 聊天界面
         */
        init() {
            this.renderContainer();
            this.bindEvents();
            this.loadWelcomeMessage();
            this.loadSuggestions();
        }

        /**
         * 渲染聊天容器
         */
        renderContainer() {
            this.container.innerHTML = `
                <div class="ai-chat-widget" id="ai-chat-widget">
                    <!-- 聊天头部 -->
                    <div class="ai-chat-header">
                        <div class="ai-header-info">
                            <div class="ai-avatar">
                                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                </svg>
                            </div>
                            <div class="ai-header-text">
                                <span class="ai-name">AI 助手</span>
                                <span class="ai-status">在线</span>
                            </div>
                        </div>
                        <div class="ai-header-actions">
                            <button class="ai-btn-icon" id="ai-clear-btn" title="清空对话">
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                </svg>
                            </button>
                            <button class="ai-btn-icon" id="ai-close-btn" title="关闭">
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <!-- 聊天消息区域 -->
                    <div class="ai-messages" id="ai-messages">
                        <div class="ai-messages-content" id="ai-messages-content"></div>
                    </div>

                    <!-- 智能建议区域 -->
                    <div class="ai-suggestions" id="ai-suggestions">
                        <div class="ai-suggestions-title">💡 智能建议</div>
                        <div class="ai-suggestions-list" id="-list"></div>
ai-suggestions                    </div>

                    <!-- 输入区域 -->
                    <div class="ai-input-area">
                        <div class="ai-input-wrapper">
                            <textarea 
                                id="ai-input" 
                                placeholder="输入消息或命令... (输入 / 查看命令)"
                                rows="1"
                                maxlength="500"
                            ></textarea>
                            <button class="ai-send-btn" id="ai-send-btn">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                                </svg>
                            </button>
                        </div>
                        <div class="ai-input-hint">
                            <span>按 Enter 发送，Shift+Enter 换行</span>
                        </div>
                    </div>
                </div>

                <!-- 聊天按钮 -->
                <button class="ai-chat-toggle" id="ai-chat-toggle">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
                    </svg>
                </button>
            `;
        }

        /**
         * 绑定事件
         */
        bindEvents() {
            const input = document.getElementById('ai-input');
            const sendBtn = document.getElementById('ai-send-btn');
            const toggleBtn = document.getElementById('ai-chat-toggle');
            const closeBtn = document.getElementById('ai-close-btn');
            const clearBtn = document.getElementById('ai-clear-btn');
            const messagesContainer = document.getElementById('ai-messages');

            // 发送消息
            const sendMessage = () => this.sendMessage();
            
            sendBtn.addEventListener('click', sendMessage);
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                }
            });

            // 自动调整输入框高度
            input.addEventListener('input', () => {
                input.style.height = 'auto';
                input.style.height = Math.min(input.scrollHeight, 150) + 'px';
            });

            // 切换聊天窗口
            toggleBtn.addEventListener('click', () => this.toggleChat());
            closeBtn.addEventListener('click', () => this.toggleChat());
            clearBtn.addEventListener('click', () => this.clearChat());

            // 点击消息区域自动滚动到底部
            messagesContainer.addEventListener('scroll', () => {
                this.handleScroll(messagesContainer);
            });

            // 点击建议项
            document.getElementById('ai-suggestions-list').addEventListener('click', (e) => {
                if (e.target.classList.contains('ai-suggestion-item')) {
                    input.value = e.target.dataset.query;
                    this.sendMessage();
                }
            });
        }

        /**
         * 加载欢迎消息
         */
        loadWelcomeMessage() {
            const welcomeMessage = {
                id: this.generateId(),
                type: 'ai',
                content: `你好！我是 clawVERSE Dashboard 的 AI 助手。

我可以帮助你：
• 📊 查询系统状态和数据
• 🔍 执行搜索操作
• ⚡ 执行命令和操作
• 💡 提供智能建议

请告诉我你需要什么帮助！`,
                timestamp: Date.now()
            };
            this.addMessage(welcomeMessage);
        }

        /**
         * 加载智能建议
         */
        loadSuggestions() {
            const suggestionsList = document.getElementById('ai-suggestions-list');
            suggestionsList.innerHTML = '';

            SUGGESTION_TEMPLATES.forEach((suggestion, index) => {
                const item = document.createElement('div');
                item.className = 'ai-suggestion-item';
                item.dataset.query = suggestion;
                item.innerHTML = `
                    <span class="suggestion-icon">${this.getSuggestionIcon(index)}</span>
                    <span class="suggestion-text">${suggestion}</span>
                `;
                suggestionsList.appendChild(item);
            });
        }

        /**
         * 获取建议图标
         */
        getSuggestionIcon(index) {
            const icons = ['📊', '🔍', '📁', '🎨', '📈'];
            return icons[index % icons.length];
        }

        /**
         * 发送消息
         */
        async sendMessage() {
            const input = document.getElementById('ai-input');
            const content = input.value.trim();

            if (!content || this.isProcessing) return;

            // 检查是否是命令
            if (content.startsWith('/')) {
                this.handleCommand(content);
                input.value = '';
                return;
            }

            // 添加用户消息
            const userMessage = {
                id: this.generateId(),
                type: 'user',
                content: content,
                timestamp: Date.now()
            };
            this.addMessage(userMessage);
            input.value = '';
            input.style.height = 'auto';

            // 处理 AI 响应
            this.isProcessing = true;
            await this.processAIResponse(content);
            this.isProcessing = false;
        }

        /**
         * 处理命令
         */
        handleCommand(command) {
            const args = command.slice(1).split(' ');
            const cmdName = args[0].toLowerCase();
            const cmdArgs = args.slice(1);

            const commandInfo = AI_COMMANDS[cmdName];
            
            if (commandInfo) {
                this.addMessage({
                    id: this.generateId(),
                    type: 'system',
                    content: `执行命令: /${cmdName}`,
                    timestamp: Date.now()
                });

                if (this[commandInfo.handler]) {
                    this[commandInfo.handler](cmdArgs);
                }
            } else {
                this.addMessage({
                    id: this.generateId(),
                    type: 'error',
                    content: `未知命令: /${cmdName}\n\n可用命令:\n${Object.entries(AI_COMMANDS).map(([key, val]) => `/${key} - ${val.description}`).join('\n')}`,
                    timestamp: Date.now()
                });
            }
        }

        /**
         * 处理 AI 响应
         */
        async processAIResponse(userMessage) {
            // 显示加载状态
            const loadingMessage = this.addMessage({
                id: this.generateId(),
                type: 'loading',
                content: '思考中...',
                timestamp: Date.now()
            });

            try {
                // 模拟 API 调用（实际项目中替换为真实 API）
                const response = await this.mockAIResponse(userMessage);
                
                // 移除加载消息
                this.removeMessage(loadingMessage);

                // 添加 AI 响应
                const aiMessage = {
                    id: this.generateId(),
                    type: 'ai',
                    content: response.content,
                    actions: response.actions,
                    timestamp: Date.now()
                };
                this.addMessage(aiMessage);

            } catch (error) {
                this.removeMessage(loadingMessage);
                this.addMessage({
                    id: this.generateId(),
                    type: 'error',
                    content: `抱歉，发生了错误: ${error.message}`,
                    timestamp: Date.now()
                });
            }
        }

        /**
         * 模拟 AI 响应（实际项目中替换为真实 API 调用）
         */
        async mockAIResponse(message) {
            // 模拟延迟
            await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

            // 简单的响应逻辑
            const lowerMessage = message.toLowerCase();
            let response = {
                content: '',
                actions: []
            };

            if (lowerMessage.includes('状态') || lowerMessage.includes('status')) {
                response.content = `系统状态报告：

✅ 服务运行正常
📊 CPU 使用率: ${Math.floor(Math.random() * 30 + 20)}%
💾 内存使用: ${Math.floor(Math.random() * 40 + 30)}%
🌐 网络连接: 正常
📁 磁盘空间: ${Math.floor(Math.random() * 20 + 60)}% 可用`;
                response.actions = [{ label: '查看详情', handler: 'showDetails' }];
            } else if (lowerMessage.includes('搜索') || lowerMessage.includes('search')) {
                response.content = `我可以帮你搜索数据。请告诉我你想搜索什么？`;
                response.actions = [{ label: '高级搜索', handler: 'openSearch' }];
            } else if (lowerMessage.includes('导出') || lowerMessage.includes('export')) {
                response.content = `数据导出功能：

请选择导出格式：
• CSV 格式
• JSON 格式
• Excel 格式
• PDF 报告`;
                response.actions = [
                    { label: 'CSV', handler: 'exportCSV' },
                    { label: 'JSON', handler: 'exportJSON' },
                    { label: 'PDF', handler: 'exportPDF' }
                ];
            } else if (lowerMessage.includes('帮助') || lowerMessage.includes('help')) {
                response.content = `AI 助手使用指南：

🔹 输入自然语言描述你的需求
🔹 使用 / 命令执行特定操作
🔹 点击建议快速执行操作
🔹 点击操作按钮执行相应功能

可用命令：${Object.keys(AI_COMMANDS).map(c => `/${c}`).join(' ')}`;
            } else {
                response.content = `我理解你想说："${message}"

我目前可以帮你：
• 查询系统状态
• 执行搜索
• 导出数据
• 提供操作建议

请告诉我更多细节，我可以更好地帮助你！`;
            }

            return response;
        }

        /**
         * 添加消息到界面
         */
        addMessage(message) {
            this.messages.push(message);
            
            // 限制消息数量
            if (this.messages.length > AI_CHAT_CONFIG.maxMessages) {
                this.messages.shift();
            }

            const content = document.getElementById('ai-messages-content');
            const messageElement = this.createMessageElement(message);
            content.appendChild(messageElement);

            // 自动滚动到底部
            if (AI_CHAT_CONFIG.autoScroll) {
                this.scrollToBottom();
            }

            return message;
        }

        /**
         * 创建消息元素
         */
        createMessageElement(message) {
            const div = document.createElement('div');
            div.className = `ai-message ai-message-${message.type}`;
            div.dataset.id = message.id;

            let contentHtml = '';
            
            switch (message.type) {
                case 'user':
                    contentHtml = `
                        <div class="message-content">${this.escapeHtml(message.content)}</div>
                        <div class="message-time">${this.formatTime(message.timestamp)}</div>
                    `;
                    break;

                case 'ai':
                    contentHtml = `
                        <div class="message-avatar">
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                        </div>
                        <div class="message-content">${this.formatContent(message.content)}</div>
                        ${message.actions ? this.createActionsHtml(message.actions) : ''}
                        <div class="message-time">${this.formatTime(message.timestamp)}</div>
                    `;
                    break;

                case 'loading':
                    contentHtml = `
                        <div class="message-avatar">
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                        </div>
                        <div class="message-content">
                            <div class="typing-indicator">
                                <span></span><span></span><span></span>
                            </div>
                        </div>
                    `;
                    break;

                case 'system':
                case 'error':
                    contentHtml = `
                        <div class="message-content message-system">${this.escapeHtml(message.content)}</div>
                        <div class="message-time">${this.formatTime(message.timestamp)}</div>
                    `;
                    break;
            }

            div.innerHTML = contentHtml;

            // 绑定操作事件
            if (message.actions) {
                div.querySelectorAll('.action-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const actionHandler = btn.dataset.handler;
                        if (this.actionHandlers[actionHandler]) {
                            this.actionHandlers[actionHandler]();
                        }
                    });
                });
            }

            return div;
        }

        /**
         * 创建操作按钮 HTML
         */
        createActionsHtml(actions) {
            if (!actions || actions.length === 0) return '';
            
            return `
                <div class="message-actions">
                    ${actions.map(action => `
                        <button class="action-btn" data-handler="${action.handler}">
                            ${action.label}
                        </button>
                    `).join('')}
                </div>
            `;
        }

        /**
         * 操作处理器
         */
        actionHandlers = {
            showDetails: () => this.showSystemDetails(),
            openSearch: () => this.openAdvancedSearch(),
            exportCSV: () => this.exportData('csv'),
            exportJSON: () => this.exportData('json'),
            exportPDF: () => this.exportData('pdf')
        }

        /**
         * 显示系统详情
         */
        showSystemDetails() {
            this.addMessage({
                id: this.generateId(),
                type: 'system',
                content: '正在加载系统详情...',
                timestamp: Date.now()
            });
        }

        /**
         * 打开高级搜索
         */
        openAdvancedSearch() {
            if (typeof window.openSearchPanel === 'function') {
                window.openSearchPanel();
            } else {
                this.addMessage({
                    id: this.generateId(),
                    type: 'system',
                    content: '搜索面板功能尚未集成',
                    timestamp: Date.now()
                });
            }
        }

        /**
         * 导出数据
         */
        async exportData(format) {
            this.addMessage({
                id: this.generateId(),
                type: 'system',
                content: `正在导出 ${format.toUpperCase()} 格式数据...`,
                timestamp: Date.now()
            });

            // 模拟导出
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            this.addMessage({
                id: this.generateId(),
                type: 'ai',
                content: `✅ 数据导出完成！\n格式: ${format.toUpperCase()}\n\n注意：实际项目中这里会触发文件下载。`,
                timestamp: Date.now()
            });
        }

        /**
         * 格式化消息内容
         */
        formatContent(content) {
            // 转换换行符
            let formatted = this.escapeHtml(content);
            
            // 高亮代码块
            formatted = formatted.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
            
            // 高亮行内代码
            formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
            
            // 高亮列表
            formatted = formatted.replace(/^(\s*)([-*•]|\d+\.)/gm, '$1<span class="list-marker">$2</span>');
            
            return formatted.replace(/\n/g, '<br>');
        }

        /**
         * 移除消息
         */
        removeMessage(message) {
            const index = this.messages.findIndex(m => m.id === message.id);
            if (index > -1) {
                this.messages.splice(index, 1);
            }
            
            const element = document.querySelector(`[data-id="${message.id}"]`);
            if (element) {
                element.remove();
            }
        }

        /**
         * 清空对话
         */
        clearChat() {
            this.messages = [];
            document.getElementById('ai-messages-content').innerHTML = '';
            this.loadWelcomeMessage();
            this.conversationId = this.generateId();
        }

        /**
         * 切换聊天窗口显示
         */
        toggleChat() {
            const widget = document.getElementById('ai-chat-widget');
            const toggleBtn = document.getElementById('ai-chat-toggle');
            
            widget.classList.toggle('ai-chat-open');
            toggleBtn.style.display = widget.classList.contains('ai-chat-open') ? 'none' : 'flex';
        }

        /**
         * 滚动到底部
         */
        scrollToBottom() {
            const container = document.getElementById('ai-messages');
            container.scrollTop = container.scrollHeight;
        }

        /**
         * 处理滚动
         */
        handleScroll(container) {
            // 可以在这里添加"加载更多"功能
        }

        /**
         * 显示帮助
         */
        showHelp() {
            const helpContent = `
**AI 助手命令列表：**

| 命令 | 描述 |
|------|------|
| /help | 显示帮助信息 |
| /status | 显示系统状态 |
| /search | 执行搜索 |
| /export | 导出数据 |
| /theme | 切换主题 |
| /stats | 显示统计 |
| /clear | 清空对话 |
| /navigate | 导航到页面 |

**使用提示：**
- 直接输入自然语言描述需求
- 使用 / 开头的命令快速执行操作
- 点击建议项快速发起查询
            `;
            
            this.addMessage({
                id: this.generateId(),
                type: 'ai',
                content: helpContent,
                timestamp: Date.now()
            });
        }

        /**
         * 显示状态
         */
        showStatus() {
            this.addMessage({
                id: this.generateId(),
                type: 'ai',
                content: '正在获取系统状态...',
                timestamp: Date.now()
            });
            
            // 模拟获取状态
            setTimeout(() => {
                this.removeMessage(this.messages[this.messages.length - 1]);
                this.addMessage({
                    id: this.generateId(),
                    type: 'ai',
                    content: '✅ 系统运行正常\n\n详细状态信息将在实际集成时显示。',
                    timestamp: Date.now()
                });
            }, 500);
        }

        /**
         * 执行搜索
         */
        performSearch(args) {
            const query = args.join(' ');
            this.addMessage({
                id: this.generateId(),
                type: 'system',
                content: `搜索: ${query || '请输入搜索关键词'}`,
                timestamp: Date.now()
            });
        }

        /**
         * 导出数据
         */
        exportData(args) {
            const format = args[0] || 'csv';
            this.exportData(format);
        }

        /**
         * 切换主题
         */
        toggleTheme() {
            if (typeof window.toggleTheme === 'function') {
                window.toggleTheme();
                this.addMessage({
                    id: this.generateId(),
                    type: 'system',
                    content: '主题已切换',
                    timestamp: Date.now()
                });
            }
        }

        /**
         * 显示统计
         */
        showStats() {
            this.addMessage({
                id: this.generateId(),
                type: 'ai',
                content: '📊 统计信息：\n\n- 活跃用户: 1,234\n- 今日请求: 56,789\n- 成功率: 99.9%\n- 平均响应: 45ms',
                timestamp: Date.now()
            });
        }

        /**
         * 导航
         */
        navigate(args) {
            const page = args[0];
            if (page && typeof window.navigateTo === 'function') {
                window.navigateTo(page);
                this.addMessage({
                    id: this.generateId(),
                    type: 'system',
                    content: `正在导航到: ${page}`,
                    timestamp: Date.now()
                });
            } else {
                this.addMessage({
                    id: this.generateId(),
                    type: 'ai',
                    content: '可用页面:\n- 首页 (home)\n- 议会对 (agents)\n- 设置 (settings)',
                    timestamp: Date.now()
                });
            }
        }

        /**
         * 生成唯一 ID
         */
        generateId() {
            return 'msg_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
        }

        /**
         * 格式化时间
         */
        formatTime(timestamp) {
            const date = new Date(timestamp);
            return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        }

        /**
         * HTML 转义
         */
        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    }

    // 初始化 AI Chat
    function initAIChat() {
        // 检查是否已存在
        if (document.getElementById('ai-chat-container')) {
            return new AIChat('ai-chat-container');
        }
        return null;
    }

    // 导出到全局
    global.AIChat = AIChat;
    global.initAIChat = initAIChat;

    // 自动初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAIChat);
    } else {
        initAIChat();
    }

})(typeof window !== 'undefined' ? window : global);
