/**
 * Offline Cache Module - 离线缓存模块
 * 
 * 提供完整的离线支持功能：
 * - Service Worker 注册与管理
 * - 静态资源缓存
 * - IndexedDB 数据持久化
 * - 离线状态检测
 * - 后台同步策略
 */

const OfflineManager = (function() {
    'use strict';

    // 配置
    const CONFIG = {
        CACHE_NAME: 'rainhoole-dashboard-v1',
        STATIC_CACHE_NAME: 'rainhoole-static-v1',
        DYNAMIC_CACHE_NAME: 'rainhoole-dynamic-v1',
        DATA_CACHE_NAME: 'rainhoole-data-v1',
        DB_NAME: 'RainhooleDashboardDB',
        DB_VERSION: 1,
        SYNC_TAG: 'rainhoole-sync',
        OFFLINE_URL: '/offline.html',
        MAX_AGE: 24 * 60 * 60 * 1000, // 24小时
        MAX_SIZE: 50 * 1024 * 1024 // 50MB
    };

    // 状态
    let isOnline = navigator.onLine;
    let isInitialized = false;
    let syncPending = false;
    let pendingOperations = [];

    // IndexedDB 实例
    let db = null;

    /**
     * 初始化离线管理器
     */
    async function init() {
        if (isInitialized) return;

        try {
            // 初始化 IndexedDB
            await initIndexedDB();

            // 注册 Service Worker
            await registerServiceWorker();

            // 设置网络状态监听
            setupOnlineStatusListener();

            // 恢复待同步数据
            await restorePendingOperations();

            isInitialized = true;
            console.log('[Offline] 离线缓存模块已初始化');

            // 触发初始化完成事件
            dispatchEvent(new CustomEvent('offline:initialized', {
                detail: { isOnline, syncPending }
            }));

        } catch (error) {
            console.error('[Offline] 初始化失败:', error);
            throw error;
        }
    }

    /**
     * 初始化 IndexedDB
     */
    async function initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(CONFIG.DB_NAME, CONFIG.DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                db = request.result;
                resolve(db);
            };

            // 创建对象存储
            request.onupgradeneeded = (event) => {
                const database = event.target.result;

                // 缓存资源表
                if (!database.objectStoreNames.contains('resources')) {
                    const resourceStore = database.createObjectStore('resources', { keyPath: 'url' });
                    resourceStore.createIndex('timestamp', 'timestamp');
                    resourceStore.createIndex('type', 'type');
                }

                // 待同步操作表
                if (!database.objectStoreNames.contains('pendingOperations')) {
                    const operationStore = database.createObjectStore('pendingOperations', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    operationStore.createIndex('timestamp', 'timestamp');
                    operationStore.createIndex('type', 'type');
                    operationStore.createIndex('synced', 'synced');
                }

                // API 响应缓存表
                if (!database.objectStoreNames.contains('apiCache')) {
                    const apiStore = database.createObjectStore('apiCache', { keyPath: 'key' });
                    apiStore.createIndex('expiry', 'expiry');
                    apiStore.createIndex('timestamp', 'timestamp');
                }

                // 用户数据缓存表
                if (!database.objectStoreNames.contains('userData')) {
                    const userStore = database.createObjectStore('userData', { keyPath: 'key' });
                    userStore.createIndex('category', 'category');
                }

                // 离线队列表
                if (!database.objectStoreNames.contains('offlineQueue')) {
                    const queueStore = database.createObjectStore('offlineQueue', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    queueStore.createIndex('priority', 'priority');
                    queueStore.createIndex('timestamp', 'timestamp');
                }
            };
        });
    }

    /**
     * 注册 Service Worker
     */
    async function registerServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            console.warn('[Offline] 浏览器不支持 Service Worker');
            return false;
        }

        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            });

            console.log('[Offline] Service Worker 注册成功:', registration.scope);

            // 监听更新
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // 新版本可用
                        dispatchEvent(new CustomEvent('offline:updateavailable'));
                    }
                });
            });

            // 监听同步事件
            if ('sync' in registration) {
                registration.sync.register(CONFIG.SYNC_TAG).catch(console.error);
            }

            return true;
        } catch (error) {
            console.error('[Offline] Service Worker 注册失败:', error);
            return false;
        }
    }

    /**
     * 设置网络状态监听器
     */
    function setupOnlineStatusListener() {
        window.addEventListener('online', async () => {
            isOnline = true;
            dispatchEvent(new CustomEvent('offline:statuschange', {
                detail: { isOnline: true }
            }));
            
            // 触发后台同步
            await syncPendingOperations();
        });

        window.addEventListener('offline', () => {
            isOnline = false;
            dispatchEvent(new CustomEvent('offline:statuschange', {
                detail: { isOnline: false }
            }));
        });
    }

    /**
     * 缓存静态资源
     */
    async function cacheStaticResources(resources) {
        const cache = await caches.open(CONFIG.STATIC_CACHE_NAME);
        
        for (const resource of resources) {
            try {
                await cache.add(resource);
            } catch (error) {
                console.warn(`[Offline] 缓存资源失败: ${resource}`, error);
            }
        }
    }

    /**
     * 缓存 API 响应
     */
    async function cacheApiResponse(key, response, expiry = CONFIG.MAX_AGE) {
        if (!db) await initIndexedDB();

        const data = {
            key,
            response: await response.clone().json(),
            timestamp: Date.now(),
            expiry: Date.now() + expiry
        };

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['apiCache'], 'readwrite');
            const request = transaction.objectStore('apiCache').put(data);
            request.onsuccess = () => resolve(data);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 获取缓存的 API 响应
     */
    async function getCachedApiResponse(key) {
        if (!db) await initIndexedDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['apiCache'], 'readonly');
            const request = transaction.objectStore('apiCache').get(key);
            
            request.onsuccess = () => {
                const data = request.result;
                if (data && data.expiry > Date.now()) {
                    resolve(data.response);
                } else {
                    resolve(null);
                }
            };
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 保存用户数据到本地
     */
    async function saveUserData(key, data, category = 'default') {
        if (!db) await initIndexedDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['userData'], 'readwrite');
            const request = transaction.objectStore('userData').put({
                key,
                data,
                category,
                timestamp: Date.now()
            });
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 获取用户数据
     */
    async function getUserData(key) {
        if (!db) await initIndexedDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['userData'], 'readonly');
            const request = transaction.objectStore('userData').get(key);
            
            request.onsuccess = () => resolve(request.result?.data || null);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 添加待同步操作
     */
    async function addPendingOperation(type, data) {
        if (!db) await initIndexedDB();

        const operation = {
            type,
            data,
            timestamp: Date.now(),
            synced: false,
            retryCount: 0
        };

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['pendingOperations'], 'readwrite');
            const request = transaction.objectStore('pendingOperations').add(operation);
            request.onsuccess = () => {
                pendingOperations.push(operation);
                resolve(request.result);
            };
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 同步待处理操作
     */
    async function syncPendingOperations() {
        if (!isOnline || !db) return;

        try {
            const operations = await getUnsyncedOperations();
            
            for (const operation of operations) {
                try {
                    await executeOperation(operation);
                    await markOperationSynced(operation.id);
                } catch (error) {
                    console.warn(`[Offline] 操作同步失败: ${operation.id}`, error);
                    await incrementRetryCount(operation.id);
                }
            }

            syncPending = operations.length > 0;
            dispatchEvent(new CustomEvent('offline:synccomplete', {
                detail: { synced: operations.length }
            }));

        } catch (error) {
            console.error('[Offline] 同步失败:', error);
        }
    }

    /**
     * 获取未同步的操作
     */
    async function getUnsyncedOperations() {
        if (!db) await initIndexedDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['pendingOperations'], 'readonly');
            const index = transaction.objectStore('pendingOperations').index('synced');
            const request = index.getAll(IDBKeyRange.only(false));
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 执行操作
     */
    async function executeOperation(operation) {
        const { type, data } = operation;

        switch (type) {
            case 'api_post':
                return fetch(data.url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data.body)
                });
            case 'api_put':
                return fetch(data.url, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data.body)
                });
            case 'api_delete':
                return fetch(data.url, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data.body)
                });
            default:
                throw new Error(`未知操作类型: ${type}`);
        }
    }

    /**
     * 标记操作已同步
     */
    async function markOperationSynced(id) {
        if (!db) await initIndexedDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['pendingOperations'], 'readwrite');
            const store = transaction.objectStore('pendingOperations');
            
            store.get(id).onsuccess = (e) => {
                const data = e.target.result;
                if (data) {
                    data.synced = true;
                    store.put(data).onsuccess = () => resolve();
                }
            };
        });
    }

    /**
     * 增加重试计数
     */
    async function incrementRetryCount(id) {
        if (!db) await initIndexedDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['pendingOperations'], 'readwrite');
            const store = transaction.objectStore('pendingOperations');
            
            store.get(id).onsuccess = (e) => {
                const data = e.target.result;
                if (data) {
                    data.retryCount = (data.retryCount || 0) + 1;
                    store.put(data).onsuccess = () => resolve();
                }
            };
        });
    }

    /**
     * 恢复待同步操作
     */
    async function restorePendingOperations() {
        if (!db) return;

        pendingOperations = await getUnsyncedOperations();
        syncPending = pendingOperations.length > 0;
    }

    /**
     * 清除缓存
     */
    async function clearCache(cacheName = CONFIG.CACHE_NAME) {
        await caches.delete(cacheName);
        
        if (db) {
            const cachesToClear = ['resources', 'apiCache', 'userData', 'offlineQueue'];
            for (const cacheName of cachesToClear) {
                const transaction = db.transaction([cacheName], 'readwrite');
                transaction.objectStore(cacheName).clear();
            }
        }
    }

    /**
     * 获取离线状态
     */
    function getOnlineStatus() {
        return isOnline;
    }

    /**
     * 获取待同步数量
     */
    function getPendingSyncCount() {
        return pendingOperations.length;
    }

    /**
     * 手动触发同步
     */
    async function triggerSync() {
        if (isOnline) {
            await syncPendingOperations();
        } else {
            console.warn('[Offline] 离线状态无法触发同步');
        }
    }

    /**
     * 缓存网络请求
     */
    async function fetchWithCache(url, options = {}) {
        const cacheKey = options.cacheKey || url;
        
        // 优先返回缓存（离线时）
        if (!isOnline) {
            const cached = await getCachedApiResponse(cacheKey);
            if (cached) {
                dispatchEvent(new CustomEvent('offline:cachehit', { detail: { url } }));
                return new Response(JSON.stringify(cached), {
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            throw new Error('离线且无缓存');
        }

        try {
            const response = await fetch(url, options);
            
            // 缓存 GET 请求
            if (options.method === 'GET' || !options.method) {
                await cacheApiResponse(cacheKey, response);
            }
            
            return response;
        } catch (error) {
            // 降级到缓存
            const cached = await getCachedApiResponse(cacheKey);
            if (cached) {
                return new Response(JSON.stringify(cached), {
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            throw error;
        }
    }

    /**
     * 队列操作（离线时存储，在线时执行）
     */
    async function queueOperation(type, data, priority = 0) {
        if (!db) await initIndexedDB();

        const operation = {
            type,
            data,
            priority,
            timestamp: Date.now(),
            executed: false
        };

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['offlineQueue'], 'readwrite');
            const request = transaction.objectStore('offlineQueue').add(operation);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 执行队列操作
     */
    async function processQueue() {
        if (!isOnline || !db) return;

        const transaction = db.transaction(['offlineQueue'], 'readwrite');
        const store = transaction.objectStore('offlineQueue');
        const index = store.index('priority');

        return new Promise((resolve, reject) => {
            const request = index.openCursor(null, 'prev');
            let processed = 0;

            request.onsuccess = async (e) => {
                const cursor = e.target.result;
                if (cursor) {
                    const operation = cursor.value;
                    
                    if (!operation.executed) {
                        try {
                            await executeOperation(operation);
                            operation.executed = true;
                            store.put(operation);
                            processed++;
                        } catch (error) {
                            console.warn('[Offline] 队列操作执行失败:', error);
                        }
                    }
                    
                    cursor.continue();
                } else {
                    resolve(processed);
                }
            };
        });
    }

    /**
     * 预缓存资源
     */
    async function precache(resources) {
        const cache = await caches.open(CONFIG.CACHE_NAME);
        
        for (const resource of resources) {
            try {
                await cache.add(resource);
            } catch (error) {
                console.warn(`[Offline] 预缓存失败: ${resource}`, error);
            }
        }
    }

    // 公共 API
    return {
        init,
        isInitialized: () => isInitialized,
        getOnlineStatus,
        getPendingSyncCount,
        triggerSync,
        clearCache,
        cacheStaticResources,
        precache,
        // 数据缓存
        cacheApiResponse,
        getCachedApiResponse,
        saveUserData,
        getUserData,
        // 离线队列
        queueOperation,
        processQueue,
        // 操作队列
        addPendingOperation,
        syncPendingOperations,
        // 网络请求
        fetchWithCache
    };
})();

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => OfflineManager.init());
} else {
    OfflineManager.init();
}
