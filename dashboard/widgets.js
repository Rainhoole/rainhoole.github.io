/**
 * Dashboard Widgets System
 * 可配置小部件系统 - 支持拖拽排序
 */

class WidgetSystem {
    constructor() {
        this.widgets = [];
        this.widgetConfigs = {};
        this.draggedWidget = null;
        this.isDragging = false;
        
        // 初始化小部件
        this.init();
    }

    init() {
        this.loadWidgetConfigs();
        this.renderWidgetArea();
        this.initDragAndDrop();
        this.startWidgetTimers();
    }

    // 加载小部件配置
    loadWidgetConfigs() {
        const saved = localStorage.getItem('widget_configs');
        if (saved) {
            this.widgetConfigs = JSON.parse(saved);
        } else {
            // 默认配置
            this.widgetConfigs = {
                weather: {
                    enabled: true,
                    position: 0,
                    config: { city: '北京', unit: 'celsius' }
                },
                clock: {
                    enabled: true,
                    position: 1,
                    config: { format: '24h', showDate: true }
                },
                stats: {
                    enabled: true,
                    position: 2,
                    config: { 
                        metrics: [
                            { label: '活跃Agents', value: 12, trend: '+3', trendUp: true },
                            { label: '今日任务', value: 847, trend: '+12%', trendUp: true },
                            { label: '处理效率', value: '94.2%', trend: '+2.1%', trendUp: true },
                            { label: '协作评分', value: 'A+', trend: 'Top 5%', trendUp: true }
                        ]
                    }
                },
                todo: {
                    enabled: true,
                    position: 3,
                    config: {
                        items: [
                            { text: '完成 API 文档更新', completed: true },
                            { text: '修复用户认证 BUG', completed: false },
                            { text: '优化实时数据性能', completed: false },
                            { text: '添加单元测试覆盖', completed: false }
                        ]
                    }
                },
                activity: {
                    enabled: true,
                    position: 4,
                    config: {
                        limit: 5,
                        activities: [
                            { agent: 'Researcher', action: '完成研究任务', time: '2分钟前', status: 'success' },
                            { agent: 'Coder', action: '提交代码 PR #128', time: '5分钟前', status: 'success' },
                            { agent: 'Designer', action: '更新 UI 组件', time: '12分钟前', status: 'pending' },
                            { agent: 'Tester', action: '运行测试套件', time: '18分钟前', status: 'success' },
                            { agent: 'Manager', action: '审核 PR #127', time: '25分钟前', status: 'success' }
                        ]
                    }
                }
            };
            this.saveWidgetConfigs();
        }
    }

    saveWidgetConfigs() {
        localStorage.setItem('widget_configs', JSON.stringify(this.widgetConfigs));
    }

    // 渲染小部件区域
    renderWidgetArea() {
        const container = document.getElementById('widgets-container');
        if (!container) return;

        // 按位置排序
        const sortedWidgets = Object.entries(this.widgetConfigs)
            .filter(([_, config]) => config.enabled)
            .sort((a, b) => a[1].position - b[1].position);

        container.innerHTML = sortedWidgets.map(([name, config]) => 
            this.createWidgetElement(name, config)
        ).join('');

        // 绑定小部件事件
        this.bindWidgetEvents();
    }

    createWidgetElement(name, config) {
        const widgetContent = this.getWidgetContent(name, config.config);
        
        return `
            <div class="widget glass rounded-xl p-6 cursor-move" 
                 data-widget="${name}" 
                 draggable="true">
                <div class="widget-header flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold flex items-center gap-2">
                        ${this.getWidgetIcon(name)} ${this.getWidgetTitle(name)}
                    </h3>
                    <div class="widget-actions flex gap-2">
                        <button onclick="widgetSystem.openWidgetSettings('${name}')" 
                                class="text-gray-400 hover:text-white p-1">
                            ⚙️
                        </button>
                        <button onclick="widgetSystem.toggleWidget('${name}')" 
                                class="text-gray-400 hover:text-white p-1">
                            ${config.enabled ? '📌' : '📍'}
                        </button>
                    </div>
                </div>
                <div class="widget-content">
                    ${widgetContent}
                </div>
            </div>
        `;
    }

    getWidgetIcon(name) {
        const icons = {
            weather: '🌤️',
            clock: '🕐',
            stats: '📊',
            todo: '📋',
            activity: '🚀'
        };
        return icons[name] || '📦';
    }

    getWidgetTitle(name) {
        const titles = {
            weather: '天气预报',
            clock: '时钟',
            stats: '统计卡片',
            todo: '待办事项',
            activity: '最近活动'
        };
        return titles[name] || name;
    }

    getWidgetContent(name, config) {
        switch (name) {
            case 'weather':
                return this.renderWeatherWidget(config);
            case 'clock':
                return this.renderClockWidget(config);
            case 'stats':
                return this.renderStatsWidget(config);
            case 'todo':
                return this.renderTodoWidget(config);
            case 'activity':
                return this.renderActivityWidget(config);
            default:
                return '<p>未知小部件</p>';
        }
    }

    // 天气小部件
    renderWeatherWidget(config) {
        const city = config.city || '北京';
        return `
            <div class="weather-widget text-center py-4">
                <div class="text-4xl mb-2">${this.getWeatherEmoji()}</div>
                <div class="text-3xl font-bold">${Math.floor(Math.random() * 15 + 10)}°C</div>
                <div class="text-gray-400 mt-1">${city}</div>
                <div class="text-sm text-gray-500 mt-2">
                    湿度: ${Math.floor(Math.random() * 40 + 40)}% | 
                    风速: ${Math.floor(Math.random() * 20 + 5)}km/h
                </div>
            </div>
        `;
    }

    getWeatherEmoji() {
        const weathers = ['☀️', '⛅', '🌤️', '☁️', '🌧️'];
        return weathers[Math.floor(Math.random() * weathers.length)];
    }

    // 时钟小部件
    renderClockWidget(config) {
        const format = config.format || '24h';
        const showDate = config.showDate !== false;
        
        return `
            <div class="clock-widget text-center py-4">
                <div class="text-4xl font-bold font-mono" id="clock-display">
                    ${this.getCurrentTime(format)}
                </div>
                ${showDate ? `<div class="text-gray-400 mt-2" id="clock-date">${this.getCurrentDate()}</div>` : ''}
            </div>
        `;
    }

    getCurrentTime(format) {
        const now = new Date();
        if (format === '12h') {
            return now.toLocaleTimeString('zh-CN', { hour12: true });
        }
        return now.toLocaleTimeString('zh-CN', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            hour12: false 
        });
    }

    getCurrentDate() {
        return new Date().toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
    }

    // 统计卡片小部件
    renderStatsWidget(config) {
        const metrics = config.metrics || [];
        return `
            <div class="stats-grid grid grid-cols-2 gap-4">
                ${metrics.map(m => `
                    <div class="stat-card bg-white/5 rounded-lg p-4">
                        <div class="text-gray-400 text-sm">${m.label}</div>
                        <div class="text-2xl font-bold mt-1">${m.value}</div>
                        <div class="text-xs ${m.trendUp ? 'text-green-400' : 'text-red-400'} mt-1">
                            ${m.trendUp ? '↑' : '↓'} ${m.trend}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // 待办事项小部件
    renderTodoWidget(config) {
        const items = config.items || [];
        return `
            <div class="todo-widget space-y-2">
                ${items.map((item, index) => `
                    <div class="todo-item flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition ${item.completed ? 'opacity-50' : ''}">
                        <input type="checkbox" 
                               ${item.completed ? 'checked' : ''}
                               onchange="widgetSystem.toggleTodoItem('${index}')"
                               class="w-4 h-4 rounded border-gray-500">
                        <span class="${item.completed ? 'line-through text-gray-500' : ''} flex-1">
                            ${item.text}
                        </span>
                        <button onclick="widgetSystem.deleteTodoItem('${index}')" 
                                class="text-gray-500 hover:text-red-400 text-sm">
                            ×
                        </button>
                    </div>
                `).join('')}
                <div class="todo-input flex gap-2 mt-3">
                    <input type="text" 
                           id="todo-input" 
                           placeholder="添加新任务..."
                           class="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                           onkeypress="if(event.key==='Enter') widgetSystem.addTodoItem()">
                    <button onclick="widgetSystem.addTodoItem()" 
                            class="btn-primary px-3 py-2 rounded-lg text-sm">
                        +
                    </button>
                </div>
            </div>
        `;
    }

    // 最近活动小部件
    renderActivityWidget(config) {
        const activities = config.activities || [];
        const limit = config.limit || 5;
        
        return `
            <div class="activity-widget space-y-3">
                ${activities.slice(0, limit).map(a => `
                    <div class="activity-item flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs">
                                ${a.agent ? a.agent[0] : '?'}
                            </div>
                            <div>
                                <div class="font-medium text-sm">${a.agent || 'Unknown'}</div>
                                <div class="text-xs text-gray-400">${a.action || ''}</div>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-xs text-gray-500">${a.time || ''}</div>
                            <span class="text-xs ${a.status === 'success' ? 'text-green-400' : 'text-yellow-400'}">
                                ${a.status === 'success' ? '✓' : '⏳'}
                            </span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // 拖拽排序
    initDragAndDrop() {
        const container = document.getElementById('widgets-container');
        if (!container) return;

        container.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('widget')) {
                this.draggedWidget = e.target;
                e.target.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            }
        });

        container.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('widget')) {
                e.target.classList.remove('dragging');
                this.draggedWidget = null;
                this.updateWidgetPositions();
            }
        });

        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = this.getDragAfterElement(container, e.clientY);
            const draggable = this.draggedWidget;
            if (draggable) {
                if (afterElement == null) {
                    container.appendChild(draggable);
                } else {
                    container.insertBefore(draggable, afterElement);
                }
            }
        });
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.widget:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    updateWidgetPositions() {
        const container = document.getElementById('widgets-container');
        if (!container) return;

        const widgets = [...container.querySelectorAll('.widget')];
        widgets.forEach((widget, index) => {
            const name = widget.dataset.widget;
            if (this.widgetConfigs[name]) {
                this.widgetConfigs[name].position = index;
            }
        });
        
        this.saveWidgetConfigs();
    }

    // 小部件操作方法
    toggleWidget(name) {
        if (this.widgetConfigs[name]) {
            this.widgetConfigs[name].enabled = !this.widgetConfigs[name].enabled;
            this.saveWidgetConfigs();
            this.renderWidgetArea();
        }
    }

    toggleTodoItem(index) {
        const todoConfig = this.widgetConfigs.todo;
        if (todoConfig && todoConfig.config.items[index]) {
            todoConfig.config.items[index].completed = !todoConfig.config.items[index].completed;
            this.saveWidgetConfigs();
            this.renderWidgetArea();
        }
    }

    addTodoItem() {
        const input = document.getElementById('todo-input');
        const text = input.value.trim();
        if (text) {
            const todoConfig = this.widgetConfigs.todo;
            if (todoConfig) {
                todoConfig.config.items.push({ text, completed: false });
                this.saveWidgetConfigs();
                this.renderWidgetArea();
                input.value = '';
            }
        }
    }

    deleteTodoItem(index) {
        const todoConfig = this.widgetConfigs.todo;
        if (todoConfig && todoConfig.config.items[index]) {
            todoConfig.config.items.splice(index, 1);
            this.saveWidgetConfigs();
            this.renderWidgetArea();
        }
    }

    openWidgetSettings(name) {
        // 打开小部件设置模态框
        showNotification(`打开 ${this.getWidgetTitle(name)} 设置`, 'info');
    }

    // 定时更新
    startWidgetTimers() {
        // 更新时钟
        setInterval(() => {
            const clockDisplay = document.getElementById('clock-display');
            const clockDate = document.getElementById('clock-date');
            const config = this.widgetConfigs.clock?.config || {};
            
            if (clockDisplay) {
                clockDisplay.textContent = this.getCurrentTime(config.format || '24h');
            }
            if (clockDate) {
                clockDate.textContent = this.getCurrentDate();
            }
        }, 1000);

        // 更新天气 (模拟)
        setInterval(() => {
            this.renderWidgetArea();
        }, 60000); // 每分钟刷新天气
    }

    // 绑定小部件事件
    bindWidgetEvents() {
        // 小部件内的交互事件在各自渲染方法中处理
    }

    // 添加新小部件
    addWidget(name, config) {
        this.widgetConfigs[name] = {
            enabled: true,
            position: Object.keys(this.widgetConfigs).length,
            config: config
        };
        this.saveWidgetConfigs();
        this.renderWidgetArea();
    }

    // 重置小部件配置
    resetWidgetConfigs() {
        localStorage.removeItem('widget_configs');
        this.widgetConfigs = {};
        this.loadWidgetConfigs();
        this.renderWidgetArea();
        showNotification('小部件配置已重置', 'success');
    }
}

// 初始化全局小部件系统
let widgetSystem;
document.addEventListener('DOMContentLoaded', function() {
    widgetSystem = new WidgetSystem();
});
