# 贡献指南

感谢您对 Rainhoole Dashboard 项目的兴趣！我们欢迎并感谢社区贡献。

## 如何贡献

### 报告问题

如果您发现了 bug 或有功能建议，请通过以下方式报告：

1. 在 GitHub Issues 中搜索是否已有类似问题
2. 如果没有，创建新的 Issue
3. 使用问题模板，提供详细信息

### 提交 Pull Request

1. Fork 本项目
2. 创建功能分支: `git checkout -b feature/amazing-feature`
3. 提交更改: `git commit -m 'Add amazing feature'`
4. 推送到分支: `git push origin feature/amazing-feature`
5. 创建一个 Pull Request

## 开发环境设置

### 前置条件

- Node.js 18+
- Git
- 代码编辑器 (VS Code 推荐)

### 本地开发

```bash
# 1. Fork 并克隆项目
git clone https://github.com/YOUR_USERNAME/rainhoole-dashboard.git
cd rainhoole-dashboard/dashboard

# 2. 安装依赖
npm install

# 3. 创建开发分支
git checkout -b feature/your-feature

# 4. 启动开发服务器
npm run dev

# 5. 运行测试
npm run test

# 6. 运行 lint
npm run lint
```

## 代码规范

### 编码风格

- 遵循 ESLint 配置
- 使用 TypeScript 严格模式
- 组件使用函数式组件 + Hooks
- 样式使用 CSS Modules 或 Tailwind CSS

### Git 提交规范

提交信息格式:

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### 类型 (Type)

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建或辅助工具更新

### 示例

```
feat(auth): Add password reset functionality

- Implement password reset email
- Add reset password page
- Update user model

Closes #123
```

## Pull Request 流程

1. 确保所有测试通过
2. 确保代码通过 lint 检查
3. 更新相关文档
4. PR 描述清晰说明改动内容
5. 等待 Code Review

## 代码审查

- 保持 PR 小而专注
- 添加必要的注释
- 编写或更新测试
- 遵循项目现有的代码风格

## 行为准则

请遵守我们的[行为准则](CODE_OF_CONDUCT.md)，保持友善和尊重的交流。

## 贡献者权益

感谢所有贡献者！您的名字将出现在贡献者列表中。

## 问题解答

如有疑问，请通过以下方式联系：

- GitHub Discussions
- 邮箱: contribute@rainhoole.com
