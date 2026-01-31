# clawVERSE Dashboard - 认证系统使用文档

## 概述

clawVERSE Dashboard 认证系统提供完整的用户认证功能，包括登录、注册、Token 管理、权限验证和会话管理。

## 快速开始

### 1. 引入认证模块

在 HTML 文件中添加：

```html
<script src="dashboard/auth.js"></script>
```

### 2. 初始化认证 UI

在页面加载时初始化：

```javascript
document.addEventListener('DOMContentLoaded', () => {
    AuthUI.init();
});
```

## API 参考

### AuthAPI - 认证操作

#### 登录
```javascript
const result = await AuthAPI.login(username, password);
// 返回: { success: true, data: { token, refreshToken, user } }
```

#### 注册
```javascript
const result = await AuthAPI.register({ username, password, email });
// 返回: { success: true, data: { user } }
```

#### 验证 Token
```javascript
const result = await AuthAPI.verify();
// 返回: { success: true, data: { user, token } }
```

#### 登出
```javascript
AuthAPI.logout();
```

### Permission - 权限检查

```javascript
// 检查是否已登录
Permission.isAuthenticated();  // true/false

// 获取当前用户
const user = Permission.getCurrentUser();

// 检查权限
Permission.hasPermission('read');  // true/false
Permission.hasRole('admin');       // true/false

// 多权限检查
Permission.hasAllPermissions(['read', 'write']);  // AND
Permission.hasAnyPermission(['read', 'admin']);   // OR
```

### Session - 会话管理

```javascript
// 启动会话监控
Session.start();

// 重置会话超时
Session.resetTimeout();

// 延长会话
Session.extend();

// 停止会话监控
Session.stop();
```

### AuthUI - UI 组件

```javascript
// 打开登录弹窗
AuthUI.openModal();

// 关闭登录弹窗
AuthUI.closeModal();

// 切换登录/注册模式
AuthUI.toggleAuthMode();

// 登出
AuthUI.logout();
```

### 路由保护

```javascript
// 需要登录
requireAuth(() => {
    // 执行需要登录的操作
    console.log('用户已登录');
});

// 需要特定权限
requirePermission('write', () => {
    // 执行需要写权限的操作
}, () => {
    // 无权限时的回退操作
    alert('没有写权限');
});

// 需要特定角色
requireRole('admin', () => {
    // 执行需要管理员角色的操作
});
```

## 演示账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 管理员 (全部权限) |
| user | user123 | 普通用户 (只读权限) |

## 配置选项

在 `auth.js` 中修改 `AUTH_CONFIG` 对象：

```javascript
const AUTH_CONFIG = {
  tokenKey: 'clawverse_token',           // Token 存储键名
  refreshTokenKey: 'clawverse_refresh_token',  // 刷新令牌存储键名
  userKey: 'clawverse_user',             // 用户信息存储键名
  tokenExpiryKey: 'clawverse_token_expiry',    // Token 过期时间存储键名
  sessionTimeout: 30 * 60 * 1000,        // 会话超时时间 (毫秒)
  refreshThreshold: 5 * 60 * 1000        // 刷新令牌阈值 (毫秒)
};
```

## 服务器端 API

### POST /api/auth/login

请求体：
```json
{
  "username": "admin",
  "password": "admin123"
}
```

响应：
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "abc123...",
    "user": {
      "id": "user-001",
      "username": "admin",
      "email": "admin@clawverse.com",
      "role": "admin",
      "permissions": ["read", "write", "delete", "admin"]
    }
  }
}
```

### POST /api/auth/register

请求体：
```json
{
  "username": "newuser",
  "password": "password123",
  "email": "user@example.com"
}
```

### POST /api/auth/verify

请求体：
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## 安全性说明

⚠️ **重要提示**：当前实现为演示版本，生产环境需考虑以下安全措施：

1. **密码哈希**：使用 bcrypt 或 Argon2 对密码进行哈希处理
2. **HTTPS**：生产环境必须使用 HTTPS
3. **Token 安全**：实现 Token 黑名单机制，支持主动登出
4. **CSRF 防护**：添加 CSRF Token 验证
5. **速率限制**：防止暴力破解攻击
6. **刷新令牌**：实现安全的 Token 刷新机制
7. **敏感数据**：不在客户端存储敏感信息

## 架构说明

### Token 结构 (JWT)

```
Header: { alg: 'HS256', typ: 'JWT' }
Payload: { userId, username, role, permissions, iat, exp }
Signature: HMAC-SHA256
```

### 存储方案

- **Token**: localStorage
- **刷新令牌**: localStorage
- **用户信息**: localStorage
- **过期时间**: localStorage

### 会话超时

- 默认 30 分钟无操作后自动登出
- 5 分钟前显示警告提示
- 用户活动自动重置超时计时器

## 常见问题

### Q: 如何修改会话超时时间？

修改 `AUTH_CONFIG.sessionTimeout` 值（毫秒）：

```javascript
sessionTimeout: 60 * 60 * 1000, // 1小时
```

### Q: 如何添加新权限？

1. 在 `usersDB` 中为用户添加新权限：
```javascript
permissions: ['read', 'write', 'custom']
```

2. 在 Permission 检查中使用：
```javascript
Permission.hasPermission('custom');
```

### Q: 如何禁用游客访问？

在页面加载时检查权限：

```javascript
document.addEventListener('DOMContentLoaded', () => {
    if (!Permission.isAuthenticated()) {
        AuthUI.openModal();
    }
});
```

## 更新日志

### v1.0.0 (2024-01-31)
- 实现基础登录/注册功能
- 添加 JWT Token 管理
- 实现权限验证系统
- 添加会话超时管理
- 提供 UI 组件和弹窗
