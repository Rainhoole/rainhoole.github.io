/**
 * clawVERSE Dashboard - 认证模块
 * 用户登录/注册/Token管理/权限验证/会话管理
 */

// ============== 配置 ==============
const AUTH_CONFIG = {
  tokenKey: 'clawverse_token',
  refreshTokenKey: 'clawverse_refresh_token',
  userKey: 'clawverse_user',
  tokenExpiryKey: 'clawverse_token_expiry',
  sessionTimeout: 30 * 60 * 1000, // 30分钟
  refreshThreshold: 5 * 60 * 1000 // 5分钟前刷新
};

// ============== 用户数据存储 (模拟数据库) ==============
const usersDB = new Map([
  ['admin', {
    id: 'user-001',
    username: 'admin',
    password: 'admin123', // 实际项目中应为哈希值
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

// ============== Token 管理 ==============
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
    exp: now + (30 * 60) // 30分钟
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
  const now = Math.floor(Date.now() / 1000);
  return decoded.payload.exp < now;
}

function getStoredToken() {
  return localStorage.getItem(AUTH_CONFIG.tokenKey);
}

function getStoredRefreshToken() {
  return localStorage.getItem(AUTH_CONFIG.refreshTokenKey);
}

function storeTokens(token, refreshToken) {
  localStorage.setItem(AUTH_CONFIG.tokenKey, token);
  localStorage.setItem(AUTH_CONFIG.refreshTokenKey, refreshToken);
  const decoded = parseJWT(token);
  if (decoded) {
    localStorage.setItem(AUTH_CONFIG.tokenExpiryKey, decoded.payload.exp * 1000);
  }
}

function clearTokens() {
  localStorage.removeItem(AUTH_CONFIG.tokenKey);
  localStorage.removeItem(AUTH_CONFIG.refreshTokenKey);
  localStorage.removeItem(AUTH_CONFIG.tokenExpiryKey);
  localStorage.removeItem(AUTH_CONFIG.userKey);
}

// ============== 用户管理 ==============
function getStoredUser() {
  const userStr = localStorage.getItem(AUTH_CONFIG.userKey);
  return userStr ? JSON.parse(userStr) : null;
}

function storeUser(user) {
  // 不存储密码
  const safeUser = { ...user };
  delete safeUser.password;
  localStorage.setItem(AUTH_CONFIG.userKey, JSON.stringify(safeUser));
}

// ============== 认证 API ==============
const AuthAPI = {
  // 登录
  async login(username, password) {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      return await response.json();
    } catch (error) {
      // 离线模式：使用本地验证
      return this.localLogin(username, password);
    }
  },

  // 本地登录 (离线模式)
  localLogin(username, password) {
    const user = usersDB.get(username);
    if (user && user.password === password) {
      const token = generateJWT({
        userId: user.id,
        username: user.username,
        role: user.role,
        permissions: user.permissions
      });
      const refreshToken = generateToken();
      
      storeTokens(token, refreshToken);
      storeUser(user);
      
      // 更新最后登录时间
      user.lastLogin = new Date().toISOString();
      
      return {
        success: true,
        data: {
          token,
          refreshToken,
          user: { ...user, password: undefined }
        }
      };
    }
    return {
      success: false,
      error: '用户名或密码错误'
    };
  },

  // 注册
  async register(userData) {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      return await response.json();
    } catch (error) {
      // 离线模式：本地注册
      return this.localRegister(userData);
    }
  },

  // 本地注册 (离线模式)
  localRegister({ username, password, email }) {
    if (usersDB.has(username)) {
      return { success: false, error: '用户名已存在' };
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
    
    return {
      success: true,
      data: { user: { ...newUser, password: undefined } }
    };
  },

  // 验证 Token
  async verify() {
    const token = getStoredToken();
    if (!token) {
      return { success: false, error: '未登录' };
    }

    if (isTokenExpired(token)) {
      // 尝试刷新 token
      const refreshed = await this.refreshToken();
      return refreshed;
    }

    const user = getStoredUser();
    return {
      success: true,
      data: { user, token }
    };
  },

  // 刷新 Token
  async refreshToken() {
    try {
      const refreshToken = getStoredRefreshToken();
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
      return await response.json();
    } catch {
      // 离线模式
      return { success: false, error: '无法刷新令牌' };
    }
  },

  // 登出
  logout() {
    clearTokens();
    window.location.reload();
  }
};

// ============== 权限验证 ==============
const Permission = {
  // 检查是否已登录
  isAuthenticated() {
    const token = getStoredToken();
    return token && !isTokenExpired(token);
  },

  // 获取当前用户
  getCurrentUser() {
    return getStoredUser();
  },

  // 检查权限
  hasPermission(permission) {
    const user = getStoredUser();
    return user?.permissions?.includes(permission) || false;
  },

  // 检查角色
  hasRole(role) {
    const user = getStoredUser();
    return user?.role === role;
  },

  // 检查多个权限 (AND)
  hasAllPermissions(permissions) {
    return permissions.every(p => this.hasPermission(p));
  },

  // 检查多个权限 (OR)
  hasAnyPermission(permissions) {
    return permissions.some(p => this.hasPermission(p));
  }
};

// ============== 会话管理 ==============
const Session = {
  timeoutId: null,
  warningId: null,

  start() {
    this.resetTimeout();
    
    // 监听用户活动
    ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, () => this.resetTimeout());
    });
  },

  resetTimeout() {
    if (this.timeoutId) clearTimeout(this.timeoutId);
    if (this.warningId) clearTimeout(this.warningId);
    
    // 警告
    this.warningId = setTimeout(() => {
      this.showWarning();
    }, AUTH_CONFIG.sessionTimeout - AUTH_CONFIG.refreshThreshold);
    
    // 超时
    this.timeoutId = setTimeout(() => {
      this.handleSessionTimeout();
    }, AUTH_CONFIG.sessionTimeout);
  },

  showWarning() {
    const existing = document.getElementById('session-warning');
    if (existing) return;

    const warning = document.createElement('div');
    warning.id = 'session-warning';
    warning.className = 'fixed bottom-4 right-4 bg-amber-500/90 text-black px-6 py-4 rounded-lg shadow-lg z-50 animate-slide-up';
    warning.innerHTML = `
      <div class="flex items-center gap-3">
        <i data-lucide="clock" class="w-5 h-5"></i>
        <div>
          <div class="font-semibold">会话即将过期</div>
          <div class="text-sm">5分钟后将自动登出</div>
        </div>
        <button onclick="Session.extend()" class="ml-4 px-3 py-1 bg-black/20 rounded hover:bg-black/30">
          继续使用
        </button>
      </div>
    `;
    document.body.appendChild(warning);
    lucide.createIcons();
  },

  extend() {
    const warning = document.getElementById('session-warning');
    if (warning) warning.remove();
    this.resetTimeout();
  },

  handleSessionTimeout() {
    const warning = document.getElementById('session-warning');
    if (warning) warning.remove();

    alert('会话已过期，请重新登录');
    AuthAPI.logout();
  },

  stop() {
    if (this.timeoutId) clearTimeout(this.timeoutId);
    if (this.warningId) clearTimeout(this.warningId);
  }
};

// ============== UI 组件 ==============
const AuthUI = {
  init() {
    this.renderLoginModal();
    this.renderUserMenu();
    
    // 检查登录状态
    if (Permission.isAuthenticated()) {
      this.showAuthenticatedUI();
    } else {
      this.showGuestUI();
    }
  },

  renderLoginModal() {
    // 已存在则跳过
    if (document.getElementById('auth-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'auth-modal';
    modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm z-50 hidden items-center justify-center';
    modal.innerHTML = `
      <div class="glass-dark rounded-2xl p-8 w-full max-w-md mx-4 animate-scale-in">
        <div class="text-center mb-8">
          <div class="w-16 h-16 rounded-xl gold-gradient flex items-center justify-center text-3xl mx-auto mb-4" style="box-shadow: 0 0 30px rgba(255,215,0,0.3);">🐉</div>
          <h2 class="text-2xl font-bold gold-gradient">clawVERSE</h2>
          <p class="text-gray-400 mt-2">请登录以继续</p>
        </div>

        <!-- 登录表单 -->
        <form id="login-form" class="space-y-4">
          <div>
            <label class="block text-sm text-gray-400 mb-2">用户名</label>
            <input type="text" name="username" required
              class="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-yellow-500/50 outline-none transition-colors"
              placeholder="输入用户名">
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-2">密码</label>
            <input type="password" name="password" required
              class="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-yellow-500/50 outline-none transition-colors"
              placeholder="输入密码">
          </div>
          <div id="login-error" class="text-red-400 text-sm hidden"></div>
          <button type="submit" class="w-full py-3 rounded-lg gold-gradient text-black font-semibold hover:opacity-90 transition-opacity">
            登录
          </button>
        </form>

        <!-- 注册表单 -->
        <form id="register-form" class="space-y-4 hidden">
          <div>
            <label class="block text-sm text-gray-400 mb-2">用户名</label>
            <input type="text" name="username" required
              class="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-yellow-500/50 outline-none transition-colors"
              placeholder="3-20个字符">
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-2">邮箱</label>
            <input type="email" name="email" required
              class="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-yellow-500/50 outline-none transition-colors"
              placeholder="your@email.com">
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-2">密码</label>
            <input type="password" name="password" required minlength="6"
              class="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-yellow-500/50 outline-none transition-colors"
              placeholder="至少6个字符">
          </div>
          <div id="register-error" class="text-red-400 text-sm hidden"></div>
          <button type="submit" class="w-full py-3 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold hover:opacity-90 transition-opacity">
            注册
          </button>
        </form>

        <div class="mt-6 text-center">
          <span id="toggle-auth-text" class="text-gray-400">还没有账号？</span>
          <button id="toggle-auth-btn" class="text-yellow-400 hover:underline ml-1">立即注册</button>
        </div>

        <button onclick="AuthUI.closeModal()" class="absolute top-4 right-4 text-gray-400 hover:text-white">
          <i data-lucide="x" class="w-6 h-6"></i>
        </button>
      </div>
    `;
    document.body.appendChild(modal);
    lucide.createIcons();

    // 表单事件
    document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
    document.getElementById('register-form').addEventListener('submit', (e) => this.handleRegister(e));
    document.getElementById('toggle-auth-btn').addEventListener('click', () => this.toggleAuthMode());
  },

  renderUserMenu() {
    const userMenu = document.getElementById('user-menu');
    if (!userMenu) return;

    const user = Permission.getCurrentUser();
    if (user) {
      userMenu.innerHTML = `
        <div class="flex items-center gap-3 cursor-pointer" onclick="AuthUI.toggleDropdown()">
          <div class="w-10 h-10 rounded-full gold-gradient flex items-center justify-center text-lg">👤</div>
          <div>
            <div class="font-semibold">${user.username}</div>
            <div class="text-xs text-gray-400">${user.role === 'admin' ? '管理员' : '普通用户'}</div>
          </div>
          <i data-lucide="chevron-down" class="w-4 h-4 text-gray-400"></i>
        </div>
        <div id="user-dropdown" class="hidden absolute top-full right-0 mt-2 w-48 glass-dark rounded-lg py-2 shadow-xl">
          <a href="#" class="block px-4 py-2 text-gray-400 hover:text-white hover:bg-white/5">
            <i data-lucide="user" class="w-4 h-4 inline mr-2"></i>个人资料
          </a>
          <a href="#" class="block px-4 py-2 text-gray-400 hover:text-white hover:bg-white/5">
            <i data-lucide="settings" class="w-4 h-4 inline mr-2"></i>设置
          </a>
          <hr class="my-2 border-white/10">
          <button onclick="AuthUI.logout()" class="w-full text-left px-4 py-2 text-red-400 hover:bg-white/5">
            <i data-lucide="log-out" class="w-4 h-4 inline mr-2"></i>退出登录
          </button>
        </div>
      `;
      lucide.createIcons();
    }
  },

  openModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }
  },

  closeModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  },

  toggleAuthMode() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const toggleText = document.getElementById('toggle-auth-text');
    const toggleBtn = document.getElementById('toggle-auth-btn');

    if (loginForm.classList.contains('hidden')) {
      loginForm.classList.remove('hidden');
      registerForm.classList.add('hidden');
      toggleText.textContent = '还没有账号？';
      toggleBtn.textContent = '立即注册';
    } else {
      loginForm.classList.add('hidden');
      registerForm.classList.remove('hidden');
      toggleText.textContent = '已有账号？';
      toggleBtn.textContent = '立即登录';
    }
  },

  async handleLogin(e) {
    e.preventDefault();
    const form = e.target;
    const errorEl = document.getElementById('login-error');
    const username = form.username.value;
    const password = form.password.value;

    try {
      const result = await AuthAPI.login(username, password);
      if (result.success) {
        this.closeModal();
        this.showAuthenticatedUI();
        Session.start();
        // 刷新页面以应用认证状态
        window.location.reload();
      } else {
        errorEl.textContent = result.error;
        errorEl.classList.remove('hidden');
      }
    } catch (error) {
      errorEl.textContent = '登录失败，请稍后重试';
      errorEl.classList.remove('hidden');
    }
  },

  async handleRegister(e) {
    e.preventDefault();
    const form = e.target;
    const errorEl = document.getElementById('register-error');
    const userData = {
      username: form.username.value,
      password: form.password.value,
      email: form.email.value
    };

    try {
      const result = await AuthAPI.register(userData);
      if (result.success) {
        alert('注册成功！请登录');
        this.toggleAuthMode();
        form.reset();
      } else {
        errorEl.textContent = result.error;
        errorEl.classList.remove('hidden');
      }
    } catch (error) {
      errorEl.textContent = '注册失败，请稍后重试';
      errorEl.classList.remove('hidden');
    }
  },

  showAuthenticatedUI() {
    // 更新侧边栏用户区域
    const userSection = document.querySelector('.sidebar .p-4.border-t');
    if (userSection) {
      const user = Permission.getCurrentUser();
      userSection.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full gold-gradient flex items-center justify-center text-lg">👤</div>
          <div class="flex-1">
            <div class="font-semibold">${user?.username || '用户'}</div>
            <div class="text-xs text-gray-400">${user?.role === 'admin' ? '管理员' : '普通用户'}</div>
          </div>
          <button onclick="AuthUI.logout()" class="p-2 rounded-lg hover:bg-white/10 transition-colors" title="退出登录">
            <i data-lucide="log-out" class="w-5 h-5"></i>
          </button>
        </div>
      `;
      lucide.createIcons();
    }

    // 移除登录按钮遮罩
    document.querySelectorAll('.login-required').forEach(el => {
      el.classList.remove('login-required');
      el.style.pointerEvents = 'auto';
    });
  },

  showGuestUI() {
    // 禁用需要登录的功能
    document.querySelectorAll('.auth-only').forEach(el => {
      el.classList.add('login-required');
      el.style.pointerEvents = 'none';
      el.style.opacity = '0.5';
    });
  },

  logout() {
    AuthAPI.logout();
  }
};

// ============== 路由保护 ==============
function requireAuth(callback) {
  if (Permission.isAuthenticated()) {
    callback();
  } else {
    AuthUI.openModal();
  }
}

function requirePermission(permission, callback, fallback) {
  if (Permission.hasPermission(permission)) {
    callback();
  } else if (fallback) {
    fallback();
  } else {
    alert('您没有权限执行此操作');
  }
}

function requireRole(role, callback, fallback) {
  if (Permission.hasRole(role)) {
    callback();
  } else if (fallback) {
    fallback();
  } else {
    alert('您没有权限访问此页面');
  }
}

// ============== 导出 ==============
window.AuthAPI = AuthAPI;
window.Permission = Permission;
window.Session = Session;
window.AuthUI = AuthUI;
window.requireAuth = requireAuth;
window.requirePermission = requirePermission;
window.requireRole = requireRole;
