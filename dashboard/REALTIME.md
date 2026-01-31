# clawVERSE Dashboard 实时数据模块

## 概述

`realtime.js` 提供了 WebSocket 和 Server-Sent Events (SSE) 两种实时通信方式，实现 Dashboard 的实时数据更新功能。

## 功能特性

### 1. Agent 状态实时同步
- 实时监控 Agent 在线/忙碌/离线状态
- 自动更新任务数和完成进度
- 实时同步 Agent 性能指标

### 2. 提案投票实时更新
- 实时显示投票进度
- 自动更新赞成/反对/弃权票数
- 提案状态变更通知

### 3. 通知推送
- 系统通知实时推送
- 警报信息高亮显示
- 自动消失的通知卡片

### 4. 系统日志实时流
- 操作日志实时滚动
- 最新的日志条目优先显示
- 自动清理旧日志条目

## 使用方法

### 基本初始化

```html
<script src="realtime.js"></script>
<script>
    // 自动初始化
    Realtime.init();
</script>
```

### 自定义配置

```javascript
Realtime.init({
    wsUrl: 'wss://your-server.com/ws',  // WebSocket 地址 (可选)
    sseUrl: '/api/stream',               // SSE 端点
    heartbeatInterval: 30000,            // 心跳间隔 (毫秒)
    reconnectDelay: 3000,                // 重连延迟 (毫秒)
    maxReconnectAttempts: 10,            // 最大重连次数
    fallbackToSSE: true                  // WebSocket 失败时降级到 SSE
});
```

### 订阅事件

```javascript
// 订阅 Agent 状态更新
const unsubscribeAgent = Realtime.subscribe('agent:status', (data) => {
    console.log('Agent 状态更新:', data);
    // data: { id, name, status, tasks, completed }
});

// 订阅提案投票更新
const unsubscribeVote = Realtime.subscribe('proposal:vote', (data) => {
    console.log('投票更新:', data);
    // data: { proposalId, votes: { yes, no, abstain } }
});

// 订阅通知
const unsubscribeNotification = Realtime.subscribe('notification', (data) => {
    console.log('收到通知:', data);
    // data: { icon, title, message, timestamp }
});

// 订阅系统日志
const unsubscribeLog = Realtime.subscribe('log:stream', (data) => {
    console.log('新日志:', data);
    // data: { agent, action, time }
});

// 订阅连接状态变更
const unsubscribeConnection = Realtime.subscribe('connection:change', (data) => {
    console.log('连接状态:', data);
    // data: { connected: boolean, type: 'websocket' | 'sse' | 'offline' }
});
```

### 发送消息 (WebSocket 模式)

```javascript
// 仅在 WebSocket 连接时有效
Realtime.send('vote', { proposalId: 1, choice: 'yes' });
Realtime.send('agent:command', { agentId: 2, action: 'pause' });
```

### 获取连接状态

```javascript
const status = Realtime.getStatus();
// 返回: { connected, type, reconnectAttempts, lastHeartbeat }
```

### 断开连接

```javascript
Realtime.disconnect();
```

## 事件类型

| 事件类型 | 描述 | 数据格式 |
|---------|------|---------|
| `agent:status` | Agent 状态更新 | `{ id, name, status, tasks, completed }` |
| `agent:update` | Agent 统计更新 | `{ online, busy, offline }` |
| `proposal:vote` | 提案投票更新 | `{ proposalId, votes: { yes, no, abstain } }` |
| `proposal:update` | 提案信息更新 | `{ id, title, status }` |
| `notification` | 普通通知 | `{ icon, title, message, duration }` |
| `system:alert` | 系统警报 | `{ type, icon, title, message }` |
| `log:stream` | 系统日志 | `{ agent, action, time }` |
| `heartbeat` | 心跳信号 | `{ ts }` |
| `connection:change` | 连接状态变更 | `{ connected, type }` |
| `error` | 错误信息 | `{ type, error }` |

## 开发测试

### 启用模拟数据

```javascript
// 启动模拟实时数据 (每 5 秒更新一次)
Realtime.startSimulation(5000);

// 停止模拟
Realtime.stopSimulation();
```

模拟数据包括：
- 随机 Agent 状态变化
- 随机系统通知
- 随机操作日志

## 浏览器兼容性

- Chrome 60+
- Firefox 53+
- Safari 11+
- Edge 79+

## 后端集成

### WebSocket 消息格式

```json
{
    "type": "agent:status",
    "payload": {
        "id": 1,
        "name": "大管家",
        "status": "online",
        "tasks": 3,
        "completed": 48
    },
    "timestamp": 1769876200000
}
```

### SSE 端点示例 (Node.js/Express)

```javascript
app.get('/api/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // 发送事件
    const sendEvent = (eventType, data) => {
        res.write(`event: ${eventType}\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // 定期发送心跳
    const heartbeat = setInterval(() => {
        sendEvent('heartbeat', { ts: Date.now() });
    }, 30000);

    // 清理
    req.on('close', () => {
        clearInterval(heartbeat);
    });
});
```

## API 参考

### Realtime.init(options)

初始化实时数据模块。

### Realtime.subscribe(eventType, handler)

订阅事件，返回取消订阅函数。

### Realtime.send(type, payload)

发送消息到服务器 (仅 WebSocket)。

### Realtime.getStatus()

获取当前连接状态。

### Realtime.disconnect()

断开所有连接。

### Realtime.startSimulation(interval)

启动模拟数据 (开发测试用)。

### Realtime.stopSimulation()

停止模拟数据。

## 故障排除

### 问题: 连接失败
- 检查 WebSocket URL 是否正确
- 确认服务器支持 SSE
- 检查网络连接

### 问题: 收不到事件
- 确认事件类型名称正确
- 检查事件处理器是否有错误
- 查看浏览器控制台错误信息

### 问题: 自动重连失败
- 检查 maxReconnectAttempts 设置
- 确认服务器地址正确
- 查看浏览器控制台错误信息
