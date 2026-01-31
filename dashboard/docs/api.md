# API 文档

## 概述

Rainhoole Dashboard 提供完整的 RESTful API 接口，支持数据查询、用户管理和系统操作。

## 基础信息

- **基础 URL**: `https://api.rainhoole.com/v1`
- **认证方式**: Bearer Token (JWT)
- **数据格式**: JSON
- **字符编码**: UTF-8

## 认证

所有 API 请求需要在 Header 中携带认证令牌：

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

### 登录获取 Token

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your_password"
}
```

**响应示例:**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600,
    "user": {
      "id": "123",
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
}
```

## 用户接口

### 获取用户信息

```http
GET /users/me
Authorization: Bearer YOUR_TOKEN
```

**响应示例:**

```json
{
  "success": true,
  "data": {
    "id": "123",
    "email": "user@example.com",
    "name": "John Doe",
    "avatar": "https://example.com/avatar.jpg",
    "role": "admin",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### 更新用户信息

```http
PUT /users/me
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "name": "John Updated",
  "avatar": "https://example.com/new-avatar.jpg"
}
```

## 数据接口

### 获取仪表盘数据

```http
GET /dashboard/stats
Authorization: Bearer YOUR_TOKEN
```

**响应示例:**

```json
{
  "success": true,
  "data": {
    "totalUsers": 1250,
    "activeUsers": 892,
    "revenue": 45890.50,
    "growth": 12.5,
    "chartData": {
      "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      "datasets": [
        {
          "label": "访问量",
          "data": [1200, 1900, 3000, 5000, 2300, 3400]
        }
      ]
    }
  }
}
```

### 获取图表数据

```http
GET /charts/:chartId
Authorization: Bearer YOUR_TOKEN
```

**路径参数:**

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| chartId | string | 是 | 图表 ID |

### 获取历史数据

```http
GET /analytics/history
Authorization: Bearer YOUR_TOKEN
Query Parameters:
- startDate: string (ISO 8601 格式)
- endDate: string (ISO 8601 格式)
- interval: 'day' | 'week' | 'month'
```

## 系统接口

### 获取系统状态

```http
GET /system/status
Authorization: Bearer YOUR_TOKEN
```

**响应示例:**

```json
{
  "success": true,
  "data": {
    "cpu": 45,
    "memory": 62,
    "disk": 78,
    "uptime": 86400,
    "status": "healthy"
  }
}
```

### 获取系统日志

```http
GET /system/logs
Authorization: Bearer YOUR_TOKEN
Query Parameters:
- level: 'info' | 'warn' | 'error'
- limit: number (默认 100)
- offset: number (默认 0)
```

## 错误处理

所有 API 响应遵循统一的错误格式：

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "人类可读的错误信息",
    "details": {}
  }
}
```

### 常见错误码

| 错误码 | HTTP 状态码 | 描述 |
|--------|-------------|------|
| UNAUTHORIZED | 401 | 未认证或 token 无效 |
| FORBIDDEN | 403 | 无权限访问 |
| NOT_FOUND | 404 | 资源不存在 |
| VALIDATION_ERROR | 400 | 请求参数错误 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |

## 速率限制

API 请求速率限制如下：

- 普通用户: 100 请求/分钟
- 认证用户: 500 请求/分钟
- 管理员: 2000 请求/分钟

速率限制响应头:

```http
X-RateLimit-Limit: 500
X-RateLimit-Remaining: 499
X-RateLimit-Reset: 1640995200
```

## SDK 和客户端库

官方支持以下 SDK：

- [JavaScript/TypeScript](https://github.com/rainhoole/js-sdk)
- [Python](https://github.com/rainhoole/python-sdk)
- [Go](https://github.com/rainhoole/go-sdk)

## 变更日志

API 版本管理遵循语义化版本控制。

当前版本: **v1**

如需升级指南，请参考 [API 迁移文档](migration-v1.md)。
