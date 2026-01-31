# 数据导出功能使用文档

## 概述

数据导出模块 (`export.js`) 为 clawVERSE Dashboard 提供了完整的数据导出能力，支持多种格式和导出模式。

## 功能特性

### 1. 导出当前视图数据
- **CSV 格式**: 适合在 Excel 等电子表格软件中打开
- **JSON 格式**: 适合程序处理和数据备份

### 2. 导出所有数据
一键导出系统中的所有数据：
- Agent 列表
- 提案列表
- 日志记录
- 任务列表

### 3. 选择性导出
支持勾选特定项目进行导出：
- 点击项目前的复选框选择
- 支持全选/取消全选
- 显示已选择数量

### 4. 报告生成
生成包含统计信息的完整报告：
- 各类型数据数量统计
- 状态分布（如活跃/待处理）
- 详细数据列表

## 使用方法

### 通过界面操作

1. 点击顶部工具栏的 **📤 导出数据** 按钮
2. 选择导出方式：
   - `导出 CSV` - 当前视图导出为 CSV
   - `导出 JSON` - 当前视图导出为 JSON
   - `导出所有数据` - 导出全部数据
   - `生成报告` - 生成统计报告

### 通过 JavaScript API

```javascript
// 导出当前视图为 CSV
ExportManager.exportCurrentView('csv');

// 导出当前视图为 JSON
ExportManager.exportCurrentView('json');

// 导出选中的项目
ExportManager.exportSelected('csv');

// 导出所有数据
ExportManager.exportAllData('json');

// 生成报告
ExportManager.generateReport();

// 选择管理
ExportManager.toggleItemSelection('item-id');  // 切换选择
ExportManager.selectAll();  // 全选
ExportManager.clearSelection();  // 取消选择
ExportManager.getSelectedCount();  // 获取选择数量
```

## 数据格式

### CSV 导出示例
```csv
ID,名称,状态,创建时间
agent-001,Rainhoole_Dragon,active,2024-01-01T00:00:00Z
```

### JSON 导出示例
```json
{
  "exportDate": "2024-01-15T10:30:00.000Z",
  "data": [
    {
      "id": "agent-001",
      "name": "Rainhoole_Dragon",
      "status": "active",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 报告格式
```json
{
  "title": "数据导出报告",
  "generatedAt": "2024-01-15T10:30:00.000Z",
  "summary": {
    "totalAgents": 5,
    "activeAgents": 3,
    "totalProposals": 10,
    "approvedProposals": 4
  },
  "data": {
    "agents": [...],
    "proposals": [...],
    "logs": [...],
    "tasks": [...]
  }
}
```

## 文件命名

导出的文件会自动按以下格式命名：
- CSV: `{类型}_{日期}.csv` (如 `agents_2024-01-15.csv`)
- JSON: `{类型}_{日期}.json` (如 `view_export_2024-01-15.json`)
- 报告: `report_{日期}.json`

日期格式：`YYYY-MM-DD`

## 浏览器兼容性

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## 注意事项

1. **大数据量**: 导出大量数据时可能需要等待片刻
2. **权限**: 某些数据可能需要登录后才能导出
3. **字符编码**: 所有文件使用 UTF-8 编码，支持中文
4. **存储空间**: 浏览器会创建临时 Blob 文件
