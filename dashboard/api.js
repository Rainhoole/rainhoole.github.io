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

// ============== 用户数据库 (内存存储) ==============
const usersDB = new Map([
  ['admin', {
    id: 'user-001',
    username: 'admin',
    password: 'admin123', // 实际项目中应为 bcrypt 哈希
    email: 'admin@clawverse.com',
    role: 'admin',
    permissions: ['read', 'write', 'delete', 'admin'],
    createdAt: '2024-01-01T00:00:00Z',
    lastLogin: null
  }],
  ['user', {
    id: 'user-002',
    username: 'user',
    password: 'user123',
    email: 'user@clawverse.com',
    role: 'user',
    permissions: ['read'],
    createdAt: '2024-01-15T00:00:00Z',
    lastLogin: null
  }]
]);

// ============== Token 生成 ==============
function generateToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

function generateJWT(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const tokenPayload = {
    ...payload,
    iat: now,
    exp: now + (30 * 60) // 30分钟过期
  };
  const base64Header = btoa(JSON.stringify(header));
  const base64Payload = btoa(JSON.stringify(tokenPayload));
  const signature = generateToken().substring(0, 43);
  return `${base64Header}.${base64Payload}.${signature}`;
}

function parseJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return {
      header: JSON.parse(atob(parts[0])),
      payload: JSON.parse(atob(parts[1])),
      signature: parts[2]
    };
  } catch {
    return null;
  }
}

function isTokenExpired(token) {
  const decoded = parseJWT(token);
  if (!decoded) return true;
  return decoded.payload.exp < Math.floor(Date.now() / 1000);
}

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
  },

  // ========== 认证路由 ==========
  'POST:/api/auth/login': (req, res) => {
    getJsonBody(req, res, (err, body) => {
      const { username, password } = body || {};
      if (!username || !password) {
        return sendJson(res, 400, { success: false, error: 'Username and password are required' });
      }
      const user = usersDB.get(username);
      if (!user || user.password !== password) {
        return sendJson(res, 401, { success: false, error: 'Invalid username or password' });
      }
      
      // 生成 token
      const token = generateJWT({
        userId: user.id,
        username: user.username,
        role: user.role,
        permissions: user.permissions
      });
      const refreshToken = generateToken();
      
      // 更新最后登录
      user.lastLogin = new Date().toISOString();
      
      // 返回用户信息(不含密码)
      const safeUser = { ...user };
      delete safeUser.password;
      
      return sendJson(res, 200, { 
        success: true, 
        data: { token, refreshToken, user: safeUser } 
      });
    });
  },

  'POST:/api/auth/register': (req, res) => {
    getJsonBody(req, res, (err, body) => {
      const { username, password, email } = body || {};
      
      if (!username || !password || !email) {
        return sendJson(res, 400, { success: false, error: 'All fields are required' });
      }
      if (username.length < 3 || username.length > 20) {
        return sendJson(res, 400, { success: false, error: 'Username must be 3-20 characters' });
      }
      if (password.length < 6) {
        return sendJson(res, 400, { success: false, error: 'Password must be at least 6 characters' });
      }
      if (usersDB.has(username)) {
        return sendJson(res, 409, { success: false, error: 'Username already exists' });
      }
      
      const newUser = {
        id: `user-${Date.now()}`,
        username,
        password,
        email,
        role: 'user',
        permissions: ['read'],
        createdAt: new Date().toISOString(),
        lastLogin: null
      };
      
      usersDB.set(username, newUser);
      
      const safeUser = { ...newUser };
      delete safeUser.password;
      
      return sendJson(res, 201, { success: true, data: { user: safeUser } });
    });
  },

  'POST:/api/auth/verify': (req, res) => {
    getJsonBody(req, res, (err, body) => {
      const { token } = body || {};
      if (!token) {
        return sendJson(res, 400, { success: false, error: 'Token is required' });
      }
      
      if (isTokenExpired(token)) {
        return sendJson(res, 401, { success: false, error: 'Token expired' });
      }
      
      const decoded = parseJWT(token);
      if (!decoded) {
        return sendJson(res, 401, { success: false, error: 'Invalid token' });
      }
      
      return sendJson(res, 200, { success: true, data: { valid: true, user: decoded.payload } });
    });
  },

  'POST:/api/auth/refresh': (req, res) => {
    getJsonBody(req, res, (err, body) => {
      const { refreshToken } = body || {};
      // 简化处理：验证 refreshToken 格式
      if (!refreshToken || refreshToken.length < 10) {
        return sendJson(res, 401, { success: false, error: 'Invalid refresh token' });
      }
      
      // 从数据库获取用户信息（简化实现）
      // 实际应验证 refreshToken 是否有效
      return sendJson(res, 200, { success: false, error: 'Token refresh not implemented in demo' });
    });
  },

  'POST:/api/auth/logout': (req, res) => {
    // 客户端清除 token，服务端记录日志
    return sendJson(res, 200, { success: true, message: 'Logged out successfully' });
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
