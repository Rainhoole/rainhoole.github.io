/**
 * Batch Operations Module - 批量操作模块
 * 提供批量选择、更新状态、删除、导出和操作历史功能
 */

class BatchOperations {
    constructor() {
        this.selectedItems = new Set();
        this.operationHistory = [];
        this.isProcessing = false;
        this.batchActions = {
            status: ['active', 'paused', 'maintenance', 'archived'],
            priority: ['low', 'medium', 'high', 'critical'],
            tags: []
        };
        this.init();
    }

    init() {
        this.loadOperationHistory();
        this.bindGlobalEvents();
        this.setupKeyboardShortcuts();
    }

    /**
     * 批量选择/取消选择 Agent
     */
    toggleSelection(itemId, forceSelect = null) {
        if (forceSelect === true) {
            this.selectedItems.add(itemId);
        } else if (forceSelect === false) {
            this.selectedItems.delete(itemId);
        } else {
            if (this.selectedItems.has(itemId)) {
                this.selectedItems.delete(itemId);
            } else {
                this.selectedItems.add(itemId);
            }
        }
        this.updateSelectionUI();
        return this.selectedItems.has(itemId);
    }

    /**
     * 全选/取消全选
     */
    toggleSelectAll(items) {
        if (this.selectedItems.size === items.length) {
            this.selectedItems.clear();
        } else {
            items.forEach(item => this.selectedItems.add(item.id || item));
        }
        this.updateSelectionUI();
    }

    /**
     * 根据条件选择
     */
    selectByCondition(condition) {
        const items = this.getAllItems();
        items.forEach(item => {
            if (condition(item)) {
                this.selectedItems.add(item.id || item);
            }
        });
        this.updateSelectionUI();
    }

    /**
     * 根据状态选择
     */
    selectByStatus(status) {
        this.selectByCondition(item => item.status === status);
    }

    /**
     * 清空选择
     */
    clearSelection() {
        this.selectedItems.clear();
        this.updateSelectionUI();
    }

    /**
     * 更新选择状态 UI
     */
    updateSelectionUI() {
        // 更新批量操作栏显示
        const batchBar = document.getElementById('batch-action-bar');
        if (batchBar) {
            if (this.selectedItems.size > 0) {
                batchBar.classList.remove('hidden');
                document.getElementById('selected-count').textContent = this.selectedItems.size;
            } else {
                batchBar.classList.add('hidden');
            }
        }

        // 更新复选框状态
        document.querySelectorAll('[data-batch-item]').forEach(checkbox => {
            const itemId = checkbox.dataset.batchItem;
            checkbox.checked = this.selectedItems.has(itemId);
        });

        // 更新全选框状态
        const selectAllCheckbox = document.getElementById('select-all-checkbox');
        if (selectAllCheckbox) {
            const allItems = this.getAllItems();
            if (allItems.length === 0) {
                selectAllCheckbox.checked = false;
                selectAllCheckbox.indeterminate = false;
            } else if (this.selectedItems.size === allItems.length) {
                selectAllCheckbox.checked = true;
                selectAllCheckbox.indeterminate = false;
            } else if (this.selectedItems.size > 0) {
                selectAllCheckbox.checked = false;
                selectAllCheckbox.indeterminate = true;
            } else {
                selectAllCheckbox.checked = false;
                selectAllCheckbox.indeterminate = false;
            }
        }

        // 触发事件
        window.dispatchEvent(new CustomEvent('batchSelectionChanged', {
            detail: {
                selectedCount: this.selectedItems.size,
                selectedItems: Array.from(this.selectedItems)
            }
        }));
    }

    /**
     * 批量更新状态
     */
    async batchUpdateStatus(newStatus) {
        if (this.isProcessing || this.selectedItems.size === 0) return null;

        const items = Array.from(this.selectedItems);
        const previousStatus = new Map();

        // 记录操作前状态
        items.forEach(id => {
            const item = this.findItemById(id);
            if (item) previousStatus.set(id, item.status);
        });

        this.isProcessing = true;
        this.showBatchProgress(true, '正在更新状态...');

        try {
            // 模拟 API 调用
            await this.simulateBatchOperation(items.length);

            // 执行状态更新
            items.forEach(id => {
                const item = this.findItemById(id);
                if (item) item.status = newStatus;
            });

            // 记录操作历史
            this.addToHistory({
                type: 'status_update',
                action: '批量更新状态',
                targetStatus: newStatus,
                affectedItems: items.length,
                items: items,
                previousStatus: Object.fromEntries(previousStatus),
                newStatus: newStatus
            });

            this.showNotification(`成功更新 ${items.length} 个项目的状态为: ${newStatus}`, 'success');
            this.clearSelection();
            return { success: true, count: items.length };
        } catch (error) {
            this.showNotification('状态更新失败: ' + error.message, 'error');
            return { success: false, error: error.message };
        } finally {
            this.isProcessing = false;
            this.showBatchProgress(false);
        }
    }

    /**
     * 批量更新优先级
     */
    async batchUpdatePriority(newPriority) {
        if (this.isProcessing || this.selectedItems.size === 0) return null;

        const items = Array.from(this.selectedItems);
        this.isProcessing = true;
        this.showBatchProgress(true, '正在更新优先级...');

        try {
            await this.simulateBatchOperation(items.length);

            items.forEach(id => {
                const item = this.findItemById(id);
                if (item) item.priority = newPriority;
            });

            this.addToHistory({
                type: 'priority_update',
                action: '批量更新优先级',
                targetPriority: newPriority,
                affectedItems: items.length,
                items: items
            });

            this.showNotification(`成功更新 ${items.length} 个项目的优先级为: ${newPriority}`, 'success');
            this.clearSelection();
            return { success: true, count: items.length };
        } catch (error) {
            this.showNotification('优先级更新失败: ' + error.message, 'error');
            return { success: false, error: error.message };
        } finally {
            this.isProcessing = false;
            this.showBatchProgress(false);
        }
    }

    /**
     * 批量删除
     */
    async batchDelete(options = {}) {
        if (this.isProcessing || this.selectedItems.size === 0) return null;

        const { confirm = true, permanent = false } = options;
        const items = Array.from(this.selectedItems);

        if (confirm && !await this.showConfirmDialog(
            `确认删除`,
            `确定要删除选中的 ${items.length} 个项目吗？${permanent ? '此操作不可恢复！' : '可以稍后恢复。'}`
        )) {
            return { success: false, cancelled: true };
        }

        this.isProcessing = true;
        this.showBatchProgress(true, permanent ? '永久删除中...' : '删除中...');

        try {
            await this.simulateBatchOperation(items.length, permanent ? 500 : 200);

            // 记录操作历史
            this.addToHistory({
                type: 'delete',
                action: permanent ? '永久删除' : '删除到回收站',
                affectedItems: items.length,
                items: items,
                permanent: permanent
            });

            // 从列表中移除
            items.forEach(id => this.removeItemById(id));

            this.showNotification(
                `${permanent ? '永久删除' : '删除'}了 ${items.length} 个项目`,
                'success'
            );
            this.clearSelection();
            return { success: true, count: items.length };
        } catch (error) {
            this.showNotification('删除失败: ' + error.message, 'error');
            return { success: false, error: error.message };
        } finally {
            this.isProcessing = false;
            this.showBatchProgress(false);
        }
    }

    /**
     * 批量恢复
     */
    async batchRestore() {
        if (this.isProcessing || this.selectedItems.size === 0) return null;

        const items = Array.from(this.selectedItems);
        this.isProcessing = true;
        this.showBatchProgress(true, '恢复中...');

        try {
            await this.simulateBatchOperation(items.length);

            this.addToHistory({
                type: 'restore',
                action: '批量恢复',
                affectedItems: items.length,
                items: items
            });

            this.showNotification(`成功恢复了 ${items.length} 个项目`, 'success');
            this.clearSelection();
            return { success: true, count: items.length };
        } catch (error) {
            this.showNotification('恢复失败: ' + error.message, 'error');
            return { success: false, error: error.message };
        } finally {
            this.isProcessing = false;
            this.showBatchProgress(false);
        }
    }

    /**
     * 批量导出
     */
    async batchExport(format = 'json') {
        if (this.selectedItems.size === 0) {
            this.showNotification('请先选择要导出的项目', 'warning');
            return { success: false, error: 'No items selected' };
        }

        const items = Array.from(this.selectedItems).map(id => this.findItemById(id)).filter(Boolean);
        let exportData;
        let filename;
        let mimeType;

        switch (format) {
            case 'json':
                exportData = JSON.stringify(items, null, 2);
                filename = `batch-export-${Date.now()}.json`;
                mimeType = 'application/json';
                break;
            case 'csv':
                exportData = this.convertToCSV(items);
                filename = `batch-export-${Date.now()}.csv`;
                mimeType = 'text/csv';
                break;
            case 'excel':
                // 使用 Excel 导出
                exportData = this.convertToExcel(items);
                filename = `batch-export-${Date.now()}.xlsx`;
                mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                break;
            default:
                exportData = JSON.stringify(items, null, 2);
                filename = `batch-export-${Date.now()}.json`;
                mimeType = 'application/json';
        }

        // 记录操作历史
        this.addToHistory({
            type: 'export',
            action: `批量导出 (${format.toUpperCase()})`,
            affectedItems: items.length,
            format: format,
            items: items
        });

        // 下载文件
        this.downloadFile(exportData, filename, mimeType);
        this.showNotification(`成功导出 ${items.length} 个项目`, 'success');

        return { success: true, count: items.length, format: format };
    }

    /**
     * 批量添加标签
     */
    async batchAddTags(tags) {
        if (this.isProcessing || this.selectedItems.size === 0) return null;

        const items = Array.from(this.selectedItems);
        this.isProcessing = true;
        this.showBatchProgress(true, '添加标签中...');

        try {
            await this.simulateBatchOperation(items.length);

            items.forEach(id => {
                const item = this.findItemById(id);
                if (item) {
                    item.tags = item.tags || [];
                    tags.forEach(tag => {
                        if (!item.tags.includes(tag)) {
                            item.tags.push(tag);
                        }
                    });
                }
            });

            this.addToHistory({
                type: 'tags_add',
                action: '批量添加标签',
                tags: tags,
                affectedItems: items.length,
                items: items
            });

            this.showNotification(`成功为 ${items.length} 个项目添加标签: ${tags.join(', ')}`, 'success');
            this.clearSelection();
            return { success: true, count: items.length };
        } catch (error) {
            this.showNotification('添加标签失败: ' + error.message, 'error');
            return { success: false, error: error.message };
        } finally {
            this.isProcessing = false;
            this.showBatchProgress(false);
        }
    }

    /**
     * 批量移除标签
     */
    async batchRemoveTags(tags) {
        if (this.isProcessing || this.selectedItems.size === 0) return null;

        const items = Array.from(this.selectedItems);
        this.isProcessing = true;
        this.showBatchProgress(true, '移除标签中...');

        try {
            await this.simulateBatchOperation(items.length);

            items.forEach(id => {
                const item = this.findItemById(id);
                if (item && item.tags) {
                    item.tags = item.tags.filter(tag => !tags.includes(tag));
                }
            });

            this.addToHistory({
                type: 'tags_remove',
                action: '批量移除标签',
                tags: tags,
                affectedItems: items.length,
                items: items
            });

            this.showNotification(`成功从 ${items.length} 个项目移除标签: ${tags.join(', ')}`, 'success');
            this.clearSelection();
            return { success: true, count: items.length };
        } catch (error) {
            this.showNotification('移除标签失败: ' + error.message, 'error');
            return { success: false, error: error.message };
        } finally {
            this.isProcessing = false;
            this.showBatchProgress(false);
        }
    }

    /**
     * 批量分配给用户
     */
    async batchAssignTo(userId) {
        if (this.isProcessing || this.selectedItems.size === 0) return null;

        const items = Array.from(this.selectedItems);
        this.isProcessing = true;
        this.showBatchProgress(true, '分配中...');

        try {
            await this.simulateBatchOperation(items.length);

            items.forEach(id => {
                const item = this.findItemById(id);
                if (item) item.assignedTo = userId;
            });

            this.addToHistory({
                type: 'assign',
                action: '批量分配',
                assignee: userId,
                affectedItems: items.length,
                items: items
            });

            this.showNotification(`成功分配 ${items.length} 个项目给用户`, 'success');
            this.clearSelection();
            return { success: true, count: items.length };
        } catch (error) {
            this.showNotification('分配失败: ' + error.message, 'error');
            return { success: false, error: error.message };
        } finally {
            this.isProcessing = false;
            this.showBatchProgress(false);
        }
    }

    /**
     * 执行自定义批量操作
     */
    async executeCustomOperation(operation) {
        if (this.isProcessing || this.selectedItems.size === 0) return null;

        const items = Array.from(this.selectedItems);
        this.isProcessing = true;
        this.showBatchProgress(true, operation.name + '中...');

        try {
            const result = await operation.execute(items, this);

            this.addToHistory({
                type: 'custom',
                action: operation.name,
                operationId: operation.id,
                affectedItems: items.length,
                items: items,
                result: result
            });

            this.showNotification(`成功执行 ${operation.name}`, 'success');
            return { success: true, result: result };
        } catch (error) {
            this.showNotification(`${operation.name} 失败: ` + error.message, 'error');
            return { success: false, error: error.message };
        } finally {
            this.isProcessing = false;
            this.showBatchProgress(false);
        }
    }

    /**
     * 获取操作历史
     */
    getOperationHistory(filter = {}) {
        let history = [...this.operationHistory];

        if (filter.type) {
            history = history.filter(h => h.type === filter.type);
        }
        if (filter.startDate) {
            history = history.filter(h => h.timestamp >= filter.startDate);
        }
        if (filter.endDate) {
            history = history.filter(h => h.timestamp <= filter.endDate);
        }

        return history.sort((a, b) => b.timestamp - a.timestamp);
    }

    /**
     * 添加到操作历史
     */
    addToHistory(entry) {
        const historyEntry = {
            id: this.generateId(),
            timestamp: Date.now(),
            ...entry
        };
        this.operationHistory.unshift(historyEntry);
        this.saveOperationHistory();

        // 触发事件
        window.dispatchEvent(new CustomEvent('batchHistoryChanged', {
            detail: { entry: historyEntry }
        }));

        return historyEntry;
    }

    /**
     * 清空操作历史
     */
    clearHistory() {
        this.operationHistory = [];
        this.saveOperationHistory();
        this.showNotification('操作历史已清空', 'info');
    }

    /**
     * 导出操作历史
     */
    exportHistory(format = 'json') {
        const history = this.getOperationHistory();
        let exportData;
        let filename;

        if (format === 'json') {
            exportData = JSON.stringify(history, null, 2);
            filename = `batch-history-${Date.now()}.json`;
        } else {
            exportData = this.convertHistoryToCSV(history);
            filename = `batch-history-${Date.now()}.csv`;
        }

        this.downloadFile(exportData, filename, format === 'json' ? 'application/json' : 'text/csv');
        this.showNotification('操作历史已导出', 'success');
    }

    /**
     * 显示/隐藏批量操作进度条
     */
    showBatchProgress(show, text = '') {
        const progressBar = document.getElementById('batch-progress');
        const progressText = document.getElementById('batch-progress-text');
        if (progressBar) {
            if (show) {
                progressBar.classList.remove('hidden');
                if (progressText) progressText.textContent = text;
            } else {
                progressBar.classList.add('hidden');
            }
        }
    }

    /**
     * 显示通知
     */
    showNotification(message, type = 'info') {
        if (window.showNotification) {
            showNotification(message, type);
        } else {
            console.log(`[Batch ${type}]: ${message}`);
        }
    }

    /**
     * 显示确认对话框
     */
    showConfirmDialog(title, message) {
        return new Promise(resolve => {
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
            modal.innerHTML = `
                <div class="glass rounded-xl p-6 max-w-md w-full mx-4">
                    <h3 class="text-lg font-bold mb-4">${title}</h3>
                    <p class="text-gray-300 mb-6">${message}</p>
                    <div class="flex justify-end gap-3">
                        <button id="cancel-btn" class="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-500 transition">取消</button>
                        <button id="confirm-btn" class="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 transition">确认</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            modal.querySelector('#cancel-btn').addEventListener('click', () => {
                modal.remove();
                resolve(false);
            });

            modal.querySelector('#confirm-btn').addEventListener('click', () => {
                modal.remove();
                resolve(true);
            });
        });
    }

    /**
     * 下载文件
     */
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * 转换为 CSV 格式
     */
    convertToCSV(items) {
        if (items.length === 0) return '';

        const headers = Object.keys(items[0]);
        const rows = items.map(item =>
            headers.map(h => {
                const value = item[h];
                if (typeof value === 'string' && value.includes(',')) {
                    return `"${value}"`;
                }
                return value;
            }).join(',')
        );

        return [headers.join(','), ...rows].join('\n');
    }

    /**
     * 转换为 Excel 格式 (简化版 - 生成 CSV)
     */
    convertToExcel(items) {
        return this.convertToCSV(items);
    }

    /**
     * 转换历史记录为 CSV
     */
    convertHistoryToCSV(history) {
        if (history.length === 0) return '';

        const headers = ['ID', '时间戳', '类型', '操作', '影响项目数', '详情'];
        const rows = history.map(h => [
            h.id,
            new Date(h.timestamp).toISOString(),
            h.type,
            h.action,
            h.affectedItems,
            JSON.stringify(h)
        ].map(v => {
            const str = String(v);
            if (str.includes(',')) return `"${str}"`;
            return str;
        }).join(','));

        return [headers.join(','), ...rows].join('\n');
    }

    /**
     * 模拟批量操作延迟
     */
    simulateBatchOperation(count, baseDelay = 100) {
        return new Promise(resolve => {
            const delay = baseDelay + Math.random() * baseDelay;
            setTimeout(resolve, delay * Math.min(count, 10));
        });
    }

    /**
     * 生成唯一 ID
     */
    generateId() {
        return 'batch_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 绑定全局事件
     */
    bindGlobalEvents() {
        // 点击空白处取消选择
        document.addEventListener('click', (e) => {
            if (!e.target.closest('[data-batch-item]') &&
                !e.target.closest('#batch-action-bar') &&
                !e.target.closest('.batch-dropdown')) {
                // 不清空选择，仅用于其他逻辑
            }
        });
    }

    /**
     * 设置键盘快捷键
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + A 全选
            if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
                e.preventDefault();
                const items = this.getAllItems();
                if (items.length > 0) {
                    this.toggleSelectAll(items);
                    this.showNotification(`已选择 ${items.length} 个项目`, 'info');
                }
            }

            // Escape 取消选择
            if (e.key === 'Escape') {
                this.clearSelection();
            }

            // Delete 删除
            if (e.key === 'Delete') {
                if (this.selectedItems.size > 0) {
                    this.batchDelete();
                }
            }
        });
    }

    /**
     * 保存操作历史到本地存储
     */
    saveOperationHistory() {
        try {
            localStorage.setItem('batch_operation_history', JSON.stringify(this.operationHistory.slice(0, 100)));
        } catch (e) {
            console.warn('无法保存操作历史:', e);
        }
    }

    /**
     * 从本地存储加载操作历史
     */
    loadOperationHistory() {
        try {
            const saved = localStorage.getItem('batch_operation_history');
            if (saved) {
                this.operationHistory = JSON.parse(saved);
            }
        } catch (e) {
            console.warn('无法加载操作历史:', e);
            this.operationHistory = [];
        }
    }

    /**
     * 获取所有项目 (需要根据实际数据源实现)
     */
    getAllItems() {
        // 默认返回空数组，具体实现需要根据页面数据源重写
        return [];
    }

    /**
     * 根据 ID 查找项目
     */
    findItemById(id) {
        const items = this.getAllItems();
        return items.find(item => (item.id || item) === id);
    }

    /**
     * 根据 ID 移除项目
     */
    removeItemById(id) {
        const items = this.getAllItems();
        const index = items.findIndex(item => (item.id || item) === id);
        if (index !== -1) {
            items.splice(index, 1);
        }
    }

    /**
     * 获取选中数量
     */
    getSelectedCount() {
        return this.selectedItems.size;
    }

    /**
     * 获取选中的项目
     */
    getSelectedItems() {
        return Array.from(this.selectedItems).map(id => this.findItemById(id)).filter(Boolean);
    }

    /**
     * 是否正在处理
     */
    isBusy() {
        return this.isProcessing;
    }
}

// 导出全局实例
window.BatchOperations = new BatchOperations();
