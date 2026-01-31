/**
 * Service Worker - 离线缓存服务
 * 
 * 功能：
 * - 静态资源缓存 (Cache First)
 * - API 响应缓存 (Network First / Stale While Revalidate)
 * - 离线页面支持
 * - 后台同步
 * - 缓存清理
 */

const CACHE_CONFIG = {
    // 缓存名称
    STATIC_CACHE: 'rainhoole-static-v1',
    DYNAMIC_CACHE: 'rainhoole-dynamic-v1',
    API_CACHE: 'rainhoole-api-v1',
    
    // 缓存策略
    STRATEGIES: {
        STATIC: 'cache-first',      // 静态资源：优先缓存
        API: 'network-first',       // API：优先网络，失败回退缓存
        DYNAMIC: 'stale-while-revalidate' // 动态内容：返回缓存同时更新
    },
    
    // 缓存有效期（毫秒）
    MAX_AGE: {
        STATIC: 7 * 24 * 60 * 60 * 1000,  // 7天
        API: 5 * 60 * 1000,                // 5分钟
        DYNAMIC: 24 * 60 * 60 * 1000       // 24小时
    },
    
    // 排除缓存的 URL
    EXCLUDE_PATTERNS: [
        /\/api\/auth\//,           // 认证接口
        /\/api\/login/,            // 登录
        /\/api\/logout/,           // 登出
        /\/socket\./,              // WebSocket
        /\.json$/                  // 配置文件
    ]
};

// 安装 Service Worker
self.addEventListener('install', (event) => {
    console.log('[SW] 安装中...');
    
    event.waitUntil(
        caches.open(CACHE_CONFIG.STATIC_CACHE)
            .then((cache) => {
                console.log('[SW] 预缓存静态资源');
                
                // 预缓存核心资源
                const coreResources = [
                    '/',
                    '/index.html',
                    '/dashboard/index.html',
                    '/dashboard/offline.html',
                    '/dashboard/api.js',
                    '/dashboard/auth.js',
                    '/dashboard/realtime.js',
                    '/dashboard/notifications.js',
                    '/dashboard/charts.js',
                    '/offline.html'
                ];
                
                return cache.addAll(coreResources).catch((error) => {
                    console.warn('[SW] 预缓存失败:', error);
                });
            })
            .then(() => self.skipWaiting())
    );
});

// 激活 Service Worker
self.addEventListener('activate', (event) => {
    console.log('[SW] 激活中...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => {
                            // 清理旧版本缓存
                            return name.startsWith('rainhoole-') && 
                                   name !== CACHE_CONFIG.STATIC_CACHE &&
                                   name !== CACHE_CONFIG.DYNAMIC_CACHE &&
                                   name !== CACHE_CONFIG.API_CACHE;
                        })
                        .map((name) => {
                            console.log('[SW] 清理旧缓存:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => self.clients.claim())
    );
});

// 拦截请求
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // 跳过非 GET 请求（POST/PUT/DELETE 等需要同步）
    if (request.method !== 'GET') {
        event.respondWith(handleNonGetRequest(request));
        return;
    }
    
    // 跳过跨域请求
    if (url.origin !== location.origin) {
        event.respondWith(handleExternalRequest(request));
        return;
    }
    
    // 选择缓存策略
    if (isStaticResource(url)) {
        event.respondWith(handleStaticRequest(request));
    } else if (isApiRequest(url)) {
        event.respondWith(handleApiRequest(request));
    } else if (isDynamicResource(url)) {
        event.respondWith(handleDynamicRequest(request));
    } else {
        event.respondWith(handleFallbackRequest(request));
    }
});

// 判断静态资源
function isStaticResource(url) {
    const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot'];
    return staticExtensions.some(ext => url.pathname.endsWith(ext)) || 
           url.pathname === '/' ||
           url.pathname.endsWith('.html');
}

// 判断 API 请求
function isApiRequest(url) {
    return url.pathname.startsWith('/api/');
}

// 判断动态资源
function isDynamicResource(url) {
    return url.pathname.startsWith('/dashboard/') || 
           url.pathname.includes('.html');
}

// 静态资源处理 - Cache First
async function handleStaticRequest(request) {
    const cache = await caches.open(CACHE_CONFIG.STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
        // 检查是否需要更新
        fetch(request).then((response) => {
            if (response.ok) {
                cache.put(request, response);
            }
        }).catch(() => {});
        
        return cachedResponse;
    }
    
    // 无缓存，从网络获取
    try {
        const response = await fetch(request);
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        // 返回离线页面
        return caches.match('/offline.html');
    }
}

// API 请求处理 - Network First
async function handleApiRequest(request) {
    const cache = await caches.open(CACHE_CONFIG.API_CACHE);
    
    try {
        const response = await fetch(request);
        if (response.ok) {
            // 缓存成功的响应
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        // 网络失败，回退到缓存
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // 返回离线响应
        return new Response(JSON.stringify({
            error: 'offline',
            message: '当前离线，无法获取数据',
            cached: false
        }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// 动态资源处理 - Stale While Revalidate
async function handleDynamicRequest(request) {
    const cache = await caches.open(CACHE_CONFIG.DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    // 同时发起网络请求更新缓存
    const fetchPromise = fetch(request).then((response) => {
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    }).catch(() => {
        // 网络请求失败，不做任何处理
        return cachedResponse;
    });
    
    // 优先返回缓存
    return cachedResponse || fetchPromise;
}

// 非 GET 请求处理
async function handleNonGetRequest(request) {
    try {
        const response = await fetch(request);
        return response;
    } catch (error) {
        // 离线时存储到 IndexedDB，等待同步
        const requestData = await request.clone().text();
        
        // 发送消息给客户端，告知需要离线存储
        const clients = await self.clients.matchAll();
        clients.forEach((client) => {
            client.postMessage({
                type: 'offline:queuerequest',
                method: request.method,
                url: request.url,
                body: requestData,
                headers: Object.fromEntries(request.headers.entries())
            });
        });
        
        // 返回成功响应（告诉应用已排队）
        return new Response(JSON.stringify({
            queued: true,
            message: '操作已排队，连线后自动同步'
        }), {
            status: 202,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// 外部请求处理
async function handleExternalRequest(request) {
    try {
        const response = await fetch(request);
        return response;
    } catch (error) {
        return new Response('离线', { status: 503 });
    }
}

// 回退请求
async function handleFallbackRequest(request) {
    const cache = await caches.open(CACHE_CONFIG.DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
        return cachedResponse;
    }
    
    return caches.match('/offline.html');
}

// 后台同步
self.addEventListener('sync', (event) => {
    console.log('[SW] 后台同步:', event.tag);
    
    if (event.tag === 'rainhoole-sync') {
        event.waitUntil(syncPendingOperations());
    }
});

// 同步待处理操作
async function syncPendingOperations() {
    // 通知客户端开始同步
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
        client.postMessage({
            type: 'offline:syncstart'
        });
    });
    
    // 这里会与主线程的 OfflineManager 配合完成同步
    // 实际同步逻辑在 offline.js 中实现
}

// 推送通知
self.addEventListener('push', (event) => {
    if (!event.data) return;
    
    const data = event.data.json();
    
    const options = {
        body: data.body,
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/'
        },
        actions: [
            { action: 'open', title: '打开' },
            { action: 'close', title: '关闭' }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// 通知点击
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'open') {
        event.waitUntil(
            clients.openWindow(event.notification.data.url)
        );
    }
});

// 消息处理
self.addEventListener('message', (event) => {
    const { type, data } = event.data;
    
    switch (type) {
        case 'offline:skipwaiting':
            self.skipWaiting();
            break;
            
        case 'offline:clearcache':
            caches.delete(CACHE_CONFIG.STATIC_CACHE);
            caches.delete(CACHE_CONFIG.DYNAMIC_CACHE);
            caches.delete(CACHE_CONFIG.API_CACHE);
            break;
            
        case 'offline:precache':
            caches.open(CACHE_CONFIG.STATIC_CACHE).then((cache) => {
                cache.addAll(data.resources);
            });
            break;
    }
});
