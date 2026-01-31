/**
 * clawVERSE Dashboard - Charts Module
 * 提供多种图表可视化组件
 * 
 * 包含：
 * - 任务完成率环形图
 * - Agent 性能雷达图
 * - 活动时间线
 * - 投票分布柱状图
 * - 系统负载仪表盘
 */

(function(global) {
    'use strict';

    // 图表默认配置
    const CHART_DEFAULTS = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    padding: 20,
                    usePointStyle: true,
                    font: {
                        size: 12
                    }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleFont: { size: 14 },
                bodyFont: { size: 13 },
                padding: 12,
                cornerRadius: 8
            }
        }
    };

    // 颜色主题
    const COLORS = {
        primary: ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'],
        success: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'],
        warning: ['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#fef3c7'],
        danger: ['#ef4444', '#f87171', '#fca5a5', '#fecaca', '#fee2e2'],
        info: ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'],
        gradient: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe']
    };

    // 创建渐变背景
    function createGradient(ctx, colorStart, colorEnd) {
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, colorStart);
        gradient.addColorStop(1, colorEnd);
        return gradient;
    }

    // ============================================
    // 任务完成率环形图 (Donut Chart)
    // ============================================
    const TaskCompletionChart = {
        init: function(containerId, data) {
            const container = document.getElementById(containerId);
            if (!container) {
                console.error(`Container ${containerId} not found`);
                return;
            }

            const canvas = document.createElement('canvas');
            container.appendChild(canvas);

            const ctx = canvas.getContext('2d');
            const total = data.total || 100;
            const completed = data.completed || 0;
            const pending = total - completed;
            const percentage = ((completed / total) * 100).toFixed(1);

            // 计算渐变颜色
            const gradientColors = createGradient(ctx, COLORS.primary[0], COLORS.primary[3]);

            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['已完成', '待完成'],
                    datasets: [{
                        data: [completed, pending],
                        backgroundColor: [
                            gradientColors,
                            'rgba(229, 231, 235, 0.5)'
                        ],
                        borderWidth: 0,
                        hoverOffset: 8
                    }]
                },
                options: {
                    ...CHART_DEFAULTS,
                    cutout: '75%',
                    plugins: {
                        ...CHART_DEFAULTS.plugins,
                        tooltip: {
                            ...CHART_DEFAULTS.plugins.tooltip,
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.parsed;
                                    const percentage = ((value / total) * 100).toFixed(1) + '%';
                                    return `${label}: ${value} (${percentage})`;
                                }
                            }
                        }
                    }
                },
                plugins: [{
                    id: 'centerText',
                    beforeDraw: function(chart) {
                        const width = chart.width;
                        const height = chart.height;
                        const ctx = chart.ctx;

                        ctx.restore();
                        const fontSize = (height / 160).toFixed(2);
                        ctx.font = `bold ${fontSize}em Inter, sans-serif`;
                        ctx.textBaseline = 'middle';
                        ctx.fillStyle = '#1f2937';

                        const text = percentage + '%';
                        const textX = Math.round((width - ctx.measureText(text).width) / 2);
                        const textY = height / 2 - 10;

                        ctx.fillText(text, textX, textY);

                        ctx.font = `${(height / 200).toFixed(2)}em Inter, sans-serif`;
                        ctx.fillStyle = '#9ca3af';
                        const subText = `${completed}/${total}`;
                        const subTextX = Math.round((width - ctx.measureText(subText).width) / 2);
                        ctx.fillText(subText, subTextX, textY + 30);

                        ctx.save();
                    }
                }]
            });
        }
    };

    // ============================================
    // Agent 性能雷达图 (Radar Chart)
    // ============================================
    const AgentPerformanceRadar = {
        init: function(containerId, agents) {
            const container = document.getElementById(containerId);
            if (!container) {
                console.error(`Container ${containerId} not found`);
                return;
            }

            const canvas = document.createElement('canvas');
            container.appendChild(canvas);

            const ctx = canvas.getContext('2d');
            
            // 准备数据
            const labels = ['响应速度', '准确率', '并发处理', '资源利用', '错误率', '稳定性'];
            const datasets = agents.map((agent, index) => ({
                label: agent.name,
                data: [
                    agent.responseTime || Math.random() * 100,
                    agent.accuracy || Math.random() * 100,
                    agent.concurrency || Math.random() * 100,
                    agent.resourceUtil || Math.random() * 100,
                    agent.errorRate || Math.random() * 100,
                    agent.stability || Math.random() * 100
                ],
                backgroundColor: COLORS.primary[index % COLORS.primary.length].replace(')', ', 0.2)').replace('rgb', 'rgba'),
                borderColor: COLORS.primary[index % COLORS.primary.length],
                borderWidth: 2,
                pointBackgroundColor: COLORS.primary[index % COLORS.primary.length],
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: COLORS.primary[index % COLORS.primary.length]
            }));

            new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: labels,
                    datasets: datasets
                },
                options: {
                    ...CHART_DEFAULTS,
                    scales: {
                        r: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                                stepSize: 20,
                                display: false
                            },
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            },
                            pointLabels: {
                                font: {
                                    size: 12,
                                    weight: '500'
                                },
                                color: '#4b5563'
                            },
                            angleLines: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            }
                        }
                    },
                    plugins: {
                        ...CHART_DEFAULTS.plugins,
                        legend: {
                            ...CHART_DEFAULTS.plugins.legend,
                            position: 'bottom'
                        }
                    }
                }
            });
        }
    };

    // ============================================
    // 活动时间线 (Activity Timeline)
    // ============================================
    const ActivityTimeline = {
        init: function(containerId, activities) {
            const container = document.getElementById(containerId);
            if (!container) {
                console.error(`Container ${containerId} not found`);
                return;
            }

            // 使用 Chart.js 绘制时间线
            const canvas = document.createElement('canvas');
            container.appendChild(canvas);

            const ctx = canvas.getContext('2d');
            
            // 准备数据 - 按小时统计活动
            const hours = [];
            const activityCounts = [];
            const colors = [];

            for (let i = 0; i < 24; i++) {
                const hour = i < 10 ? `0${i}:00` : `${i}:00`;
                hours.push(hour);
                
                // 模拟数据
                const count = activities?.hourly?.[i] || Math.floor(Math.random() * 50);
                activityCounts.push(count);
                
                // 根据活跃程度设置颜色
                const intensity = count / 50;
                if (intensity > 0.8) {
                    colors.push(COLORS.success[0]);
                } else if (intensity > 0.6) {
                    colors.push(COLORS.info[0]);
                } else if (intensity > 0.4) {
                    colors.push(COLORS.warning[0]);
                } else {
                    colors.push(COLORS.primary[1]);
                }
            }

            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: hours,
                    datasets: [{
                        label: '活动数量',
                        data: activityCounts,
                        backgroundColor: colors,
                        borderRadius: 4,
                        borderSkipped: false
                    }]
                },
                options: {
                    ...CHART_DEFAULTS,
                    scales: {
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                maxRotation: 45,
                                minRotation: 45,
                                font: {
                                    size: 10
                                }
                            }
                        },
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                            },
                            ticks: {
                                stepSize: 10
                            }
                        }
                    },
                    plugins: {
                        ...CHART_DEFAULTS.plugins,
                        legend: {
                            display: false
                        },
                        tooltip: {
                            ...CHART_DEFAULTS.plugins.tooltip,
                            callbacks: {
                                title: function(context) {
                                    return context[0].label + ' 的活动';
                                }
                            }
                        }
                    }
                },
                plugins: [{
                    id: 'timelineBackground',
                    beforeDraw: function(chart) {
                        const ctx = chart.ctx;
                        const chartArea = chart.chartArea;
                        
                        // 添加时间区域背景色
                        const hour = new Date().getHours();
                        
                        ctx.fillStyle = 'rgba(99, 102, 241, 0.05)';
                        const xStart = chart.scales.x.getPixelForValue(Math.max(0, hour - 2));
                        const xEnd = chart.scales.x.getPixelForValue(Math.min(23, hour + 2));
                        ctx.fillRect(xStart, chartArea.top, xEnd - xStart, chartArea.bottom - chartArea.top);
                    }
                }]
            });
        }
    };

    // ============================================
    // 投票分布柱状图 (Voting Distribution Bar Chart)
    // ============================================
    const VotingDistributionChart = {
        init: function(containerId, votingData) {
            const container = document.getElementById(containerId);
            if (!container) {
                console.error(`Container ${containerId} not found`);
                return;
            }

            const canvas = document.createElement('canvas');
            container.appendChild(canvas);

            const ctx = canvas.getContext('2d');
            
            // 准备数据
            const labels = votingData?.topics || ['议题 A', '议题 B', '议题 C', '议题 D', '议题 E'];
            const agree = votingData?.agree || [65, 72, 58, 81, 69];
            const disagree = votingData?.disagree || [20, 15, 25, 10, 18];
            const abstain = votingData?.abstain || [15, 13, 17, 9, 13];

            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: '赞成',
                            data: agree,
                            backgroundColor: COLORS.success[0],
                            borderRadius: 4,
                            borderSkipped: false
                        },
                        {
                            label: '反对',
                            data: disagree,
                            backgroundColor: COLORS.danger[0],
                            borderRadius: 4,
                            borderSkipped: false
                        },
                        {
                            label: '弃权',
                            data: abstain,
                            backgroundColor: COLORS.warning[2],
                            borderRadius: 4,
                            borderSkipped: false
                        }
                    ]
                },
                options: {
                    ...CHART_DEFAULTS,
                    scales: {
                        x: {
                            stacked: true,
                            grid: {
                                display: false
                            }
                        },
                        y: {
                            stacked: true,
                            beginAtZero: true,
                            max: 100,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                            },
                            ticks: {
                                callback: function(value) {
                                    return value + '%';
                                }
                            }
                        }
                    },
                    plugins: {
                        ...CHART_DEFAULTS.plugins,
                        tooltip: {
                            ...CHART_DEFAULTS.plugins.tooltip,
                            callbacks: {
                                label: function(context) {
                                    return context.dataset.label + ': ' + context.parsed.y + '%';
                                }
                            }
                        }
                    }
                }
            });
        }
    };

    // ============================================
    // 系统负载仪表盘 (System Load Dashboard)
    // ============================================
    const SystemLoadDashboard = {
        init: function(containerId, metrics) {
            const container = document.getElementById(containerId);
            if (!container) {
                console.error(`Container ${containerId} not found`);
                return;
            }

            // 清理容器
            container.innerHTML = '';

            // 创建指标卡片
            const metricsData = [
                {
                    label: 'CPU 使用率',
                    value: metrics?.cpu || 45,
                    unit: '%',
                    color: metrics?.cpu > 80 ? COLORS.danger[0] : (metrics?.cpu > 60 ? COLORS.warning[0] : COLORS.success[0]),
                    icon: '⚙️'
                },
                {
                    label: '内存使用率',
                    value: metrics?.memory || 68,
                    unit: '%',
                    color: metrics?.memory > 80 ? COLORS.danger[0] : (metrics?.memory > 60 ? COLORS.warning[0] : COLORS.success[0]),
                    icon: '🧠'
                },
                {
                    label: '磁盘使用率',
                    value: metrics?.disk || 52,
                    unit: '%',
                    color: metrics?.disk > 80 ? COLORS.danger[0] : (metrics?.disk > 60 ? COLORS.warning[0] : COLORS.success[0]),
                    icon: '💾'
                },
                {
                    label: '网络带宽',
                    value: metrics?.network || 34,
                    unit: '%',
                    color: metrics?.network > 80 ? COLORS.danger[0] : (metrics?.network > 60 ? COLORS.warning[0] : COLORS.success[0]),
                    icon: '🌐'
                }
            ];

            const grid = document.createElement('div');
            grid.className = 'metrics-grid';
            grid.style.cssText = `
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 16px;
                padding: 16px;
            `;

            metricsData.forEach(metric => {
                const card = document.createElement('div');
                card.className = 'metric-card';
                card.style.cssText = `
                    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                    border-radius: 12px;
                    padding: 20px;
                    text-align: center;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
                    transition: transform 0.2s ease;
                `;

                card.innerHTML = `
                    <div style="font-size: 28px; margin-bottom: 8px;">${metric.icon}</div>
                    <div style="color: #6b7280; font-size: 13px; margin-bottom: 4px;">${metric.label}</div>
                    <div style="font-size: 32px; font-weight: 700; color: ${metric.color};">
                        ${metric.value}<span style="font-size: 16px;">${metric.unit}</span>
                    </div>
                    <div style="margin-top: 12px; height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden;">
                        <div style="
                            width: ${metric.value}%;
                            height: 100%;
                            background: ${metric.color};
                            border-radius: 3px;
                            transition: width 0.5s ease;
                        "></div>
                    </div>
                `;

                grid.appendChild(card);
            });

            container.appendChild(grid);

            // 添加趋势图
            const trendContainer = document.createElement('div');
            trendContainer.style.cssText = 'margin-top: 20px; padding: 16px; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);';
            trendContainer.innerHTML = '<h4 style="margin: 0 0 16px 0; color: #374151; font-size: 14px;">负载趋势 (24h)</h4>';

            const trendCanvas = document.createElement('canvas');
            trendContainer.appendChild(trendCanvas);
            container.appendChild(trendContainer);

            // 绘制趋势图
            const trendCtx = trendCanvas.getContext('2d');
            const hours = [];
            const cpuData = [];
            const memoryData = [];

            for (let i = 0; i < 24; i++) {
                hours.push(i < 10 ? `0${i}` : `${i}`);
                cpuData.push(metrics?.history?.cpu?.[i] || Math.random() * 60 + 20);
                memoryData.push(metrics?.history?.memory?.[i] || Math.random() * 40 + 40);
            }

            new Chart(trendCtx, {
                type: 'line',
                data: {
                    labels: hours,
                    datasets: [
                        {
                            label: 'CPU',
                            data: cpuData,
                            borderColor: COLORS.primary[0],
                            backgroundColor: COLORS.primary[0].replace(')', ', 0.1)').replace('rgb', 'rgba'),
                            fill: true,
                            tension: 0.4,
                            pointRadius: 0,
                            borderWidth: 2
                        },
                        {
                            label: '内存',
                            data: memoryData,
                            borderColor: COLORS.info[0],
                            backgroundColor: COLORS.info[0].replace(')', ', 0.1)').replace('rgb', 'rgba'),
                            fill: true,
                            tension: 0.4,
                            pointRadius: 0,
                            borderWidth: 2
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                usePointStyle: true,
                                padding: 20
                            }
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            padding: 12,
                            cornerRadius: 8
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                maxTicksLimit: 12
                            }
                        },
                        y: {
                            beginAtZero: true,
                            max: 100,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                            },
                            ticks: {
                                callback: function(value) {
                                    return value + '%';
                                }
                            }
                        }
                    },
                    interaction: {
                        mode: 'nearest',
                        axis: 'x',
                        intersect: false
                    }
                }
            });
        },

        // 实时更新数据
        update: function(containerId, metrics) {
            // 重新初始化以更新数据
            this.init(containerId, metrics);
        }
    };

    // ============================================
    // 导出模块
    // ============================================
    global.ChartManager = {
        TaskCompletionChart,
        AgentPerformanceRadar,
        ActivityTimeline,
        VotingDistributionChart,
        SystemLoadDashboard,
        COLORS
    };

    // 自动初始化数据加载
    global.addEventListener('DOMContentLoaded', function() {
        // 尝试加载模拟数据
        if (typeof loadChartData === 'function') {
            const data = loadChartData();
            Object.keys(data).forEach(chartType => {
                const container = document.getElementById(chartType + '-container');
                if (container && ChartManager[chartType]) {
                    ChartManager[chartType].init(chartType + '-container', data[chartType]);
                }
            });
        }
    });

})(typeof window !== 'undefined' ? window : this);
