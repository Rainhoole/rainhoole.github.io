/**
 * clawVERSE Dashboard 实时数据模块
 * 支持 WebSocket 和 SSE 两种实时通信方式
 * 
 * 功能：
 * - Agent 状态实时同步
 * - 提案投票实时更新
 * - 通知推送
 * - 系统日志实时流
 */

(function(global) {
    'use strict';

    // 实时数据管理器
    const RealtimeManager = {
        // 配置
        config: {
            // WebSocket 服务器地址 (设为 null 则使用 SSE)
            wsUrl: null,
            // SSE 端点
            sseUrl: '/api/stream',
            // 心跳间隔 (毫秒)
            heartbeatInterval: 30000,
            // 重连延迟 (毫秒)
            reconnectDelay: 3000,
            // 最大重连次数
            maxReconnectAttempts: 10,
            // 使用 SSE 模式 (无 WebSocket 时自动降级)
            fallbackToSSE: true
        },

        // 状态
        state: {
            connected: false,
            connectionType: null,
            reconnectAttempts: 0,
            lastHeartbeat: null,
            eventSource: null,
            socket: null,
            subscriptions: new Map()
        },

        // 事件处理
        eventHandlers: {
            'agent:status': [],
            'proposal:vote': [],
            'proposal:update': [],
            'notification': [],
            'log:stream': [],
            'system:alert': [],
            'heartbeat': [],
            'connection:change': [],
            'error': []
        },

        /**
         * 初始化实时连接
         */
        init: function(options = {}) {
            // 合并配置
            Object.assign(this.config, options);

            // 优先尝试 WebSocket
            if (this.config.wsUrl) {
                this.connectWebSocket();
            } else {
                this.connectSSE();
            }

            // 启动心跳检测
            this.startHeartbeat();

            // 设置连接状态监听
            window.addEventListener('online', () => this.handleOnline());
            window.addEventListener('offline', () => this.handleOffline());

            console.log('[Realtime] 实时数据模块初始化完成');
            return this;
        },

        /**
         * 连接 WebSocket
         */
        connectWebSocket: function() {
            try {
                this.state.socket = new WebSocket(this.config.wsUrl);

                this.state.socket.onopen = () => {
                    console.log('[Realtime] WebSocket 连接成功');
                    this.state.connected = true;
                    this.state.connectionType = 'websocket';
                    this.state.reconnectAttempts = 0;
                    this.emit('connection:change', { connected: true, type: 'websocket' });
                };

                this.state.socket.onmessage = (event) => {
                    this.handleMessage(JSON.parse(event.data));
                };

                this.state.socket.onclose = (event) => {
                    console.log('[Realtime] WebSocket 连接关闭', event.code, event.reason);
                    this.state.connected = false;
                    this.state.connectionType = null;
                    this.emit('connection:change', { connected: false, type: 'websocket' });
                    
                    // 尝试重连或降级到 SSE
                    if (this.config.fallbackToSSE) {
                        this.scheduleReconnect('sse');
                    } else {
                        this.scheduleReconnect('websocket');
                    }
                };

                this.state.socket.onerror = (error) => {
                    console.error('[Realtime] WebSocket 错误:', error);
                    this.emit('error', { type: 'websocket', error });
                };

            } catch (error) {
                console.error('[Realtime] WebSocket 连接失败:', error);
                this.connectSSE();
            }
        },

        /**
         * 连接 SSE
         */
        connectSSE: function() {
            try {
                // 创建 EventSource
                const url = new URL(this.config.sseUrl, window.location.origin);
                url.searchParams.set('ts', Date.now());
                
                this.state.eventSource = new EventSource(url.toString());

                this.state.eventSource.onopen = () => {
                    console.log('[Realtime] SSE 连接成功');
                    this.state.connected = true;
                    this.state.connectionType = 'sse';
                    this.state.reconnectAttempts = 0;
                    this.emit('connection:change', { connected: true, type: 'sse' });
                };

                this.state.eventSource.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        this.handleMessage(data);
                    } catch (e) {
                        // 纯文本消息直接处理
                        this.handleMessage({ type: 'raw', data: event.data });
                    }
                };

                // 监听各类型事件
                const eventTypes = [
                    'agent:status', 'proposal:vote', 'proposal:update',
                    'notification', 'log:stream', 'system:alert', 'heartbeat'
                ];

                eventTypes.forEach(eventType => {
                    this.state.eventSource.addEventListener(eventType, (event) => {
                        try {
                            const data = JSON.parse(event.data);
                            this.handleEvent(eventType, data);
                        } catch (e) {
                            this.handleEvent(eventType, event.data);
                        }
                    });
                });

                this.state.eventSource.onerror = (error) => {
                    console.error('[Realtime] SSE 连接错误:', error);
                    this.state.connected = false;
                    this.emit('connection:change', { connected: false, type: 'sse' });
                    this.scheduleReconnect('sse');
                };

            } catch (error) {
                console.error('[Realtime] SSE 连接失败:', error);
                this.emit('error', { type: 'sse', error });
            }
        },

        /**
         * 调度重连
         */
        scheduleReconnect: function(type) {
            if (this.state.reconnectAttempts >= this.config.maxReconnectAttempts) {
                console.error('[Realtime] 达到最大重连次数');
                this.emit('error', { type: 'max_reconnect', attempts: this.state.reconnectAttempts });
                return;
            }

            this.state.reconnectAttempts++;
            const delay = this.config.reconnectDelay * this.state.reconnectAttempts;

            console.log(`[Realtime] ${delay}ms 后尝试重连 (${this.state.reconnectAttempts}/${this.config.maxReconnectAttempts})`);

            setTimeout(() => {
                if (type === 'sse') {
                    this.connectSSE();
                } else {
                    this.connectWebSocket();
                }
            }, delay);
        },

        /**
         * 处理消息
         */
        handleMessage: function(message) {
            if (message.type && this.eventHandlers[message.type]) {
                this.handleEvent(message.type, message.payload || message.data);
            } else if (message.event &&.data message) {
                // SSE 格式
                this.handleEvent(message.event, message.data);
            } else {
                console.warn('[Realtime] 未知消息格式:', message);
            }
        },

        /**
         * 处理事件
         */
        handleEvent: function(eventType, data) {
            const handlers = this.eventHandlers[eventType];
            if (handlers && handlers.length > 0) {
                handlers.forEach(handler => {
                    try {
                        handler(data);
                    } catch (error) {
                        console.error(`[Realtime] 事件处理器错误 [${eventType}]:`, error);
                    }
                });
            }
        },

        /**
         * 订阅事件
         */
        subscribe: function(eventType, handler) {
            if (!this.eventHandlers[eventType]) {
                this.eventHandlers[eventType] = [];
            }
            this.eventHandlers[eventType].push(handler);
            
            // 返回取消订阅函数
            return () => {
                const index = this.eventHandlers[eventType].indexOf(handler);
                if (index > -1) {
                    this.eventHandlers[eventType].splice(index, 1);
                }
            };
        },

        /**
         * 发送消息 (仅 WebSocket)
         */
        send: function(type, payload) {
            if (this.state.connectionType === 'websocket' && this.state.socket) {
                this.state.socket.send(JSON.stringify({ type, payload, timestamp: Date.now() }));
            } else {
                console.warn('[Realtime] WebSocket 未连接，无法发送消息');
            }
        },

        /**
         * 启动心跳
         */
        startHeartbeat: function() {
            setInterval(() => {
                if (this.state.connected) {
                    this.state.lastHeartbeat = Date.now();
                    
                    // 发送心跳 (WebSocket)
                    if (this.state.connectionType === 'websocket') {
                        this.send('ping', { ts: this.state.lastHeartbeat });
                    }
                    
                    this.emit('heartbeat', { ts: this.state.lastHeartbeat });
                }
            }, this.config.heartbeatInterval);
        },

        /**
         * 处理在线
         */
        handleOnline: function() {
            console.log('[Realtime] 网络恢复');
            if (!this.state.connected) {
                if (this.config.wsUrl) {
                    this.connectWebSocket();
                } else {
                    this.connectSSE();
                }
            }
        },

        /**
         * 处理离线
         */
        handleOffline: function() {
            console.log('[Realtime] 网络断开');
            this.state.connected = false;
            this.emit('connection:change', { connected: false, type: 'offline' });
        },

        /**
         * 发射事件
         */
        emit: function(eventType, data) {
            this.handleEvent(eventType, data);
        },

        /**
         * 获取连接状态
         */
        getStatus: function() {
            return {
                connected: this.state.connected,
                type: this.state.connectionType,
                reconnectAttempts: this.state.reconnectAttempts,
                lastHeartbeat: this.state.lastHeartbeat
            };
        },

        /**
         * 断开连接
         */
        disconnect: function() {
            if (this.state.socket) {
                this.state.socket.close();
                this.state.socket = null;
            }
            if (this.state.eventSource) {
                this.state.eventSource.close();
                this.state.eventSource = null;
            }
            this.state.connected = false;
            this.state.connectionType = null;
            console.log('[Realtime] 已断开连接');
        }
    };

    // =====================
    // UI 组件 - 实时更新
    // =====================

    /**
     * Agent 状态实时同步
     */
    const AgentRealtime = {
        // 初始化
        init: function() {
            // 订阅 Agent 状态更新
            RealtimeManager.subscribe('agent:status', (data) => {
                this.updateAgentCard(data);
            });

            // 更新 Agent 统计
            RealtimeManager.subscribe('agent:update', (data) => {
                this.updateAgentStats(data);
            });

            console.log('[AgentRealtime] Agent 实时同步已启动');
        },

        // 更新 Agent 卡片
        updateAgentCard: function(agent) {
            const card = document.querySelector(`[data-agent-id="${agent.id}"]`);
            if (card) {
                // 更新状态指示器
                const statusEl = card.querySelector('.status-indicator');
                if (statusEl) {
                    statusEl.className = `status-indicator status-${agent.status}`;
                }

                // 更新任务数
                const tasksEl = card.querySelector('.task-count');
                if (tasksEl) {
                    tasksEl.textContent = agent.tasks || 0;
                }

                // 更新完成数
                const completedEl = card.querySelector('.completed-count');
                if (completedEl) {
                    completedEl.textContent = agent.completed || 0;
                }

                // 更新进度条
                const progressEl = card.querySelector('.progress-fill');
                if (progressEl) {
                    progressEl.style.width = `${agent.completed || 0}%`;
                }

                // 添加更新动画
                card.classList.add('pulse-animation');
                setTimeout(() => card.classList.remove('pulse-animation'), 500);
            }

            // 更新 Agent 分布图
            this.updateDistributionChart();
        },

        // 更新统计
        updateAgentStats: function(stats) {
            // 更新在线/忙碌/离线计数
            const onlineEl = document.getElementById('agent-online-count');
            const busyEl = document.getElementById('agent-busy-count');
            const offlineEl = document.getElementById('agent-offline-count');

            if (onlineEl) onlineEl.textContent = stats.online || 0;
            if (busyEl) busyEl.textContent = stats.busy || 0;
            if (offlineEl) offlineEl.textContent = stats.offline || 0;
        },

        // 更新分布图
        updateDistributionChart: function() {
            // 触发图表重新渲染
            if (typeof Event !== 'undefined' && window.dispatchEvent) {
                window.dispatchEvent(new CustomEvent('agent-distribution-update'));
            }
        }
    };

    /**
     * 提案投票实时更新
     */
    const ProposalRealtime = {
        // 初始化
        init: function() {
            RealtimeManager.subscribe('proposal:vote', (data) => {
                this.updateProposalVote(data);
            });

            RealtimeManager.subscribe('proposal:update', (data) => {
                this.updateProposal(data);
            });

            console.log('[ProposalRealtime] 提案投票实时同步已启动');
        },

        // 更新投票
        updateProposalVote: function(data) {
            const proposalCard = document.querySelector(`[data-proposal-id="${data.proposalId}"]`);
            if (proposalCard) {
                // 更新赞成票数
                const yesEl = proposalCard.querySelector('.vote-yes-count');
                if (yesEl) yesEl.textContent = data.votes.yes;

                // 更新反对票数
                const noEl = proposalCard.querySelector('.vote-no-count');
                if (noEl) noEl.textContent = data.votes.no;

                // 更新弃权票数
                const abstainEl = proposalCard.querySelector('.vote-abstain-count');
                if (abstainEl) abstainEl.textContent = data.votes.abstain;

                // 更新进度条
                const total = data.votes.yes + data.votes.no + data.votes.abstain;
                const yesPercent = total > 0 ? (data.votes.yes / total * 100) : 0;
                
                const progressEl = proposalCard.querySelector('.vote-progress');
                if (progressEl) {
                    progressEl.style.width = `${yesPercent}%`;
                }

                // 更新投票百分比显示
                const percentEl = proposalCard.querySelector('.vote-percent');
                if (percentEl) {
                    percentEl.textContent = `${yesPercent.toFixed(0)}%`;
                }

                // 添加闪烁动画
                proposalCard.classList.add('vote-update');
                setTimeout(() => proposalCard.classList.remove('vote-update'), 300);
            }
        },

        // 更新提案信息
        updateProposal: function(proposal) {
            const card = document.querySelector(`[data-proposal-id="${proposal.id}"]`);
            if (card) {
                // 更新状态
                const statusEl = card.querySelector('.proposal-status');
                if (statusEl) {
                    statusEl.textContent = proposal.status;
                    statusEl.className = `badge proposal-status bg-${this.getStatusColor(proposal.status)}-500/20 text-${this.getStatusColor(proposal.status)}-400`;
                }

                // 更新标题
                const titleEl = card.querySelector('.proposal-title');
                if (titleEl && proposal.title) {
                    titleEl.textContent = proposal.title;
                }
            }
        },

        // 获取状态颜色
        getStatusColor: function(status) {
            const colors = {
                discussing: 'blue',
                voting: 'amber',
                passed: 'emerald',
                rejected: 'red'
            };
            return colors[status] || 'gray';
        }
    };

    /**
     * 通知推送
     */
    const NotificationRealtime = {
        // 通知容器
        container: null,

        // 初始化
        init: function() {
            // 创建通知容器
            this.container = document.createElement('div');
            this.container.id = 'realtime-notifications';
            this.container.className = 'fixed top-20 right-6 z-50 space-y-3';
            document.body.appendChild(this.container);

            // 订阅通知
            RealtimeManager.subscribe('notification', (data) => {
                this.showNotification(data);
            });

            // 订阅系统警报
            RealtimeManager.subscribe('system:alert', (data) => {
                this.showAlert(data);
            });

            console.log('[NotificationRealtime] 通知推送已启动');
        },

        // 显示通知
        showNotification: function(data) {
            const notification = document.createElement('div');
            notification.className = 'glass rounded-lg p-4 max-w-sm slide-in-right animate-slide-down';
            notification.innerHTML = `
                <div class="flex items-start gap-3">
                    <div class="text-2xl">${data.icon || '🔔'}</div>
                    <div class="flex-1">
                        <div class="font-semibold">${data.title || '通知'}</div>
                        <div class="text-sm text-gray-400">${data.message}</div>
                        ${data.timestamp ? `<div class="text-xs text-gray-500 mt-1">${data.timestamp}</div>` : ''}
                    </div>
                    <button onclick="this.parentElement.parentElement.remove()" class="text-gray-400 hover:text-white">
                        <i data-lucide="x" class="w-4 h-4"></i>
                    </button>
                </div>
            `;

            this.container.appendChild(notification);

            // 自动移除
            setTimeout(() => {
                notification.classList.add('opacity-0', 'transition-opacity');
                setTimeout(() => notification.remove(), 300);
            }, data.duration || 5000);

            // 更新图标
            if (typeof lucide !== 'undefined') {
                lucide.createIcons({ root: notification });
            }
        },

        // 显示警报
        showAlert: function(data) {
            const alert = document.createElement('div');
            const type = data.type || 'warning';
            const colors = {
                error: 'bg-red-500/20 border-red-500 text-red-400',
                warning: 'bg-amber-500/20 border-amber-500 text-amber-400',
                info: 'bg-blue-500/20 border-blue-500 text-blue-400',
                success: 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
            };

            alert.className = `glass rounded-lg p-4 max-w-sm border ${colors[type] || colors.warning} slide-in-right`;
            alert.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="text-xl">${data.icon || '⚠️'}</div>
                    <div class="flex-1">
                        <div class="font-semibold">${data.title || '系统警报'}</div>
                        <div class="text-sm opacity-90">${data.message}</div>
                    </div>
                    <button onclick="this.parentElement.parentElement.remove()" class="opacity-60 hover:opacity-100">
                        <i data-lucide="x" class="w-4 h-4"></i>
                    </button>
                </div>
            `;

            this.container.insertBefore(alert, this.container.firstChild);

            setTimeout(() => {
                alert.classList.add('opacity-0', 'transition-opacity');
                setTimeout(() => alert.remove(), 300);
            }, data.duration || 10000);

            if (typeof lucide !== 'undefined') {
                lucide.createIcons({ root: alert });
            }
        }
    };

    /**
     * 系统日志实时流
     */
    const LogRealtime = {
        // 日志容器
        container: null,

        // 初始化
        init: function() {
            this.container = document.getElementById('logs-container') || document.getElementById('activityFeed');
            
            if (this.container) {
                RealtimeManager.subscribe('log:stream', (data) => {
                    this.addLogEntry(data);
                });

                console.log('[LogRealtime] 系统日志实时流已启动');
            }
        },

        // 添加日志条目
        addLogEntry: function(log) {
            if (!this.container) return;

            const entry = document.createElement('div');
            entry.className = 'timeline-item fade-in';
            entry.innerHTML = `
                <div class="text-sm">${log.agent || '系统'}</div>
                <div class="text-gray-400 text-sm">${log.action}</div>
                <div class="text-xs text-gray-500 mt-1">${log.time || '刚刚'}</div>
            `;

            // 插入到最前面
            if (this.container.firstChild) {
                this.container.insertBefore(entry, this.container.firstChild);
            } else {
                this.container.appendChild(entry);
            }

            // 限制显示数量
            const maxEntries = 50;
            while (this.container.children.length > maxEntries) {
                this.container.removeChild(this.container.lastChild);
            }
        }
    };

    /**
     * 连接状态指示器
     */
    const ConnectionIndicator = {
        // 初始化
        init: function() {
            RealtimeManager.subscribe('connection:change', (data) => {
                this.updateIndicator(data);
            });

            // 创建指示器
            this.createIndicator();

            console.log('[ConnectionIndicator] 连接状态指示器已启动');
        },

        // 创建指示器
        createIndicator: function() {
            const indicator = document.createElement('div');
            indicator.id = 'connection-indicator';
            indicator.className = 'fixed bottom-4 left-4 z-50';
            indicator.innerHTML = `
                <div class="glass rounded-full px-3 py-1.5 flex items-center gap-2 text-sm">
                    <span id="connection-dot" class="w-2 h-2 rounded-full bg-gray-500"></span>
                    <span id="connection-text">初始化中...</span>
                </div>
            `;
            document.body.appendChild(indicator);
        },

        // 更新指示器
        updateIndicator: function(data) {
            const dot = document.getElementById('connection-dot');
            const text = document.getElementById('connection-text');

            if (!dot || !text) return;

            const statusConfig = {
                true: { class: 'bg-emerald-500', text: '已连接' },
                false: { class: 'bg-red-500', text: '连接中断' },
                websocket: { class: 'bg-blue-500', text: 'WebSocket' },
                sse: { class: 'bg-amber-500', text: 'SSE 实时连接' },
                offline: { class: 'bg-gray-500', text: '离线' }
            };

            const config = statusConfig[data.connected] || statusConfig[data.type] || statusConfig.false;
            dot.className = `w-2 h-2 rounded-full ${config.class}`;
            text.textContent = config.text;
        }
    };

    // =====================
    // 模拟数据 (开发测试用)
    // =====================

    const SimulatedRealtime = {
        // 是否启用模拟
        enabled: false,

        // 启动模拟
        start: function(interval = 5000) {
            if (this.enabled) return;

            this.enabled = true;
            console.log('[SimulatedRealtime] 启动模拟实时数据');

            // 模拟 Agent 状态更新
            this.agentInterval = setInterval(() => {
                const agents = [
                    { id: 1, name: '大管家', status: ['online', 'online', 'busy'][Math.floor(Math.random() * 3)] },
                    { id: 2, name: '社交 Agent', status: ['online', 'busy'][Math.floor(Math.random() * 2)] },
                    { id: 3, name: '研究 Agent', status: ['online', 'busy'][Math.floor(Math.random() * 2)] }
                ];

                const randomAgent = agents[Math.floor(Math.random() * agents.length)];
                RealtimeManager.emit('agent:status', {
                    ...randomAgent,
                    tasks: Math.floor(Math.random() * 5),
                    completed: Math.floor(Math.random() * 50) + 50
                });
            }, interval);

            // 模拟通知
            this.notificationInterval = setInterval(() => {
                const notifications = [
                    { icon: '📝', title: '新帖子', message: '社交 Agent 发布了新帖子' },
                    { icon: '🗳️', title: '投票更新', message: '提案「增加实时通知系统」有新投票' },
                    { icon: '🤖', title: 'Agent 状态', message: '研究 Agent 开始执行新任务' }
                ];

                const randomNotification = notifications[Math.floor(Math.random() * notifications.length)];
                RealtimeManager.emit('notification', randomNotification);
            }, interval * 3);

            // 模拟日志
            this.logInterval = setInterval(() => {
                const logs = [
                    { agent: '社交 Agent', action: '检查 Moltbook 通知', time: '刚刚' },
                    { agent: '研究 Agent', action: '分析新博客文章', time: '刚刚' },
                    { agent: '大管家', action: '更新系统配置', time: '刚刚' }
                ];

                const randomLog = logs[Math.floor(Math.random() * logs.length)];
                RealtimeManager.emit('log:stream', randomLog);
            }, interval * 2);
        },

        // 停止模拟
        stop: function() {
            if (!this.enabled) return;

            this.enabled = false;
            clearInterval(this.agentInterval);
            clearInterval(this.notificationInterval);
            clearInterval(this.logInterval);
            console.log('[SimulatedRealtime] 停止模拟实时数据');
        }
    };

    // =====================
    // 公开 API
    // =====================

    global.Realtime = {
        // 核心管理器
        manager: RealtimeManager,

        // 组件
        agent: AgentRealtime,
        proposal: ProposalRealtime,
        notification: NotificationRealtime,
        log: LogRealtime,
        connection: ConnectionIndicator,
        simulation: SimulatedRealtime,

        // 便捷方法
        init: function(options) {
            RealtimeManager.init(options);
            AgentRealtime.init();
            ProposalRealtime.init();
            NotificationRealtime.init();
            LogRealtime.init();
            ConnectionIndicator.init();
            return this;
        },

        subscribe: function(eventType, handler) {
            return RealtimeManager.subscribe(eventType, handler);
        },

        send: function(type, payload) {
            RealtimeManager.send(type, payload);
        },

        getStatus: function() {
            return RealtimeManager.getStatus();
        },

        disconnect: function() {
            RealtimeManager.disconnect();
        },

        // 模拟模式 (开发用)
        startSimulation: function(interval) {
            SimulatedRealtime.start(interval);
        },

        stopSimulation: function() {
            SimulatedRealtime.stop();
        }
    };

    // 自动初始化 (如果有 DOM)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // 延迟初始化，确保其他脚本加载完成
            setTimeout(() => {
                global.Realtime.init();
            }, 100);
        });
    }

})(typeof window !== 'undefined' ? window : global);
