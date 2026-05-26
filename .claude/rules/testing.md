---
paths:
  - "**/*.spec.ts"
  - "**/*.test.ts"
  - "**/*.test.tsx"
---

# 测试规范

## 技术栈

- **测试运行器**：Vitest
- **组件测试**：@testing-library/react + @testing-library/jest-dom
- **API Mock**：MSW（msw v2）
- **E2E**：Playwright
- **环境**：jsdom

## 测试文件组织

| 类型 | 位置 | 命名 |
|------|------|------|
| 组件单测 | `src/components/ComponentName/ComponentName.test.tsx` | 与组件同目录 |
| 单元测试 | `test/unit/services/*.test.ts`、`test/unit/context/*.test.tsx`、`test/unit/components/*.test.tsx` | 按被测模块分目录 |
| 集成测试 | `test/integration/*.integration.test.tsx` | 文件名说明集成场景 |
| E2E | `test/e2e/*.spec.ts` | Playwright 测试 |

## 测试写法

- 测试描述用**中文**：`describe('TaskTable组件')`、`it('正常渲染任务列表')`
- 使用 `describe/it` 嵌套结构做逻辑分组
- 组件测试用自定义 render（来自 `@test-utils`），它已包裹 MantineProvider
- Context 测试用 `vi.mock('@/context/AuthContext', ...)` 注入 mock
- 路由相关测试用 `MemoryRouter` 包裹

## MSW 规范

- 所有 API endpoint 必须在 `test/mocks/handlers.ts` 有对应 handler
- MSW server 配置了 `onUnhandledRequest: 'error'`，未 mock 的请求会直接报错
- 测试数据统一放在 `test/mocks/data.ts`
- 单个测试需要用 `server.use(http.get(...))` 覆盖特定端点
- 新增 API 端点时**必须同步添加 MSW handler**，否则相关测试全挂

## 自定义 render（test-utils/render.tsx）

```tsx
import { render, screen } from '@test-utils';
```
它已包裹 `MantineProvider`（env="test"），不要自己在测试里再包一层。

## 异步测试

- 用 `waitFor` 等待异步状态变化
- 用 `findByText` / `findByTestId` 等待异步元素出现
- 用 `act` 包裹触发状态变更的操作
- 断言用 `toBeInTheDocument()`、`toHaveAttribute()` 等 jest-dom 匹配器

## E2E

- Playwright 测试命名：`test/e2e/<feature>.spec.ts`
- 覆盖关键流程：登录、任务 CRUD、周报查看

## 测试模板

### Hook 单测

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useXxx } from '@/hooks/useXxx';

function TestComponent() {
  const { result, action } = useXxx();
  return (
    <div>
      <span data-testid="result">{result}</span>
      <button data-testid="action-btn" onClick={action}>Action</button>
    </div>
  );
}

describe('useXxx', () => {
  it('初始状态正确', () => {
    render(<TestComponent />);
    expect(screen.getByTestId('result').textContent).toBe('expected');
  });

  it('action 后状态更新', async () => {
    const user = userEvent.setup();
    render(<TestComponent />);
    await user.click(screen.getByTestId('action-btn'));
    expect(screen.getByTestId('result').textContent).toBe('updated');
  });
});
```

**要点：**
- 用 TestComponent 包裹 hook，通过 data-testid 暴露状态
- 用 userEvent 模拟交互
- 纯 JS 逻辑的 hook 可直接测试，不渲染 DOM

### 集成测试

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import { MemoryRouter } from 'react-router-dom';
import { XxxComponent } from '@/components/Xxx/Xxx';

// Mock 必要的外部依赖（API、Context 等）
vi.mock('@/services/xxx.api', () => ({
  xxxApi: { getAll: vi.fn().mockResolvedValue([]) },
}));
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: null, isAuthenticated: false }),
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>
    <MemoryRouter>{children}</MemoryRouter>
  </MantineProvider>
);

describe('XxxComponent 集成测试', () => {
  it('正常渲染并响应交互', async () => {
    const user = userEvent.setup();
    render(<XxxComponent />, { wrapper: TestWrapper });
    await screen.findByText('预期文本');
    await user.click(screen.getByRole('button', { name: 'Action' }));
    expect(await screen.findByText('Success')).toBeInTheDocument();
  });
});
```

**要点：**
- 用 TestWrapper 包裹组件（MantineProvider + MemoryRouter）
- Mock API 和 Context，测试真实组件交互
- 用 userEvent 模拟完整用户操作流
