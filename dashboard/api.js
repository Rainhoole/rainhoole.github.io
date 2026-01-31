const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

// ============== 模拟数据存储 ==============
const dataStore = {
  agents: [
    { id: 'agent-001', name: 'Rainhoole_Dragon', status: 'active', lastSeen: new Date().toISOString() },
    { id: 'agent-002', name: 'TaskManager', status: 'idle', lastSeen: new Date().toISOString() },
    { id: 'agent-003', name: 'DataProcessor', status: 'running', lastSeen: new Date().toISOString() }
  ],
  proposals: [
    { id: 'prop-001', title: '系统优化建议', status: 'pending', createdAt: new Date().toISOString() },
    { id: 'prop-002', title: '新功能开发计划', status: 'approved', createdAt: new Date().toISOString() }
  ],
  logs: [
    { id: 'log-001', level: 'info', message: '系统启动成功', timestamp: new Date().toISOString() },
    { id: 'log-002', level: 'warn', message: '内存使用率较高', timestamp: new Date().toISOString() },
    { id: 'log-003', level: 'error', message: '连接超时', timestamp: new Date().toISOString() }
  ],
  tasks: []
};

// ============== 任务状态管理 ==============
const taskStatus = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

function createTask(name, description) {
  const task = {
    id: `task-${Date.now()}`,
    name,
    description,
    status: taskStatus.PENDING,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  dataStore.tasks.push(task);
  return task;
}

function updateTaskStatus(taskId, status) {
  const task = dataStore.tasks.find(t => t.id === taskId);
  if (task) {
    task.status = status;
    task.updatedAt = new Date().toISOString();
  }
  return task;
}

function getAllTasks() {
  return dataStore.tasks;
}

// ============== API 路由处理 ==============
const routes = {
  // /api/agents - Agent 管理
  'GET:/api/agents': (req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, data: dataStore.agents }));
  },
  
  'POST:/api/agents': (req, res) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const agent = JSON.parse(body);
      agent.id = `agent-${Date.now()}`;
      agent.status = 'active';
      agent.lastSeen = new Date().toISOString();
      dataStore.agents.push(agent);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: agent }));
    });
  },

  // /api/proposals - 提案管理
  'GET:/api/proposals': (req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, data: dataStore.proposals }));
  },
  
  'POST:/api/proposals': (req, res) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const proposal = JSON.parse(body);
      proposal.id = `prop-${Date.now()}`;
      proposal.status = 'pending';
      proposal.createdAt = new Date().toISOString();
      dataStore.proposals.push(proposal);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: proposal }));
    });
  },

  // /api/logs - 日志管理
  'GET:/api/logs': (req, res) => {
    const { level } = url.parse(req.url, true).query;
    let logs = dataStore.logs;
    if (level) {
      logs = logs.filter(log => log.level === level);
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, data: logs }));
  },
  
  'POST:/api/logs': (req, res) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const log = JSON.parse(body);
      log.id = `log-${Date.now()}`;
      log.timestamp = new Date().toISOString();
      dataStore.logs.push(log);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: log }));
    });
  },

  // /api/tasks - 任务状态管理
  'GET:/api/tasks': (req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, data: getAllTasks() }));
  },
  
  'POST:/api/tasks': (req, res) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const { name, description } = JSON.parse(body);
      const task = createTask(name, description);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: task }));
    });
  },
  
  'PATCH:/api/tasks': (req, res) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const { taskId, status } = JSON.parse(body);
      const task = updateTaskStatus(taskId, status);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: task }));
    });
  }
};

// ============== HTTP 服务器 ==============
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  const method = req.method;
  const pathname = url.parse(req.url).pathname;
  const routeKey = `${method}:${pathname}`;
  
  if (routes[routeKey]) {
    routes[routeKey](req, res);
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'Not Found' }));
  }
});

// 启动服务器
server.listen(PORT, () => {
  console.log(`🚀 Dashboard API 服务器运行在 http://localhost:${PORT}`);
  console.log(`📋 可用路由:`);
  console.log(`   GET  /api/agents    - 获取所有 Agent`);
  console.log(`   POST /api/agents    - 创建新 Agent`);
  console.log(`   GET  /api/proposals - 获取所有提案`);
  console.log(`   POST /api/proposals - 创建新提案`);
  console.log(`   GET  /api/logs      - 获取日志 (支持 ?level=info|warn|error)`);
  console.log(`   POST /api/logs      - 创建新日志`);
  console.log(`   GET  /api/tasks     - 获取所有任务`);
  console.log(`   POST /api/tasks     - 创建新任务`);
  console.log(`   PATCH /api/tasks    - 更新任务状态`);
});

module.exports = { server, dataStore, createTask, updateTaskStatus, getAllTasks };
