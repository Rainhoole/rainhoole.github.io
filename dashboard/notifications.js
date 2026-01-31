/**
 * 🛎️ Rainhoole Dashboard 通知系统
 * 提供浏览器通知、应用内通知、通知历史和设置功能
 */

const NotificationSystem = (function() {
    // ==================== 配置 ====================
    const DEFAULT_CONFIG = {
        browserNotifications: true,
        inAppNotifications: true,
        sound: true,
        autoHide: true,
        hideDelay: 5000, // 毫秒
        maxNotifications: 50,
        showTimestamps: true,
        position: 'top-right' // top-right, top-left, bottom-right, bottom-left
    };

    // ==================== 状态 ====================
    let config = { ...DEFAULT_CONFIG };
    let notificationHistory = [];
    let activeNotifications = [];
    let notificationId = 0;

    // ==================== 通知类型配置 ====================
    const NOTIFICATION_TYPES = {
        success: {
            icon: '✓',
            color: '#22c55e',
            bgColor: '#f0fdf4',
            borderColor: '#bbf7d0',
            title: '成功'
        },
        warning: {
            icon: '⚠',
            color: '#f59e0b',
            bgColor: '#fffbeb',
            borderColor: '#fde68a',
            title: '警告'
        },
        error: {
            icon: '✕',
            color: '#ef4444',
            bgColor: '#fef2f2',
            borderColor: '#fecaca',
            title: '错误'
        },
        info: {
            icon: 'ℹ',
            color: '#3b82f6',
            bgColor: '#eff6ff',
            borderColor: '#bfdbfe',
            title: '信息'
        }
    };

    // ==================== 私有方法 ====================
    
    /**
     * 生成唯一通知ID
     */
    function generateId() {
        return ++notificationId;
    }

    /**
     * 保存通知到历史记录
     */
    function saveToHistory(notification) {
        notificationHistory.unshift({
            ...notification,
            timestamp: new Date().toISOString()
        });
        
        // 限制历史记录数量
        if (notificationHistory.length > config.maxNotifications) {
            notificationHistory = notificationHistory.slice(0, config.maxNotifications);
        }
        
        saveHistoryToStorage();
    }

    /**
     * 保存历史到本地存储
     */
    function saveHistoryToStorage() {
        try {
            localStorage.setItem('notificationHistory', JSON.stringify(notificationHistory));
        } catch (e) {
            console.warn('无法保存通知历史:', e);
        }
    }

    /**
     * 从本地存储加载历史
     */
    function loadHistoryFromStorage() {
        try {
            const stored = localStorage.getItem('notificationHistory');
            if (stored) {
                notificationHistory = JSON.parse(stored);
            }
        } catch (e) {
            console.warn('无法加载通知历史:', e);
        }
    }

    /**
     * 保存配置到本地存储
     */
    function saveConfigToStorage() {
        try {
            localStorage.setItem('notificationConfig', JSON.stringify(config));
        } catch (e) {
            console.warn('无法保存通知配置:', e);
        }
    }

    /**
     * 从本地存储加载配置
     */
    function loadConfigFromStorage() {
        try {
            const stored = localStorage.getItem('notificationConfig');
            if (stored) {
                config = { ...config, ...JSON.parse(stored) };
            }
        } catch (e) {
            console.warn('无法加载通知配置:', e);
        }
    }

    /**
     * 创建通知容器
     */
    function createContainer() {
        if (document.getElementById('notification-container')) return;
        
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'notification-container';
        
        // 根据配置位置设置样式
        const positions = {
            'top-right': { top: '20px', right: '20px' },
            'top-left': { top: '20px', left: '20px' },
            'bottom-right': { bottom: '20px', right: '20px' },
            'bottom-left': { bottom: '20px', left: '20px' }
        };
        
        const pos = positions[config.position] || positions['top-right'];
        Object.assign(container.style, pos);
        
        // 添加样式
        Object.assign(container.style, {
            position: 'fixed',
            zIndex: '9999',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            maxWidth: '400px',
            pointerEvents: 'none'
        });
        
        document.body.appendChild(container);
    }

    /**
     * 请求浏览器通知权限
     */
    async function requestBrowserPermission() {
        if (!('Notification' in window)) {
            console.warn('此浏览器不支持桌面通知');
            return false;
        }
        
        if (Notification.permission === 'granted') {
            return true;
        }
        
        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        
        return false;
    }

    /**
     * 发送浏览器通知
     */
    function sendBrowserNotification(title, options = {}) {
        if (!config.browserNotifications) return;
        if (Notification.permission !== 'granted') return;
        
        const notification = new Notification(title, {
            body: options.body || '',
            icon: options.icon || '/favicon.ico',
            tag: options.tag || `notification-${Date.now()}`,
            requireInteraction: options.requireInteraction || false,
            silent: !config.sound
        });
        
        notification.onclick = function() {
            window.focus();
            notification.close();
            if (options.onclick) options.onclick();
        };
        
        setTimeout(() => notification.close(), options.timeout || 5000);
    }

    /**
     * 显示应用内通知
     */
    function showInAppNotification(notification) {
        if (!config.inAppNotifications) return;
        
        createContainer();
        
        const container = document.getElementById('notification-container');
        const typeConfig = NOTIFICATION_TYPES[notification.type] || NOTIFICATION_TYPES.info;
        
        const element = document.createElement('div');
        element.className = 'notification-item slide-up';
        element.dataset.id = notification.id;
        
        // 设置样式
        Object.assign(element.style, {
            padding: '16px',
            borderRadius: '8px',
            borderLeft: `4px solid ${typeConfig.color}`,
            backgroundColor: typeConfig.bgColor,
            border: `1px solid ${typeConfig.borderColor}`,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            pointerEvents: 'auto',
            maxWidth: '380px',
            minWidth: '300px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            transition: 'all 0.3s ease'
        });
        
        // 关闭按钮
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        Object.assign(closeBtn.style, {
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: 'none',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            color: '#6b7280',
            lineHeight: '1'
        });
        closeBtn.onclick = () => dismissNotification(notification.id);
        element.appendChild(closeBtn);
        
        // 图标
        const icon = document.createElement('div');
        icon.innerHTML = typeConfig.icon;
        Object.assign(icon.style, {
            fontSize: '20px',
            color: typeConfig.color,
            flexShrink: 0,
            marginTop: '2px'
        });
        element.appendChild(icon);
        
        // 内容
        const content = document.createElement('div');
        Object.assign(content.style, { flex: 1 });
        
        if (notification.title) {
            const titleEl = document.createElement('strong');
            titleEl.textContent = notification.title;
            Object.assign(titleEl.style, {
                display: 'block',
                marginBottom: '4px',
                color: '#1f2937'
            });
            content.appendChild(titleEl);
        }
        
        const messageEl = document.createElement('p');
        messageEl.textContent = notification.message;
        Object.assign(messageEl.style, {
            margin: 0,
            color: '#4b5563',
            fontSize: '14px',
            lineHeight: '1.5'
        });
        content.appendChild(messageEl);
        
        if (config.showTimestamps) {
            const timeEl = document.createElement('small');
            const time = new Date().toLocaleTimeString('zh-CN');
            timeEl.textContent = time;
            Object.assign(timeEl.style, {
                display: 'block',
                marginTop: '8px',
                color: '#9ca3af',
                fontSize: '12px'
            });
            content.appendChild(timeEl);
        }
        
        element.appendChild(content);
        
        // 悬停效果
        element.onmouseenter = () => {
            element.style.transform = 'translateX(-4px)';
            element.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
        };
        element.onmouseleave = () => {
            element.style.transform = 'translateX(0)';
            element.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        };
        
        container.appendChild(element);
        activeNotifications.push({ id: notification.id, element });
        
        // 自动隐藏
        if (config.autoHide && !notification.persistent) {
            setTimeout(() => {
                dismissNotification(notification.id);
            }, notification.duration || config.hideDelay);
        }
    }

    /**
     * 关闭通知
     */
    function dismissNotification(id) {
        const index = activeNotifications.findIndex(n => n.id === id);
        if (index > -1) {
            const { element } = activeNotifications[index];
            element.style.opacity = '0';
            element.style.transform = 'translateX(100%)';
            
            setTimeout(() => {
                element.remove();
            }, 300);
            
            activeNotifications.splice(index, 1);
        }
    }

    /**
     * 播放通知声音
     */
    function playSound() {
        if (!config.sound) return;
        
        try {
            const audio = new Audio();
            audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAAAAAAAAAAAAAAD/3gBkAGkAYwAAAAIAAAACW1pbmQAAAA=';
            audio.volume = 0.3;
            audio.play().catch(() => {});
        } catch (e) {}
    }

    // ==================== 公共 API ====================

    /**
     * 初始化通知系统
     */
    function init() {
        loadConfigFromStorage();
        loadHistoryFromStorage();
        createContainer();
        console.log('🔔 通知系统已初始化');
        return true;
    }

    /**
     * 显示通知
     * @param {Object} options - 通知选项
     * @param {string} options.type - 通知类型 (success, warning, error, info)
     * @param {string} options.title - 通知标题
     * @param {string} options.message - 通知内容
     * @param {boolean} options.persistent - 是否持久显示（不自动隐藏）
     * @param {number} options.duration - 显示时长（毫秒）
     * @param {Function} options.onclick - 点击回调
     */
    function show(options) {
        const notification = {
            id: generateId(),
            type: options.type || 'info',
            title: options.title || '',
            message: options.message || '',
            persistent: options.persistent || false,
            duration: options.duration,
            onclick: options.onclick
        };
        
        // 保存到历史
        saveToHistory(notification);
        
        // 播放声音
        playSound();
        
        // 显示应用内通知
        showInAppNotification(notification);
        
        // 发送浏览器通知
        if (options.browser !== false) {
            sendBrowserNotification(notification.title || NOTIFICATION_TYPES[notification.type].title, {
                body: notification.message,
                onclick: notification.onclick
            });
        }
        
        return notification.id;
    }

    /**
     * 快捷方法：显示成功通知
     */
    function success(message, title = '操作成功') {
        return show({ type: 'success', title, message });
    }

    /**
     * 快捷方法：显示警告通知
     */
    function warning(message, title = '警告') {
        return show({ type: 'warning', title, message });
    }

    /**
     * 快捷方法：显示错误通知
     */
    function error(message, title = '发生错误') {
        return show({ type: 'error', title, message });
    }

    /**
     * 快捷方法：显示信息通知
     */
    function info(message, title = '通知') {
        return show({ type: 'info', title, message });
    }

    /**
     * 关闭特定通知
     */
    function dismiss(id) {
        dismissNotification(id);
    }

    /**
     * 关闭所有活动通知
     */
    function dismissAll() {
        activeNotifications.forEach(n => dismissNotification(n.id));
    }

    /**
     * 获取通知历史
     */
    function getHistory() {
        return [...notificationHistory];
    }

    /**
     * 清空通知历史
     */
    function clearHistory() {
        notificationHistory = [];
        saveHistoryToStorage();
    }

    /**
     * 更新配置
     */
    function updateConfig(newConfig) {
        config = { ...config, ...newConfig };
        saveConfigToStorage();
    }

    /**
     * 获取当前配置
     */
    function getConfig() {
        return { ...config };
    }

    /**
     * 请求通知权限（浏览器）
     */
    function requestPermission() {
        return requestBrowserPermission();
    }

    /**
     * 检查浏览器通知权限状态
     */
    function getPermissionStatus() {
        if (!('Notification' in window)) return 'unsupported';
        return Notification.permission;
    }

    /**
     * 打开通知面板（UI 方法）
     */
    function openPanel() {
        const panel = document.getElementById('notification-panel');
        if (panel) {
            panel.classList.remove('hidden');
            renderNotificationList();
        }
    }

    /**
     * 关闭通知面板（UI 方法）
     */
    function closePanel() {
        const panel = document.getElementById('notification-panel');
        if (panel) {
            panel.classList.add('hidden');
        }
    }

    /**
     * 渲染通知列表（用于面板）
     */
    function renderNotificationList() {
        const list = document.getElementById('notification-list');
        if (!list) return;
        
        if (notificationHistory.length === 0) {
            list.innerHTML = '<div class="text-center text-gray-500 py-8">暂无通知记录</div>';
            return;
        }
        
        list.innerHTML = notificationHistory.map(n => {
            const typeConfig = NOTIFICATION_TYPES[n.type] || NOTIFICATION_TYPES.info;
            const time = new Date(n.timestamp).toLocaleString('zh-CN');
            return `
                <div class="notification-history-item" style="
                    padding: 12px;
                    border-bottom: 1px solid #e5e7eb;
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    cursor: pointer;
                    transition: background-color 0.2s;
                " onmouseover="this.style.backgroundColor='#f3f4f6'" onmouseout="this.style.backgroundColor='transparent'">
                    <span style="color: ${typeConfig.color}; font-size: 16px;">${typeConfig.icon}</span>
                    <div style="flex: 1;">
                        <div style="font-weight: 500; margin-bottom: 4px;">${n.title || typeConfig.title}</div>
                        <div style="color: #6b7280; font-size: 13px;">${n.message}</div>
                        <div style="color: #9ca3af; font-size: 11px; margin-top: 4px;">${time}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // ==================== 初始化 ====================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ==================== 导出公共 API ====================
    return {
        show,
        success,
        warning,
        error,
        info,
        dismiss,
        dismissAll,
        getHistory,
        clearHistory,
        updateConfig,
        getConfig,
        requestPermission,
        getPermissionStatus,
        openPanel,
        closePanel,
        renderNotificationList,
        init
    };
})();

// ==================== 便捷函数 ====================

/**
 * 显示成功通知
 */
function notifySuccess(message, title) {
    return NotificationSystem.success(message, title);
}

/**
 * 显示警告通知
 */
function notifyWarning(message, title) {
    return NotificationSystem.warning(message, title);
}

/**
 * 显示错误通知
 */
function notifyError(message, title) {
    return NotificationSystem.error(message, title);
}

/**
 * 显示信息通知
 */
function notifyInfo(message, title) {
    return NotificationSystem.info(message, title);
}
