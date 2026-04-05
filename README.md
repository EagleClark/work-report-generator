# Work Report Generator

一个全栈周报生成器应用，支持任务管理、周报汇总统计、AI 智能分析等功能。

## 功能特性

- **任务管理**: 创建、编辑、删除任务，支持项目关联、工作量估算、进度跟踪
- **周报汇总**: 按周统计任务数据，展示工作量偏差、人员投入、项目分布
- **AI 智能分析**: 基于周报数据生成人力压力分析报告，支持 SSE 流式输出
- **权限管理**: 基于 JWT 的用户认证，支持游客、普通用户、管理员、超级管理员四种角色
- **深色模式**: 支持明暗主题切换

## 技术栈

### 前端 (FE)
- React 19 + TypeScript
- Mantine UI 组件库
- Vite 构建工具
- React Router 路由管理
- Axios HTTP 客户端

### 后端 (BE)
- NestJS 框架
- TypeORM + SQLite (better-sqlite3)
- JWT 认证 (Passport)
- OpenAI SDK (支持兼容服务)

## 快速开始

### 环境要求
- Node.js >= 22.0.0
- npm 或 yarn

### 安装依赖

```bash
# 安装前端依赖
cd FE
npm install

# 安装后端依赖
cd ../BE
npm install
```

### 配置环境变量

在 `BE/` 目录下创建 `.env` 文件：

```env
# AI 模型配置（支持 OpenAI 及兼容服务）
AI_API_KEY=your-api-key
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
AI_EXTRA_HEADERS={}
```

### 启动开发服务器

```bash
# 启动后端 (端口 3001)
cd BE
npm run start:dev

# 新终端启动前端 (端口 5173)
cd FE
npm run dev
```

访问 http://localhost:5173 即可使用。

### 默认管理员账号

系统会自动创建超级管理员账号：
- 用户名: `admin`
- 密码: `admin123`

## AI 分析配置

后端支持 OpenAI 兼容的各种 AI 服务，通过 `.env` 文件配置：

| 配置项 | 说明 | 示例 |
|--------|------|------|
| `AI_API_KEY` | API 密钥 | `sk-xxx` |
| `AI_BASE_URL` | API 基础 URL | `https://api.openai.com/v1` |
| `AI_MODEL` | 模型名称 | `gpt-4o-mini` |
| `AI_EXTRA_HEADERS` | 额外请求头 (JSON) | `{"X-Custom": "value"}` |

### 常见 AI 服务配置示例

**OpenAI 官方**
```env
AI_API_KEY=sk-xxx
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
```

**DeepSeek**
```env
AI_API_KEY=sk-xxx
AI_BASE_URL=https://api.deepseek.com/v1
AI_MODEL=deepseek-chat
```

**通义千问 (阿里云)**
```env
AI_API_KEY=sk-xxx
AI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
AI_MODEL=qwen-turbo
```

**本地 Ollama**
```env
AI_API_KEY=ollama
AI_BASE_URL=http://localhost:11434/v1
AI_MODEL=llama2
```

## 部署

### 构建生产版本

```bash
# 构建前端
cd FE
npm run build
# 产物在 dist/ 目录

# 构建后端
cd BE
npm run build
# 产物在 dist/ 目录
```

### 生产环境运行

```bash
cd BE
npm run start
```

前端静态文件可部署到任意 Web 服务器 (如 Nginx)，需要配置 API 代理：

```nginx
# Nginx 配置示例
location /api {
    proxy_pass http://localhost:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

## 用户角色权限

| 角色 | 权限 |
|------|------|
| GUEST (游客) | 查看周报汇总 |
| USER (普通用户) | 管理自己的任务 |
| ADMIN (管理员) | 任务管理 + 用户管理 + 项目管理 + AI 分析 |
| SUPER_ADMIN (超级管理员) | 全部权限 |

## 项目结构

```
├── FE/                     # 前端项目
│   ├── src/
│   │   ├── components/     # 可复用组件
│   │   ├── pages/          # 页面组件
│   │   ├── services/       # API 服务
│   │   ├── context/        # React Context
│   │   └── types/          # TypeScript 类型
│   └── vite.config.mjs     # Vite 配置 (含代理)
│
├── BE/                     # 后端项目
│   ├── src/
│   │   ├── auth/           # 认证模块
│   │   ├── users/          # 用户模块
│   │   ├── projects/       # 项目模块
│   │   ├── work-report/    # 任务/周报模块
│   │   └── ai-analysis/    # AI 分析模块
│   ├── .env                # 环境变量配置
│   └── work-report.db      # SQLite 数据库
│
└── CLAUDE.md               # 开发指南
```

## 开发命令

### 前端
```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run typecheck    # TypeScript 类型检查
npm run lint         # ESLint + Stylelint
npm run vitest       # 运行测试
```

### 后端
```bash
npm run start:dev    # 开发模式启动
npm run build        # 编译 TypeScript
npm run start        # 运行生产版本
```

## License

MIT