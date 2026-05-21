---
paths: 
  - "FE/"
---

# 前端代码规范（本项目专属）

## 文件命名

| 类型 | 命名规则 | 示例 |
|------|----------|------|
| 页面组件 | `PascalCase.page.tsx` | `WeeklyReport.page.tsx` |
| 通用组件 | `PascalCase/PascalCase.tsx`（独立目录） | `TaskTable/TaskTable.tsx` |
| API 服务 | `kebab-case.api.ts` | `task.api.ts` |
| 类型文件 | `kebab-case.ts` | `task.ts` |
| Context | `PascalCaseContext.tsx` | `AuthContext.tsx` |
| CSS Module | 与组件同名 | `LoginPage.module.css` |

## 导出规则

- 所有组件/页面使用**命名导出**，禁止 default export：`export function Foo()`
- API 服务导出命名对象：`export const taskApi = { ... }`
- Context 同时导出 Provider 和 hook：`export const AuthProvider`、`export const useAuth`
- 类型用 `export interface` 或 `export enum`

## 组件结构

每个组件文件内部按以下顺序组织：
1. React / 第三方 import
2. 本地依赖 import（`@/...`、相对路径）
3. CSS Module import（若有）
4. Props 类型定义：`interface XxxProps { ... }`
5. 组件函数：state → useEffect → handler/helper → return JSX

## Props 类型

- 命名规则：`组件名Props`（如 `TaskTableProps`）
- 在组件文件内定义，不单独放 types 目录
- 包含 `refreshTrigger` 和 `onDataChange` 回调（遵循项目数据流模式）

## API 调用

- 必须使用 `@/services/api` 中的共享 axios 实例（它会自动注入 token）
- 不要像 `work-report.api.ts` 那样直接用 axios 硬编码 URL —— 那是反模式
- 请求泛型明确标注：`api.get<Task[]>(url)`
- 返回值始终 destructure：`return res.data`

## 样式

- 优先使用 Mantine 组件 props（`c`、`fw`、`size`、`variant` 等）
- 只在 Mantine 不够用时才写 CSS Module
- CSS Module 类名用 camelCase
- 暗黑模式适配：`[data-mantine-color-scheme="dark"]` 选择器

## Context 使用

- 没有 Redux/Zustand，状态管理全部用 React Context
- 使用自定义 hook 获取 context：`useAuth()`、`useWeek()`
- 不要在组件内直接 import Context 对象，始终用对应的 hook

## 工具函数

- 重复出现的工具函数（`getCurrentWeekNumber`、`getWeekDateRange` 等）抽到 `src/utils/` 目录
- 不要在多个组件里复制粘贴相同逻辑
