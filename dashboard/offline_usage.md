# 离线缓存模块使用文档

## 概述

clawVERSE Dashboard 提供了完整的离线缓存支持，让用户在网络不稳定或完全离线的情况下仍能使用核心功能。

## 功能特性

| 功能 | 描述 |
|------|------|
| Service Worker | 提供离线资源缓存和网络请求拦截 |
| 静态资源缓存 | JS、CSS、图片等资源离线可用 |
| IndexedDB 存储 | 结构化数据持久化存储 |
| 离线状态检测 | 实时监测网络状态变化 |
| 后台同步 | 自动同步离线期间的操作 |
| 智能缓存策略 | 根据资源类型自动选择最佳策略 |

## 快速开始

### 1. 引入模块

在 `index.html` 中添加脚本引用：

```html
<script src="dashboard/offline.js"></script>
```

### 2. 自动初始化

模块会在 DOM 加载完成后自动初始化，无需手动调用。

### 3. 监听离线事件

```javascript
// 离线状态变化
document.addEventListener('offline:statuschange', (event) => {
    const { isOnline } = event.detail;
    console.log('在线状态:', isOnline);
});

// 初始化完成
document.addEventListener('offline:initialized', (event) => {
    const { isOnline, syncPending } = event.detail;
    console.log('离线模块已初始化');
    console.log('待同步操作:', syncPending);
});

// 同步完成
document.addEventListener('offline:synccomplete', (event) => {
    const { synced } = event.detail;
    console.log(`已同步 ${synced} 个操作`);
});
```

## API 参考

### 状态查询

```javascript
// 获取在线状态
const isOnline = OfflineManager.getOnlineStatus();

// 获取待同步操作数量
const pendingCount = OfflineManager.getPendingSyncCount();

// 检查是否已初始化
const isReady = OfflineManager.isInitialized();
```

### 数据缓存

```javascript
// 缓存 API 响应
await OfflineManager.cacheApiResponse('user:123', response);

// 获取缓存的 API 响应
const data = await OfflineManager.getCachedApiResponse('user:123');

// 保存用户数据
await OfflineManager.saveUserData('settings', { theme: 'dark' }, 'preferences');

// 获取用户数据
const settings = await OfflineManager.getUserData('settings');
```

### 网络请求

```javascript
// 带缓存的网络请求（推荐）
const response = await OfflineManager.fetchWithCache('/api/dashboard/stats');

// 离线时自动返回缓存数据
// 网络恢复后自动同步最新数据
```

### 离线队列

```javascript
// 队列操作（离线时存储，在线时执行）
await OfflineManager.queueOperation('api_post', {
    url: '/api/tasks',
    body: { title: '新任务' }
}, 1); // priority: 0-10

// 处理队列
await OfflineManager.processQueue();
```

### 手动同步

```javascript
// 手动触发同步
await OfflineManager.triggerSync();

// 清除所有缓存
await OfflineManager.clearCache();
```

### 预缓存

```javascript
// 预缓存静态资源
await OfflineManager.precache([
    '/dashboard/charts.js',
    '/dashboard/api.js',
    '/dashboard/offline.html'
]);
```

## 缓存策略

### 静态资源 (Cache First)

- **适用**: JS、CSS、图片、字体
- **策略**: 优先使用缓存，失败时请求网络
- **缓存时间**: 7天

### API 请求 (Network First)

- **适用**: REST API 调用
- **策略**: 优先请求网络，失败时使用缓存
- **缓存时间**: 5分钟

### 动态内容 (Stale While Revalidate)

- **适用**: Dashboard 页面、HMTL 内容
- **策略**: 立即返回缓存，同时在后台更新
- **缓存时间**: 24小时

## IndexedDB 数据结构

```javascript
// resources - 缓存资源
{ url: string, timestamp: number, type: string, data: any }

// pendingOperations - 待同步操作
{ id: number, type: string, data: any, timestamp: number, synced: boolean, retryCount: number }

// apiCache - API 响应缓存
{ key: string, response: any, timestamp: number, expiry: number }

// userData - 用户数据
{ key: string, data: any, category: string, timestamp: number }

// offlineQueue - 离线队列
{ id: number, type: string, data: any, priority: number, timestamp: number, executed: boolean }
```

## Service Worker

### 注册

Service Worker 会自动通过 `offline.js` 注册。

### 文件位置

将 `sw.js` 放在项目根目录：
```
/rainhoole-dashboard/
├── sw.js                    # Service Worker
├── index.html               # 主页面
├── offline.html             # 离线页面
└── dashboard/
    └── offline.js           # 离线管理模块
```

### 配置

在 `sw.js` 中可配置：

```javascript
const CACHE_CONFIG = {
    STATIC_CACHE: 'rainhoole-static-v1',
    DYNAMIC_CACHE: 'rainhoole-dynamic-v1',
    API_CACHE: 'rainhoole-api-v1',
    MAX_AGE: {
        STATIC: 7 * 24 * 60 * 60 * 1000,
        API: 5 * 60 * 1000,
        DYNAMIC: 24 * 60 * 60 * 1000
    }
};
```

## 浏览器支持

| 浏览器 | 支持情况 |
|--------|----------|
| Chrome | ✅ 完全支持 |
| Firefox | ✅ 完全支持 |
| Safari | ✅ 完全支持 |
| Edge | ✅ 完全支持 |
| IE 11 | ❌ 不支持 |

## 故障排除

### Service Worker 未注册

1. 检查是否在 HTTPS 环境下运行（Service Worker 需要安全上下文）
2. 检查文件路径是否正确
3. 查看浏览器控制台错误信息

### 缓存未生效

1. 检查 IndexedDB 是否正常初始化
2. 确认请求已正确拦截
3. 尝试清除缓存后重新加载

### 同步失败

1. 检查网络连接
2. 验证 API 端点是否正确
3. 查看待同步操作的重试次数

## 示例代码

### 完整的离线支持示例

```javascript
// 监听状态变化
document.addEventListener('offline:statuschange', (event) => {
    const { isOnline } = event.detail;
    updateUI(isOnline);
});

// 初始化
await OfflineManager.init();

// 使用带缓存的 API 请求
async function loadDashboardData() {
    try {
        const response = await OfflineManager.fetchWithCache('/api/dashboard');
        return await response.json();
    } catch (error) {
        // 返回缓存数据
        return await OfflineManager.getCachedApiResponse('dashboard');
    }
}

// 保存离线操作
async function createTask(taskData) {
    if (OfflineManager.getOnlineStatus()) {
        // 在线：直接发送
        await fetch('/api/tasks', {
            method: 'POST',
            body: JSON.stringify(taskData)
        });
    } else {
        // 离线：加入队列
        await OfflineManager.queueOperation('api_post', {
            url: '/api/tasks',
            body: taskData
        }, 1);
        showNotification('任务已排队，连线后自动创建');
    }
}
```

## 性能优化建议

1. **合理设置缓存时间**：根据数据更新频率调整
2. **清理过期缓存**：定期调用 `clearCache()`
3. **预缓存关键资源**：使用 `precache()` 预加载核心资源
4. **限制缓存大小**：监控 IndexedDB 使用情况

## 最佳实践

- ✅ 始终使用 `fetchWithCache()` 替代直接 `fetch()`
- ✅ 在离线事件中更新 UI 状态
- ✅ 提供清晰的离线提示
- ✅ 实现操作队列的用户可见性
- ✅ 测试离线场景下的所有功能
