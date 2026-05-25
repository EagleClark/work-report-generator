# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A full-stack work report generator application with weekly task tracking, AI-powered analysis, and role-based access control.

- **Frontend (`FE/`)**: React + TypeScript + Mantine UI + Vite
- **Backend (`BE/`)**: NestJS + TypeScript + TypeORM + SQLite (better-sqlite3)

## Prerequisites

- Node.js >= 22.0.0

## Development Workflow

本项目配置了 **agent 工作流** 和 **superpowers skills**，开发时必须遵循以下流程：

### Agent 列表

| Agent | 用途 | 触发场景 |
|-------|------|----------|
| `frontend-dev` | 前端代码开发 | FE/src 下的页面/组件/API/Context |
| `backend-dev` | 后端代码开发 | BE/src 下的 Controller/Service/Entity |
| `unit-test-writer` | 单元测试编写 | 组件/API/Context/工具函数单测 |
| `integration-test-writer` | 集成测试编写 | 多组件协同流程测试 |
| `e2e-test-writer` | E2E 测试编写 | Playwright 端到端流程 |
| `test-analyzer` | 测试执行分析 | 跑测试 + 分析失败 + 修复建议 |
| `frontend-reviewer` | 前端代码检视 | git diff 变更检视 |
| `backend-reviewer` | 后端代码检视 | git diff 变更检视 |

### 标准开发流程

```
用户需求
  ↓
① brainstorming（需求分析、方案设计）
  ↓
② TDD（先写测试）
  ↓
③ frontend-dev / backend-dev（编码实现）
  ↓
④ unit-test-writer / integration-test-writer（补测试）
  ↓
⑤ test-analyzer（运行测试、分析结果）
  ↓
⑥ frontend-reviewer / backend-reviewer（代码检视）
  ↓
⑦ verification（验证通过）
  ↓
⑧ commit（提交代码）
```

### Superpowers Skills

开发过程中必须使用 superpowers skills，禁止跳过：
- `superpowers:using-superpowers` — 每次开发任务入口，自动触发
- `superpowers:brainstorming` — 编码前需求分析和方案设计
- `superpowers:test-driven-development` — 先写测试再写实现
- `superpowers:systematic-debugging` — 遇到 Bug 时系统化调试
- `superpowers:verification-before-completion` — 完成后跑验证确认通过

### Hookify 工作流规则

以下 hook 规则在关键节点提醒（`.claude/hookify.*.local.md`）：
- 直接编辑源码 → 提醒使用 agent
- 执行 `git commit` → 提醒跑测试和 review
- Session 结束 → 提醒检查工作流完整性

## Development Commands

### Frontend (run from `FE/` directory)
```bash
npm run dev              # Start dev server (port 5173)
npm run build            # TypeScript check + Vite build
npm run typecheck        # TypeScript type checking only
npm run lint             # ESLint + Stylelint
npm run vitest           # Run tests once
npm run vitest:watch     # Run tests in watch mode
npm run test             # Full CI suite: typecheck + prettier + lint + vitest + build
npm run prettier:write   # Format all files
npm run storybook        # Start storybook dev server (port 6006)
```

### Backend (run from `BE/` directory)
```bash
npm run start:dev        # Start dev server with ts-node (port 3001)
npm run build            # TypeScript compile to dist/
npm run start            # Run compiled production build
```

## Architecture

### Port Configuration
- Backend: `3001` (configured in `BE/src/main.ts`)
- Frontend: `5173` with proxy to backend via `vite.config.mjs`
- API prefix: `/api` (set in `BE/src/main.ts`)
- Frontend proxy routes all `/api/*` requests to `http://localhost:3001`

### Backend Module Structure (`BE/src/`)
| Module | Purpose |
|--------|---------|
| `auth/` | JWT authentication, role guards, login endpoint |
| `users/` | User CRUD management |
| `projects/` | Project CRUD management |
| `work-report/` | Task CRUD, weekly summary statistics |
| `ai-analysis/` | AI-powered workforce analysis with SSE streaming |

### Frontend Structure (`FE/src/`)
| Directory | Purpose |
|-----------|---------|
| `pages/*.page.tsx` | Page components (HomePage, WeeklyReport, UserManagement, ProjectManagement, Login) |
| `components/*` | Reusable UI components (TaskForm, TaskTable, AIAnalysisDisplay, etc.) |
| `services/*.api.ts` | API service modules for each backend module |
| `context/` | React contexts (AuthContext, WeekContext) |
| `types/` | TypeScript type definitions shared with backend |

### Entry Point Flow
- **Frontend**: `main.tsx` → `App.tsx` → `Router.tsx`
- **Backend**: `main.ts` → `AppModule` (imports all feature modules)

## Authentication & Authorization

### User Roles (defined in both `FE/src/types/user.ts` and `BE/src/auth/entities/user.entity.ts`)
```
GUEST < USER < ADMIN < SUPER_ADMIN
```

### Route Protection
- `/login` - Public
- `/weekly-report` - Guest accessible
- `/` (task management) - Requires USER role
- `/projects`, `/users` - Requires ADMIN or SUPER_ADMIN

### Auth Flow
- JWT stored in localStorage (`token`, `user`)
- `AuthContext` provides `hasRole()` for permission checks
- Backend uses `@Roles()` decorator + `RolesGuard` for endpoint protection

## Key Patterns

### Backend Controller
```typescript
@Controller('module-name')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ModuleController {
  @Get()
  findAll() { ... }

  @Post()
  @Roles(UserRole.ADMIN)  // Role-restricted endpoint
  create() { ... }
}
```

### Frontend API Service
```typescript
// FE/src/services/module.api.ts
import { api } from './api';  // Axios instance with baseURL '/api'

export const moduleApi = {
  getAll: () => api.get('/module'),
  create: (data) => api.post('/module', data),
};
```

### SSE Streaming (AI Analysis)
Backend returns streaming response with `res.write(chunk)`:
```typescript
@Post('generate-stream')
async generateStream(@Body() dto, @Res() res: Response) {
  res.setHeader('Content-Type', 'text/event-stream');
  await this.service.generateStream(dto, (chunk) => res.write(chunk));
  res.end();
}
```

Frontend consumes with `fetch` + `ReadableStream`:
```typescript
const reader = res.body?.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const chunk = decoder.decode(value);
  setStreamContent(prev => prev + chunk);
}
```

## Database

SQLite via better-sqlite3, stored as `BE/work-report.db`. TypeORM entities:
- `users` - User accounts with roles
- `projects` - Project definitions
- `tasks` - Task records linked to projects
- `ai_analyses` - AI analysis results keyed by (year, weekNumber)

### Auto-seeding (BE/src/main.ts bootstrap)

On first startup, if no SUPER_ADMIN user exists, the app creates one:
- Username: `admin`, Password: `admin123`, Role: `SUPER_ADMIN`
- This runs synchronously before the server starts listening.

## AI Configuration

Backend `.env` for OpenAI-compatible services:
```env
AI_API_KEY=your-key
AI_BASE_URL=https://api.openai.com/v1  # Or DeepSeek, 通义千问, Ollama
AI_MODEL=gpt-4o-mini
AI_EXTRA_HEADERS={}  # JSON format for custom headers
```

## Testing

Frontend tests use Vitest with React Testing Library. Import custom render:
```tsx
import { render, screen } from '@test-utils';
```

The custom `render` (in `test-utils/render.tsx`) wraps components with `MantineProvider` (using the app theme, `env="test"`) so Mantine components render correctly in tests.

### Test Infrastructure Layers

1. **`vitest.setup.mjs`** — Browser polyfills: `matchMedia`, `ResizeObserver`, `scrollIntoView`. Runs before test files.
2. **`test/setup.ts`** — MSW server lifecycle (`listen`/`resetHandlers`/`close`), `localStorage`/`sessionStorage` mocks, DOM cleanup via `cleanup()`, and mocks for `IntersectionObserver`, `URL.createObjectURL`, `fetch`. Runs per test file.
3. **`test-utils/render.tsx`** — Custom render wrapping components with `MantineProvider`.
4. **`test/mocks/`** — MSW handlers (`handlers.ts`) mock all API endpoints. Test data lives in `data.ts`. Use `server.use()` in individual tests to override handlers for specific scenarios.

### MSW (Mock Service Worker)

API mocking uses MSW (`msw` package). The server is configured to error on unhandled requests (`onUnhandledRequest: 'error'`), so any unmocked API call fails the test. When adding new API endpoints, add corresponding MSW handlers in `test/mocks/handlers.ts`.

Backend has no test framework configured.

## Frontend Environment Variables

| Variable | Dev default | Prod default |
|----------|-------------|--------------|
| `VITE_API_BASE_URL` | `http://localhost:3001/api` | `/api` |

Defined in `.env.development` and `.env.production`. Override locally with `.env.local` (git-ignored).

## Path Aliases

- **Frontend** (`FE/tsconfig.json`): `@/*` → `./src/*`, `@test-utils` → `./test-utils`
- **Backend**: No aliases, use relative imports

## Import Order (Frontend)

Auto-sorted by prettier-plugin-sort-imports:
1. CSS imports
2. Framework imports (react, react-router-dom)
3. Node built-ins
4. Third-party modules
5. Mantine packages (`@mantine/*`)
6. Path aliases (`@/*`)
7. Relative imports
8. CSS module imports