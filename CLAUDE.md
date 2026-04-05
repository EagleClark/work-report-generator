# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A full-stack work report generator application with weekly task tracking, AI-powered analysis, and role-based access control.

- **Frontend (`FE/`)**: React + TypeScript + Mantine UI + Vite
- **Backend (`BE/`)**: NestJS + TypeScript + TypeORM + SQLite (better-sqlite3)

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

Backend has no test framework configured.

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