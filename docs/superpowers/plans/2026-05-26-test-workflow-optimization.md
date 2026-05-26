# 测试用例固化 + 工作流并行优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 useColumnResize hook 补写测试，在 testing.md 固化测试模板，将工作流中三级测试（单元/集成/E2E）改为并行执行。

**Architecture:** 新增 2 个测试文件覆盖 hook 单测和组件集成测试，更新 4 个文档/配置文件。

**Tech Stack:** vitest + @testing-library/react + jsdom

---

### Task 1: 编写 useColumnResize hook 单测

**Files:**
- Create: `FE/test/unit/hooks/useColumnResize.test.tsx`

- [ ] **Step 1: 创建测试文件**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useColumnResize } from '@/hooks/useColumnResize';

const DEFAULT_WIDTHS = { colA: 100, colB: 200 };

// TestComponent 包装 hook，暴露状态供断言
function TestComponent({ defaultWidths, minWidth }: {
  defaultWidths: Record<string, number>;
  minWidth?: number;
}) {
  const { columnWidths, getThProps, resizeHandle, resetWidths } = minWidth
    ? useColumnResize(defaultWidths, minWidth)
    : useColumnResize(defaultWidths);

  return (
    <table>
      <thead>
        <tr>
          <th data-testid="th-colA" {...getThProps('colA')}>
            ColA
            {resizeHandle('colA')}
          </th>
          <th data-testid="th-colB" {...getThProps('colB')}>
            ColB
            {resizeHandle('colB')}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td data-testid="width-colA">{columnWidths.colA}</td>
          <td data-testid="width-colB">{columnWidths.colB}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td>
            <button data-testid="reset-btn" onClick={resetWidths}>
              重置
            </button>
          </td>
        </tr>
      </tfoot>
    </table>
  );
}

function renderHook(defaults = DEFAULT_WIDTHS, minW?: number) {
  return render(<TestComponent defaultWidths={defaults} minWidth={minW} />);
}

describe('useColumnResize', () => {
  beforeEach(() => {
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  });

  describe('初始状态', () => {
    it('使用默认宽度初始化', () => {
      renderHook();
      expect(screen.getByTestId('width-colA').textContent).toBe('100');
      expect(screen.getByTestId('width-colB').textContent).toBe('200');
    });

    it('getThProps 返回正确的 style', () => {
      renderHook();
      const th = screen.getByTestId('th-colA');
      expect(th.style.width).toBe('100px');
      expect(th.style.position).toBe('relative');
    });

    it('resizeHandle 渲染可拖拽元素', () => {
      renderHook();
      const th = screen.getByTestId('th-colA');
      const handle = th.querySelector('div');
      expect(handle).not.toBeNull();
      expect(handle!.style.cursor).toBe('col-resize');
      expect(handle!.style.width).toBe('8px');
      expect(handle!.style.position).toBe('absolute');
      expect(handle!.style.right).toBe('0px');
    });
  });

  describe('拖动调整宽度', () => {
    it('向右拖动增大列宽', async () => {
      const user = userEvent.setup();
      renderHook();

      const th = screen.getByTestId('th-colA');
      const handle = th.querySelector('div')!;
      const startWidth = parseInt(screen.getByTestId('width-colA').textContent!);

      // 模拟 mousedown + mousemove + mouseup
      await user.pointer([
        { keys: '[MouseLeft>]', target: handle, coords: { x: 0, y: 0 } },
        { target: handle, coords: { x: 50, y: 0 } },
        { keys: '[/MouseLeft]' },
      ]);

      const newWidth = parseInt(screen.getByTestId('width-colA').textContent!);
      expect(newWidth).toBe(startWidth + 50);
    });

    it('向左拖动减小列宽', async () => {
      const user = userEvent.setup();
      renderHook();

      const th = screen.getByTestId('th-colA');
      const handle = th.querySelector('div')!;

      await user.pointer([
        { keys: '[MouseLeft>]', target: handle, coords: { x: 0, y: 0 } },
        { target: handle, coords: { x: -30, y: 0 } },
        { keys: '[/MouseLeft]' },
      ]);

      const newWidth = parseInt(screen.getByTestId('width-colA').textContent!);
      expect(newWidth).toBe(70); // 100 - 30
    });

    it('不拖到小于 minWidth', async () => {
      const user = userEvent.setup();
      renderHook();

      const th = screen.getByTestId('th-colA');
      const handle = th.querySelector('div')!;

      await user.pointer([
        { keys: '[MouseLeft>]', target: handle, coords: { x: 0, y: 0 } },
        { target: handle, coords: { x: -200, y: 0 } },
        { keys: '[/MouseLeft]' },
      ]);

      const newWidth = parseInt(screen.getByTestId('width-colA').textContent!);
      expect(newWidth).toBe(60); // minWidth=60 by default
    });

    it('可自定义 minWidth', async () => {
      const user = userEvent.setup();
      renderHook(DEFAULT_WIDTHS, 40);

      const th = screen.getByTestId('th-colA');
      const handle = th.querySelector('div')!;

      await user.pointer([
        { keys: '[MouseLeft>]', target: handle, coords: { x: 0, y: 0 } },
        { target: handle, coords: { x: -200, y: 0 } },
        { keys: '[/MouseLeft]' },
      ]);

      const newWidth = parseInt(screen.getByTestId('width-colA').textContent!);
      expect(newWidth).toBe(40); // custom minWidth
    });
  });

  describe('resetWidths', () => {
    it('重置为默认宽度', async () => {
      const user = userEvent.setup();
      renderHook();

      // 先拖一次改变宽度
      const th = screen.getByTestId('th-colA');
      const handle = th.querySelector('div')!;
      await user.pointer([
        { keys: '[MouseLeft>]', target: handle, coords: { x: 0, y: 0 } },
        { target: handle, coords: { x: 50, y: 0 } },
        { keys: '[/MouseLeft]' },
      ]);
      expect(screen.getByTestId('width-colA').textContent).not.toBe('100');

      // 重置
      await user.click(screen.getByTestId('reset-btn'));
      expect(screen.getByTestId('width-colA').textContent).toBe('100');
      expect(screen.getByTestId('width-colB').textContent).toBe('200');
    });
  });

  describe('getThProps 缺失 key 回退', () => {
    it('未知 columnKey 返回 MIN_COLUMN_WIDTH', () => {
      const TestMissingKey = () => {
        const { getThProps } = useColumnResize(DEFAULT_WIDTHS);
        const props = getThProps('nonexistent');
        return <div data-testid="fallback">{props.style.width}</div>;
      };
      render(<TestMissingKey />);
      expect(screen.getByTestId('fallback').textContent).toBe('60');
    });
  });
});
```

- [ ] **Step 2: 运行测试验证通过**

```bash
cd FE && mkdir -p test/unit/hooks && npx vitest --run test/unit/hooks/useColumnResize.test.tsx
```
Expected: 所有 10 个测试通过

- [ ] **Step 3: Commit**

```bash
git add FE/test/unit/hooks/useColumnResize.test.tsx
git commit -m "feat: 新增useColumnResize hook单元测试"
```

---

### Task 2: 编写 TaskTable 列宽拖动集成测试

**Files:**
- Create: `FE/test/integration/TaskTable.resize.integration.test.tsx`

- [ ] **Step 1: 创建集成测试文件**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { TaskTable } from '@/components/TaskTable/TaskTable';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>
    <MemoryRouter>{children}</MemoryRouter>
  </MantineProvider>
);

// Mock API + Context 模块（TaskTable 依赖它们）
vi.mock('@/services/task.api', () => ({
  taskApi: { getAll: vi.fn().mockResolvedValue([]), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
}));
vi.mock('@/services/user.api', () => ({
  userApi: { getAll: vi.fn().mockResolvedValue([]) },
}));
vi.mock('@/services/project.api', () => ({
  projectApi: { getAll: vi.fn().mockResolvedValue([]) },
}));
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, username: 'admin', role: 'ADMIN' }, hasRole: () => true, isAuthenticated: true, isLoading: false, login: vi.fn(), guestLogin: vi.fn(), logout: vi.fn() }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('@/context/WeekContext', () => ({
  useWeek: () => ({ year: 2026, weekNumber: 21, setYear: vi.fn(), setWeekNumber: vi.fn() }),
  WeekProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe('TaskTable 列宽拖动集成测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('渲染所有 13 列表头，每列含 resizeHandle', () => {
    render(
      <TestWrapper>
        <TaskTable />
      </TestWrapper>
    );

    const thElements = screen.getAllByRole('columnheader');
    expect(thElements).toHaveLength(13);

    // 每列 th 内部应有一个 resize handle div
    thElements.forEach(th => {
      const handle = th.querySelector('div');
      expect(handle).not.toBeNull();
      expect(handle!.style.cursor).toBe('col-resize');
    });
  });

  it('拖动列宽后 Td 宽度同步更新', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <TaskTable />
      </TestWrapper>
    );

    // 在空数据表格中，Td 使用 colSpan=13，但 Th 仍可拖
    const projectTh = screen.getAllByRole('columnheader')[0];
    const handle = projectTh.querySelector('div')!;

    const initialWidth = projectTh.style.width;

    await user.pointer([
      { keys: '[MouseLeft>]', target: handle, coords: { x: 0, y: 0 } },
      { target: handle, coords: { x: 50, y: 0 } },
      { keys: '[/MouseLeft]' },
    ]);

    const newWidth = projectTh.style.width;
    expect(newWidth).not.toBe(initialWidth);
  });
});
```

- [ ] **Step 2: 运行集成测试**

```bash
cd FE && npx vitest --run test/integration/TaskTable.resize.integration.test.tsx
```
Expected: 2 个测试通过

- [ ] **Step 3: Commit**

```bash
git add FE/test/integration/TaskTable.resize.integration.test.tsx
git commit -m "feat: 新增TaskTable列宽拖动集成测试"
```

---

### Task 3: 更新 testing.md 新增测试模板

**Files:**
- Modify: `.claude/rules/testing.md`

- [ ] **Step 1: 在 testing.md 末尾追加测试模板章节**

在文件末尾追加以下内容：

```markdown
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
```

- [ ] **Step 2: 验证 rule 文件语法**

```bash
cd FE && npx vitest --run 2>&1 | tail -5
```
Expected: 现有测试不受影响

- [ ] **Step 3: Commit**

```bash
git add .claude/rules/testing.md
git commit -m "docs: testing.md新增测试模板章节"
```

---

### Task 4: 更新 workflow.md 改为并行测试流程

**Files:**
- Modify: `.claude/rules/workflow.md`

- [ ] **Step 1: 替换流程描述**

将第 20-31 行的流程文本替换为：

```markdown
## 标准流程

收到开发任务后，严格按以下顺序执行：

```
① brainstorming — 需求分析、方案设计、明确验收标准
② TDD — 先写失败的测试，再写实现代码
③ frontend-dev / backend-dev — 编码实现
                         ↓
         ┌───────────────┼───────────────┐
         ↓               ↓               ↓
   unit-test-writer  integration-test  e2e-test-writer
      (单元测试)        (集成测试)         (E2E测试)
         └───────────────┼───────────────┘
                         ↓
④ test-analyzer — 汇总三个测试结果，分析失败，修到全部通过
⑤ frontend-reviewer / backend-reviewer — 检视变更
⑥ verification — 运行完整验证确认通过
⑦ commit — 提交代码
```

步骤 ③ 完成后，使用 `superpowers:dispatching-parallel-agents` 同时 dispatch 三个测试 agent。
```

- [ ] **Step 2: Commit**

```bash
git add .claude/rules/workflow.md
git commit -m "docs: 工作流优化为并行测试模式"
```

---

### Task 5: 更新 CLAUDE.md 工作流部分

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: 替换工作流图**

将 CLAUDE.md 中 Development Workflow 段的流程图替换为并行版本：

```
用户需求
  ↓
① brainstorming（需求分析、方案设计）
  ↓
② TDD（先写测试）
  ↓
③ frontend-dev / backend-dev（编码实现）
  ↓
┌─────────────────────────────────────┐
│  dispatching-parallel-agents        │
│  ┌───────────┬──────────┬────────┐  │
│  │unit-test  │integration│  e2e  │  │
│  │-writer    │-test     │-test  │  │
│  └───────────┴──────────┴────────┘  │
└─────────────────────────────────────┘
  ↓
④ test-analyzer（汇总分析）
  ↓
⑤ frontend-reviewer / backend-reviewer（代码检视）
  ↓
⑥ verification（验证通过）
  ↓
⑦ commit（提交代码）
```

并在 agent 列表中补充 `dispatching-parallel-agents` 技能说明。

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: CLAUDE.md工作流更新为并行测试模式"
```
