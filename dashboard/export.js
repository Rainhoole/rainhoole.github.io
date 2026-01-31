/**
 * 数据导出模块 (export.js)
 * 支持 CSV、JSON 格式导出，支持选择性导出和报告生成
 */

const ExportManager = (function() {
  'use strict';

  // 存储当前选中的项目
  let selectedItems = new Set();
  let currentViewData = [];

  /**
   * 工具函数：转义 CSV 特殊字符
   */
  function escapeCSV(str) {
    if (str === null || str === undefined) return '';
    const stringValue = String(str);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  }

  /**
   * 工具函数：下载文件
   */
  function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * 导出为 CSV 格式
   * @param {Array} data - 数据数组
   * @param {Array} headers - 列标题
   * @param {string} filename - 文件名
   */
  function exportToCSV(data, headers, filename = 'export.csv') {
    if (!data || data.length === 0) {
      console.warn('没有数据可导出');
      return false;
    }

    const headerRow = headers.map(escapeCSV).join(',');
    const dataRows = data.map(row => {
      return headers.map(header => {
        const key = header.key || header;
        return escapeCSV(row[key]);
      }).join(',');
    }).join('\n');

    const csvContent = `${headerRow}\n${dataRows}`;
    downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
    return true;
  }

  /**
   * 导出为 JSON 格式
   * @param {Array|Object} data - 数据
   * @param {string} filename - 文件名
   * @param {boolean} pretty - 是否格式化
   */
  function exportToJSON(data, filename = 'export.json', pretty = true) {
    const jsonContent = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
    downloadFile(jsonContent, filename, 'application/json;charset=utf-8;');
    return true;
  }

  /**
   * 导出选中的项目
   * @param {string} format - 'csv' 或 'json'
   */
  function exportSelected(format = 'csv') {
    if (selectedItems.size === 0) {
      alert('请先选择要导出的项目');
      return false;
    }

    const selectedData = currentViewData.filter(item => selectedItems.has(item.id));
    const timestamp = new Date().toISOString().slice(0, 10);
    
    if (format === 'csv') {
      return exportToCSV(selectedData, getDefaultHeaders(), `selected_export_${timestamp}.csv`);
    } else {
      return exportToJSON(selectedData, `selected_export_${timestamp}.json`);
    }
  }

  /**
   * 导出当前视图的所有数据
   * @param {string} format - 'csv' 或 'json'
   */
  function exportCurrentView(format = 'csv') {
    if (!currentViewData || currentViewData.length === 0) {
      alert('当前视图没有数据');
      return false;
    }

    const timestamp = new Date().toISOString().slice(0, 10);
    
    if (format === 'csv') {
      return exportToCSV(currentViewData, getDefaultHeaders(), `view_export_${timestamp}.csv`);
    } else {
      return exportToJSON(currentViewData, `view_export_${timestamp}.json`);
    }
  }

  /**
   * 导出所有数据（跨所有数据类型）
   * @param {string} format - 'csv' 或 'json'
   */
  async function exportAllData(format = 'json') {
    try {
      // 获取所有类型的数据
      const [agentsRes, proposalsRes, logsRes, tasksRes] = await Promise.all([
        fetch('/api/agents'),
        fetch('/api/proposals'),
        fetch('/api/logs'),
        fetch('/api/tasks')
      ]);

      const agents = await agentsRes.json();
      const proposals = await proposalsRes.json();
      const logs = await logsRes.json();
      const tasks = await tasksRes.json();

      const allData = {
        exportDate: new Date().toISOString(),
        summary: {
          agentsCount: agents.data?.length || 0,
          proposalsCount: proposals.data?.length || 0,
          logsCount: logs.data?.length || 0,
          tasksCount: tasks.data?.length || 0,
          totalCount: (agents.data?.length || 0) + (proposals.data?.length || 0) + 
                      (logs.data?.length || 0) + (tasks.data?.length || 0)
        },
        data: {
          agents: agents.data || [],
          proposals: proposals.data || [],
          logs: logs.data || [],
          tasks: tasks.data || []
        }
      };

      const timestamp = new Date().toISOString().slice(0, 10);
      if (format === 'json') {
        return exportToJSON(allData, `full_export_${timestamp}.json`);
      } else {
        // 导出为多个 CSV 文件（ZIP）
        alert('CSV 格式将导出为多个文件，请分别保存');
        exportToCSV(allData.data.agents, getAgentHeaders(), `agents_${timestamp}.csv`);
        exportToCSV(allData.data.proposals, getProposalHeaders(), `proposals_${timestamp}.csv`);
        exportToCSV(allData.data.logs, getLogHeaders(), `logs_${timestamp}.csv`);
        exportToCSV(allData.data.tasks, getTaskHeaders(), `tasks_${timestamp}.csv`);
        return true;
      }
    } catch (error) {
      console.error('导出所有数据失败:', error);
      alert('导出失败，请检查网络连接');
      return false;
    }
  }

  /**
   * 生成数据报告
   */
  async function generateReport() {
    try {
      const [agentsRes, proposalsRes, logsRes, tasksRes] = await Promise.all([
        fetch('/api/agents'),
        fetch('/api/proposals'),
        fetch('/api/logs'),
        fetch('/api/tasks')
      ]);

      const agents = await agentsRes.json();
      const proposals = await proposalsRes.json();
      const logs = await logsRes.json();
      const tasks = await tasksRes.json();

      // 生成统计报告
      const report = {
        title: '数据导出报告',
        generatedAt: new Date().toISOString(),
        summary: {
          totalAgents: agents.data?.length || 0,
          activeAgents: agents.data?.filter(a => a.status === 'active').length || 0,
          totalProposals: proposals.data?.length || 0,
          approvedProposals: proposals.data?.filter(p => p.status === 'approved').length || 0,
          pendingProposals: proposals.data?.filter(p => p.status === 'pending').length || 0,
          totalLogs: logs.data?.length || 0,
          errorLogs: logs.data?.filter(l => l.level === 'error').length || 0,
          warnLogs: logs.data?.filter(l => l.level === 'warn').length || 0,
          totalTasks: tasks.data?.length || 0,
          completedTasks: tasks.data?.filter(t => t.status === 'completed').length || 0
        },
        data: {
          agents: agents.data || [],
          proposals: proposals.data || [],
          logs: logs.data || [],
          tasks: tasks.data || []
        }
      };

      const timestamp = new Date().toISOString().slice(0, 10);
      return exportToJSON(report, `report_${timestamp}.json`);
    } catch (error) {
      console.error('生成报告失败:', error);
      alert('报告生成失败，请检查网络连接');
      return false;
    }
  }

  // 获取默认表头配置
  function getDefaultHeaders() {
    return [
      { key: 'id', label: 'ID' },
      { key: 'name', label: '名称' },
      { key: 'status', label: '状态' },
      { key: 'createdAt', label: '创建时间' }
    ];
  }

  function getAgentHeaders() {
    return ['id', 'name', 'status', 'lastSeen'];
  }

  function getProposalHeaders() {
    return ['id', 'title', 'status', 'createdAt'];
  }

  function getLogHeaders() {
    return ['id', 'level', 'message', 'timestamp'];
  }

  function getTaskHeaders() {
    return ['id', 'name', 'description', 'status', 'createdAt', 'updatedAt'];
  }

  // 选择性导出管理
  function toggleItemSelection(itemId) {
    if (selectedItems.has(itemId)) {
      selectedItems.delete(itemId);
    } else {
      selectedItems.add(itemId);
    }
    updateSelectionUI();
    return selectedItems.size;
  }

  function selectAll() {
    currentViewData.forEach(item => selectedItems.add(item.id));
    updateSelectionUI();
  }

  function clearSelection() {
    selectedItems.clear();
    updateSelectionUI();
  }

  function getSelectedCount() {
    return selectedItems.size;
  }

  function setCurrentViewData(data) {
    currentViewData = data || [];
  }

  // 更新选择 UI（可由外部覆盖）
  function updateSelectionUI() {
    const count = selectedItems.size;
    const countElement = document.getElementById('selected-count');
    if (countElement) {
      countElement.textContent = `已选择 ${count} 项`;
    }
  }

  // 公开 API
  return {
    // 导出功能
    exportToCSV,
    exportToJSON,
    exportCurrentView,
    exportSelected,
    exportAllData,
    generateReport,
    
    // 选择管理
    toggleItemSelection,
    selectAll,
    clearSelection,
    getSelectedCount,
    setCurrentViewData,
    
    // 工具
    downloadFile
  };
})();

// 导出按钮事件处理
document.addEventListener('DOMContentLoaded', function() {
  // 绑定导出按钮事件
  const exportCsvBtn = document.getElementById('export-csv-btn');
  const exportJsonBtn = document.getElementById('export-json-btn');
  const exportAllBtn = document.getElementById('export-all-btn');
  const exportReportBtn = document.getElementById('export-report-btn');

  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', () => ExportManager.exportCurrentView('csv'));
  }
  if (exportJsonBtn) {
    exportJsonBtn.addEventListener('click', () => ExportManager.exportCurrentView('json'));
  }
  if (exportAllBtn) {
    exportAllBtn.addEventListener('click', async () => {
      const format = confirm('导出为 JSON 格式？\n取消则导出为 CSV 格式。') ? 'json' : 'csv';
      await ExportManager.exportAllData(format);
    });
  }
  if (exportReportBtn) {
    exportReportBtn.addEventListener('click', () => ExportManager.generateReport());
  }
});

// 导出到全局
if (typeof window !== 'undefined') {
  window.ExportManager = ExportManager;
}
