const http = require('http');
const url = require('url');

const MAX_BODY_SIZE = 1 * 1024 * 1024; // 1MB

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

// ============== 通用响应与解析 ==============
function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(payload));
}

function getJsonBody(req, res, callback) {
  let body = '';
  req.on('data', chunk => {
    body += chunk;
    if (body.length > MAX_BODY_SIZE) {
      sendJson(res, 413, { success: false, error: 'Payload too large' });
      req.socket.destroy();
    }
  });
  req.on('end', () => {
    if (!body) return callback(null, {});
    try {
      const json = JSON.parse(body);
      return callback(null, json);
    } catch (err) {
      return sendJson(res, 400, { success: false, error: 'Invalid JSON payload' });
    }
  });
}

// ============== API 路由处理 ==============
const routes = {
  // /api/agents - Agent 管理
  'GET:/api/agents': (req, res) => {
    sendJson(res, 200, { success: true, data: dataStore.agents });
  },
  
  'POST:/api/agents': (req, res) => {
    getJsonBody(req, res, (err, agent) => {
      if (!agent || typeof agent.name !== 'string' || !agent.name.trim()) {
        return sendJson(res, 400, { success: false, error: 'Agent name is required' });
      }
      agent.id = `agent-${Date.now()}`;
      agent.status = 'active';
      agent.lastSeen = new Date().toISOString();
      dataStore.agents.push(agent);
      return sendJson(res, 201, { success: true, data: agent });
    });
  },

  // /api/proposals - 提案管理
  'GET:/api/proposals': (req, res) => {
    sendJson(res, 200, { success: true, data: dataStore.proposals });
  },
  
  'POST:/api/proposals': (req, res) => {
    getJsonBody(req, res, (err, proposal) => {
      if (!proposal || typeof proposal.title !== 'string' || !proposal.title.trim()) {
        return sendJson(res, 400, { success: false, error: 'Proposal title is required' });
      }
      proposal.id = `prop-${Date.now()}`;
      proposal.status = 'pending';
      proposal.createdAt = new Date().toISOString();
      dataStore.proposals.push(proposal);
      return sendJson(res, 201, { success: true, data: proposal });
    });
  },

  // /api/logs - 日志管理
  'GET:/api/logs': (req, res) => {
    const { level } = url.parse(req.url, true).query;
    let logs = dataStore.logs;
    if (level) {
      logs = logs.filter(log => log.level === level);
    }
    sendJson(res, 200, { success: true, data: logs });
  },
  
  'POST:/api/logs': (req, res) => {
    getJsonBody(req, res, (err, log) => {
      if (!log || typeof log.message !== 'string' || !log.message.trim()) {
        return sendJson(res, 400, { success: false, error: 'Log message is required' });
      }
      if (!['info', 'warn', 'error'].includes(log.level)) {
        return sendJson(res, 400, { success: false, error: 'Invalid log level' });
      }
      log.id = `log-${Date.now()}`;
      log.timestamp = new Date().toISOString();
      dataStore.logs.push(log);
      return sendJson(res, 201, { success: true, data: log });
    });
  },

  // /api/tasks - 任务状态管理
  'GET:/api/tasks': (req, res) => {
    sendJson(res, 200, { success: true, data: getAllTasks() });
  },
  
  'POST:/api/tasks': (req, res) => {
    getJsonBody(req, res, (err, body) => {
      const { name, description } = body || {};
      if (typeof name !== 'string' || !name.trim()) {
        return sendJson(res, 400, { success: false, error: 'Task name is required' });
      }
      const task = createTask(name.trim(), description || '');
      return sendJson(res, 201, { success: true, data: task });
    });
  },
  
  'PATCH:/api/tasks': (req, res) => {
    getJsonBody(req, res, (err, body) => {
      const { taskId, status } = body || {};
      if (!taskId) {
        return sendJson(res, 400, { success: false, error: 'taskId is required' });
      }
      if (!Object.values(taskStatus).includes(status)) {
        return sendJson(res, 400, { success: false, error: 'Invalid status' });
      }
      const task = updateTaskStatus(taskId, status);
      if (!task) {
        return sendJson(res, 404, { success: false, error: 'Task not found' });
      }
      return sendJson(res, 200, { success: true, data: task });
    });
  }
};

// ============== HTTP 服务器 ==============
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  const method = req.method;
  const pathname = url.parse(req.url).pathname;
  const routeKey = `${method}:${pathname}`;

  if (method === 'OPTIONS') {
    return sendJson(res, 204, { success: true });
  }
  
  if (routes[routeKey]) {
    routes[routeKey](req, res);
  } else {
    sendJson(res, 404, { success: false, error: 'Not Found' });
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
