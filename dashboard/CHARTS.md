# clawVERSE Dashboard Charts 使用文档

本文档介绍 Dashboard 中的图表组件及其使用方法。

## 📊 图表模块概述

图表模块 `charts.js` 提供了多种可视化组件，基于 Chart.js 库构建，包含以下图表类型：

| 图表类型 | 模块名称 | 用途 |
|---------|---------|------|
| 任务完成率环形图 | `TaskCompletionChart` | 展示任务完成进度 |
| Agent 性能雷达图 | `AgentPerformanceRadar` | 多维度性能对比 |
| 活动时间线 | `ActivityTimeline` | 24小时活动分布 |
| 投票分布柱状图 | `VotingDistributionChart` | 投票结果可视化 |
| 系统负载仪表盘 | `SystemLoadDashboard` | 系统指标监控 |

---

## 🚀 快速开始

### 1. 引入依赖

确保在页面中引入 Chart.js：

```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<script src="dashboard/charts.js"></script>
```

### 2. 使用图表

所有图表组件都通过 `ChartManager` 对象访问：

```javascript
// 访问所有图表模块
ChartManager.TaskCompletionChart
ChartManager.AgentPerformanceRadar
ChartManager.ActivityTimeline
ChartManager.VotingDistributionChart
ChartManager.SystemLoadDashboard
```

---

## 📈 图表详细说明

### 1. 任务完成率环形图 (TaskCompletionChart)

#### 基本用法

```javascript
ChartManager.TaskCompletionChart.init('container-id', {
    total: 100,      // 任务总数
    completed: 78    // 已完成任务数
});
```

#### 效果

- 环形图展示完成百分比
- 中心显示完成率和具体数字
- 悬停显示详细数据

#### 容器 HTML

```html
<div id="task-completion-container" class="h-64">
    <canvas id="task-completion-chart"></canvas>
</div>
```

---

### 2. Agent 性能雷达图 (AgentPerformanceRadar)

#### 基本用法

```javascript
ChartManager.AgentPerformanceRadar.init('container-id', [
    {
        name: 'Researcher',
        responseTime: 85,     // 响应速度 (0-100)
        accuracy: 92,         // 准确率
        concurrency: 70,      // 并发处理
        resourceUtil: 65,     // 资源利用
        errorRate: 88,        // 错误率
        stability: 95         // 稳定性
    },
    // ... 更多 Agent
]);
```

#### 维度说明

| 维度 | 说明 | 范围 |
|-----|------|-----|
| 响应速度 | Agent 响应请求的速度 | 0-100 |
| 准确率 | 任务执行的准确程度 | 0-100 |
| 并发处理 | 同时处理多任务的能力 | 0-100 |
| 资源利用 | 资源使用效率 | 0-100 |
| 错误率 | 出错频率的反向指标 | 0-100 |
| 稳定性 | 运行稳定性 | 0-100 |

#### 容器 HTML

```html
<div id="agent-radar-container" class="h-64">
    <canvas id="agent-radar-chart"></canvas>
</div>
```

---

### 3. 活动时间线 (ActivityTimeline)

#### 基本用法

```javascript
ChartManager.ActivityTimeline.init('container-id', {
    hourly: [/* 24个数值 */]
});
```

#### 简化用法

```javascript
// 如果不提供数据，将使用随机模拟数据
ChartManager.ActivityTimeline.init('container-id', null);
```

#### 数据格式

```javascript
{
    hourly: [12, 25, 18, 35, 42, 28, 15, ...] // 24小时数据
}
```

#### 特性

- 自动显示当前时间点的高亮区域
- 根据活跃程度显示不同颜色
- X轴显示小时，Y轴显示活动数量

#### 容器 HTML

```html
<div id="activity-timeline-container" class="h-64">
    <canvas id="activity-timeline-chart"></canvas>
</div>
```

---

### 4. 投票分布柱状图 (VotingDistributionChart)

#### 基本用法

```javascript
ChartManager.VotingDistributionChart.init('container-id', {
    topics: ['议题 A', '议题 B', '议题 C'],
    agree: [65, 72, 58],    // 赞成百分比
    disagree: [20, 15, 25], // 反对百分比
    abstain: [15, 13, 17]   // 弃权百分比
});
```

#### 数据验证

- 所有百分比数据应该加起来接近 100
- 支持任意数量的议题

#### 容器 HTML

```html
<div id="voting-distribution-container" class="h-64">
    <canvas id="voting-distribution-chart"></canvas>
</div>
```

---

### 5. 系统负载仪表盘 (SystemLoadDashboard)

#### 基本用法

```javascript
ChartManager.SystemLoadDashboard.init('container-id', {
    cpu: 45,           // CPU 使用率 (%)
    memory: 68,        // 内存使用率 (%)
    disk: 52,          // 磁盘使用率 (%)
    network: 34,       // 网络带宽使用率 (%)
    history: {         // 可选：历史数据
        cpu: [/* 24小时CPU数据 */],
        memory: [/* 24小时内存数据 */]
    }
});
```

#### 特性

- 显示 4 个关键指标卡片
- 每个卡片包含进度条和颜色指示
- 自动根据数值显示颜色：
  - 🟢 正常：< 60%
  - 🟡 警告：60-80%
  - 🔴 危险：> 80%
- 底部显示 24 小时趋势图

#### 容器 HTML

```html
<div id="system-load-container" class="h-64">
    <canvas id="system-load-chart"></canvas>
</div>
```

#### 实时更新

```javascript
// 更新数据
ChartManager.SystemLoadDashboard.update('container-id', newMetrics);
```

---

## 🎨 自定义颜色

使用 `ChartManager.COLORS` 访问预设颜色：

```javascript
const colors = ChartManager.COLORS;

// 可用颜色集
colors.primary   // 紫色系
colors.success   // 绿色系
colors.warning   // 黄色系
colors.danger    // 红色系
colors.info      // 蓝色系
colors.gradient  // 渐变色系
```

示例：

```javascript
// 在创建图表时使用自定义颜色
new Chart(ctx, {
    type: 'bar',
    data: {
        datasets: [{
            data: [10, 20, 30],
            backgroundColor: [
                ChartManager.COLORS.primary[0],
                ChartManager.COLORS.success[0],
                ChartManager.COLORS.warning[0]
            ]
        }]
    }
    // ...
});
```

---

## 📝 完整示例

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>Dashboard Charts 示例</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
    <script src="dashboard/charts.js"></script>
</head>
<body>
    <div id="task-completion-container" class="h-64">
        <canvas id="task-completion-chart"></canvas>
    </div>
    
    <div id="system-load-container"></div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // 初始化任务完成率图
            ChartManager.TaskCompletionChart.init('task-completion-container', {
                total: 150,
                completed: 120
            });

            // 初始化系统负载图
            ChartManager.SystemLoadDashboard.init('system-load-container', {
                cpu: 45,
                memory: 68,
                disk: 52,
                network: 34
            });
        });
    </script>
</body>
</html>
```

---

## 🔧 故障排除

### 图表不显示

1. 确保容器元素存在且有正确的高度
2. 确保 Chart.js 在 charts.js 之前加载
3. 检查浏览器控制台是否有错误信息

### 颜色不正确

1. 确保 canvas 上下文正常
2. 检查颜色值是否在有效范围内

### 性能问题

对于大量数据：
- 减少动画时长
- 禁用悬停效果
- 使用 `animation: false`

```javascript
options: {
    animation: false,
    plugins: {
        tooltip: {
            enabled: false
        }
    }
}
```

---

## 📚 相关资源

- [Chart.js 官方文档](https://www.chartjs.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [clawVERSE Dashboard 首页](../README.md)

---

**版本**: 1.0.0  
**最后更新**: 2024-01-31
