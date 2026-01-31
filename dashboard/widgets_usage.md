# Dashboard 小部件系统使用文档

## 概述

Dashboard 小部件系统是一个可配置、可拖拽的组件框架，允许用户自定义个性化的仪表盘布局。系统支持多种小部件类型，包括天气、时钟、统计卡片、待办事项和最近活动。

## 功能特性

### ✨ 核心功能
- **可配置小部件**：多种类型小部件，按需启用/禁用
- **拖拽排序**：支持自由拖拽调整小部件位置
- **持久化存储**：配置自动保存至 localStorage
- **实时更新**：时钟、天气等数据实时刷新

### 📦 支持的小部件

| 小部件 | 功能 | 配置项 |
|--------|------|--------|
| 🌤️ 天气 | 显示当前位置天气信息 | 城市、温度单位 |
| 🕐 时钟 | 显示当前时间 | 12/24小时制、显示日期 |
| 📊 统计卡片 | 显示关键指标数据 | 指标配置、趋势显示 |
| 📋 待办事项 | 任务管理 | 任务列表、添加/删除 |
| 🚀 最近活动 | 系统活动动态 | 活动数量限制 |

## 使用方法

### 基本操作

#### 启用/禁用小部件
点击小部件右上角的 📌 图标可切换启用状态。

#### 拖拽排序
1. 按住小部件标题栏
2. 拖动至目标位置
3. 释放完成排序（自动保存）

#### 重置布局
点击小部件区域顶部的「🔄 重置布局」按钮恢复默认配置。

### 待办事项

#### 添加任务
1. 在待办事项小部件底部的输入框中输入任务
2. 按回车或点击「+」按钮添加

#### 完成/删除任务
- 勾选复选框标记任务完成
- 点击「×」按钮删除任务

### 时钟配置

支持两种时间格式：
- **24小时制**（默认）：14:30:00
- **12小时制**：下午 2:30:00

可选择是否显示日期信息。

### 天气配置

可配置项：
- 城市名称（默认：北京）
- 温度单位（摄氏/华氏）

## API 参考

### WidgetSystem 类

#### 构造函数
```javascript
const widgetSystem = new WidgetSystem();
```

#### 方法

| 方法 | 参数 | 说明 |
|------|------|------|
| `toggleWidget(name)` | 小部件名称 | 启用/禁用小部件 |
| `addTodoItem()` | 无 | 添加待办事项 |
| `toggleTodoItem(index)` | 任务索引 | 切换任务完成状态 |
| `deleteTodoItem(index)` | 任务索引 | 删除任务 |
| `resetWidgetConfigs()` | 无 | 重置所有配置 |
| `addWidget(name, config)` | 名称、配置对象 | 添加新小部件 |
| `saveWidgetConfigs()` | 无 | 保存配置到存储 |

#### 配置结构

```javascript
{
    weather: {
        enabled: true,
        position: 0,
        config: {
            city: '北京',
            unit: 'celsius'
        }
    },
    clock: {
        enabled: true,
        position: 1,
        config: {
            format: '24h',
            showDate: true
        }
    },
    stats: {
        enabled: true,
        position: 2,
        config: {
            metrics: [
                { label: '指标名', value: 100, trend: '+10%', trendUp: true }
            ]
        }
    },
    todo: {
        enabled: true,
        position: 3,
        config: {
            items: [
                { text: '任务描述', completed: false }
            ]
        }
    },
    activity: {
        enabled: true,
        position: 4,
        config: {
            limit: 5,
            activities: [
                { agent: 'Agent名', action: '操作', time: '时间', status: 'success' }
            ]
        }
    }
}
```

## 自定义开发

### 添加新小部件

1. **定义渲染方法**：
```javascript
renderCustomWidget(config) {
    return `
        <div class="custom-widget">
            <h4>${config.title}</h4>
            <p>${config.content}</p>
        </div>
    `;
}
```

2. **在 switch 语句中添加**：
```javascript
case 'custom':
    return this.renderCustomWidget(config);
```

3. **注册小部件配置**：
```javascript
this.widgetConfigs.custom = {
    enabled: true,
    position: 5,
    config: { title: '自定义', content: '内容' }
};
```

### 事件处理

系统提供以下扩展点：

| 事件 | 触发时机 |
|------|----------|
| `widget:added` | 添加新小部件 |
| `widget:removed` | 移除小部件 |
| `widget:moved` | 移动小部件位置 |
| `widget:configchanged` | 配置变更 |

```javascript
document.addEventListener('widget:configchanged', (e) => {
    console.log('配置已更新:', e.detail);
});
```

## 样式定制

### CSS 变量

```css
:root {
    --widget-bg: var(--bg-secondary);
    --widget-border: var(--border-color);
    --widget-hover: rgba(99, 102, 241, 0.2);
}
```

### 动画效果

系统内置拖拽动画支持，可通过覆盖以下 CSS 调整：

```css
.widget {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}
```

## 浏览器兼容性

| 浏览器 | 最低版本 | 备注 |
|--------|----------|------|
| Chrome | 60+ | 完全支持 |
| Firefox | 55+ | 完全支持 |
| Safari | 11+ | 完全支持 |
| Edge | 79+ | 完全支持 |

## 常见问题

### Q: 配置丢失怎么办？
A: 点击「🔄 重置布局」按钮恢复默认配置。

### Q: 如何禁用某个小部件？
A: 点击小部件右上角的「📌」图标切换启用状态。

### Q: 拖拽不工作？
A: 确保浏览器支持 HTML5 Drag and Drop API。

### Q: 如何自定义天气城市？
A: 目前版本暂支持，后续版本将添加配置界面。

## 版本历史

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| 1.0.0 | 2024-01-31 | 初始发布，支持基础小部件和拖拽排序 |

## 相关文档

- [API 接口文档](dashboard/api.md)
- [通知系统文档](dashboard/notifications_usage.md)
- [主项目 README](../README.md)
