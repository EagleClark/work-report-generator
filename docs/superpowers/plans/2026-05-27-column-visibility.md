# 列配置隐藏 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 TaskTable 和 WeeklyReport 任务明细表工具栏右侧添加齿轮图标，点击弹出 Popover 勾选控制列的显示/隐藏。

**Architecture:** 创建独立的 `useColumnVisibility` hook 管理 hiddenKeys 状态并渲染 ColumnConfigButton（齿轮+Popover+Checkbox 列表）。表格渲染时通过 `visibleKeys` 过滤列，与现有 `useColumnResize` 独立运作。

**Tech Stack:** React + TypeScript + Mantine UI + @tabler/icons-react (IconSettings)

---

### Task 1: useColumnVisibility hook (TDD)

**Files:**
- Create: `FE/src/hooks/useColumnVisibility.tsx`
- Create: `FE/test/unit/hooks/useColumnVisibility.test.tsx`

- [ ] **Step 1: Write the failing unit test**

Write `FE/test/unit/hooks/useColumnVisibility.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useColumnVisibility } from '@/hooks/useColumnVisibility';

const MOCK_COLUMNS = [
  { key: 'a', label: '列A' },
  { key: 'b', label: '列B' },
  { key: 'c', label: '列C' },
];

describe('useColumnVisibility', () => {
  it('初始状态全部列可见', () => {
    const { result } = renderHook(() => useColumnVisibility(MOCK_COLUMNS));
    expect(result.current.visibleKeys).toEqual(['a', 'b', 'c']);
    expect(result.current.isVisible('a')).toBe(true);
    expect(result.current.isVisible('b')).toBe(true);
    expect(result.current.isVisible('c')).toBe(true);
  });

  it('toggleColumn 可以隐藏列', () => {
    const { result } = renderHook(() => useColumnVisibility(MOCK_COLUMNS));
    act(() => { result.current.toggleColumn('b'); });
    expect(result.current.visibleKeys).toEqual(['a', 'c']);
    expect(result.current.isVisible('b')).toBe(false);
  });

  it('toggleColumn 可以恢复已隐藏的列', () => {
    const { result } = renderHook(() => useColumnVisibility(MOCK_COLUMNS));
    act(() => { result.current.toggleColumn('b'); });
    act(() => { result.current.toggleColumn('b'); });
    expect(result.current.visibleKeys).toEqual(['a', 'b', 'c']);
  });

  it('至少保留 1 列可见 — toggleColumn 无法隐藏最后一列', () => {
    const { result } = renderHook(() => useColumnVisibility(MOCK_COLUMNS));
    act(() => { result.current.toggleColumn('a'); });
    act(() => { result.current.toggleColumn('b'); });
    // 现在只剩 'c'，尝试隐藏它
    act(() => { result.current.toggleColumn('c'); });
    expect(result.current.visibleKeys).toEqual(['c']);
  });

  it('showAll 恢复全部列可见', () => {
    const { result } = renderHook(() => useColumnVisibility(MOCK_COLUMNS));
    act(() => { result.current.toggleColumn('a'); });
    act(() => { result.current.toggleColumn('b'); });
    act(() => { result.current.showAll(); });
    expect(result.current.visibleKeys).toEqual(['a', 'b', 'c']);
  });

  it('hideAll 仅保留第一列可见', () => {
    const { result } = renderHook(() => useColumnVisibility(MOCK_COLUMNS));
    act(() => { result.current.hideAll(); });
    expect(result.current.visibleKeys).toEqual(['a']);
    expect(result.current.isVisible('a')).toBe(true);
    expect(result.current.isVisible('b')).toBe(false);
    expect(result.current.isVisible('c')).toBe(false);
  });

  it('visibleKeys 保持 columns 参数的原始顺序', () => {
    const { result } = renderHook(() => useColumnVisibility(MOCK_COLUMNS));
    act(() => { result.current.toggleColumn('a'); });
    act(() => { result.current.toggleColumn('c'); });
    // 只剩 'b'
    expect(result.current.visibleKeys).toEqual(['b']);
  });

  it('ColumnConfigButton 是一个 React 元素', () => {
    const { result } = renderHook(() => useColumnVisibility(MOCK_COLUMNS));
    expect(result.current.ColumnConfigButton).toBeDefined();
    expect(typeof result.current.ColumnConfigButton).toBe('object');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd FE && npx vitest run test/unit/hooks/useColumnVisibility.test.tsx`
Expected: FAIL — `useColumnVisibility` not exported, file not found

- [ ] **Step 3: Write minimal implementation**

Write `FE/src/hooks/useColumnVisibility.tsx`:

```tsx
import { useState, useCallback, useMemo } from 'react';
import { ActionIcon, Popover, Checkbox, Stack, Button, Group } from '@mantine/core';
import { IconSettings } from '@tabler/icons-react';

export interface ColumnMeta {
  key: string;
  label: string;
}

export interface ColumnVisibilityResult {
  visibleKeys: string[];
  isVisible: (key: string) => boolean;
  toggleColumn: (key: string) => void;
  showAll: () => void;
  hideAll: () => void;
  ColumnConfigButton: React.ReactElement;
}

export function useColumnVisibility(columns: ColumnMeta[]): ColumnVisibilityResult {
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set());

  const visibleKeys = useMemo(
    () => columns.map((c) => c.key).filter((k) => !hiddenKeys.has(k)),
    [columns, hiddenKeys],
  );

  const toggleColumn = useCallback(
    (key: string) => {
      setHiddenKeys((prev) => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
        } else {
          if (prev.size >= columns.length - 1) return prev;
          next.add(key);
        }
        return next;
      });
    },
    [columns.length],
  );

  const isVisible = useCallback((key: string) => !hiddenKeys.has(key), [hiddenKeys]);

  const showAll = useCallback(() => setHiddenKeys(new Set()), []);
  const hideAll = useCallback(() => {
    setHiddenKeys(new Set(columns.slice(1).map((c) => c.key)));
  }, [columns]);

  const ColumnConfigButton = (
    <Popover width={220} position="bottom-end" shadow="md">
      <Popover.Target>
        <ActionIcon variant="subtle" color="gray">
          <IconSettings size={18} />
        </ActionIcon>
      </Popover.Target>
      <Popover.Dropdown>
        <Stack gap="xs">
          {columns.map((col) => (
            <Checkbox
              key={col.key}
              label={col.label}
              checked={isVisible(col.key)}
              disabled={isVisible(col.key) && visibleKeys.length <= 1}
              onChange={() => toggleColumn(col.key)}
            />
          ))}
          <Group justify="flex-end" gap="xs" mt="xs">
            <Button size="compact-xs" variant="subtle" onClick={showAll}>
              全选
            </Button>
            <Button size="compact-xs" variant="subtle" onClick={hideAll}>
              最少
            </Button>
          </Group>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );

  return { visibleKeys, isVisible, toggleColumn, showAll, hideAll, ColumnConfigButton };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd FE && npx vitest run test/unit/hooks/useColumnVisibility.test.tsx`
Expected: 8 tests PASS

- [ ] **Step 5: Stage changes**

```bash
git -C /root/projects/work-report-generator add FE/src/hooks/useColumnVisibility.tsx FE/test/unit/hooks/useColumnVisibility.test.tsx
```

---

### Task 2: TaskTable 集成列配置隐藏

**Files:**
- Modify: `FE/src/components/TaskTable/TaskTable.tsx`
- Create: `FE/test/integration/TaskTable.visibility.integration.test.tsx`

- [ ] **Step 1: Write the failing integration test**

Write `FE/test/integration/TaskTable.visibility.integration.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
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

describe('TaskTable 列配置隐藏集成测试', () => {
  it('渲染齿轮图标按钮', () => {
    render(
      <TestWrapper>
        <TaskTable />
      </TestWrapper>
    );

    const buttons = screen.getAllByRole('button');
    const gearButton = buttons.find(btn =>
      btn.querySelector('svg')
    );
    expect(gearButton).toBeDefined();
  });

  it('点击齿轮图标弹出 Popover 包含列 Checkbox', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <TaskTable />
      </TestWrapper>
    );

    const buttons = screen.getAllByRole('button');
    const gearButton = buttons.find(btn =>
      btn.querySelector('svg')
    )!;
    await user.click(gearButton);

    expect(screen.getByRole('checkbox', { name: /项目/ })).toBeDefined();
    expect(screen.getByRole('checkbox', { name: /US\/DTS/ })).toBeDefined();
    expect(screen.getByRole('checkbox', { name: /操作/ })).toBeDefined();
  });

  it('取消勾选某列后该列从表头移除', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <TaskTable />
      </TestWrapper>
    );

    const buttons = screen.getAllByRole('button');
    const gearButton = buttons.find(btn =>
      btn.querySelector('svg')
    )!;
    await user.click(gearButton);

    const usDtsCheckbox = screen.getByRole('checkbox', { name: /US\/DTS/ });
    await user.click(usDtsCheckbox);

    // 关闭 popover
    await user.click(gearButton);

    // US/DTS 列头不应存在
    expect(screen.queryByText('US/DTS')).toBeNull();
  });
});
```

- [ ] **Step 2: Run integration test to verify it fails**

Run: `cd FE && npx vitest run test/integration/TaskTable.visibility.integration.test.tsx`
Expected: FAIL — 齿轮图标未渲染，或找不到 checkbox

- [ ] **Step 3: Implement TaskTable integration**

In `FE/src/components/TaskTable/TaskTable.tsx`:

**a) Add import:**
```tsx
import { useColumnVisibility, type ColumnMeta } from '../../hooks/useColumnVisibility';
```

**b) Add column metadata constant:**
```tsx
const TASK_COLUMNS: ColumnMeta[] = [
  { key: 'project', label: '项目' },
  { key: 'usDts', label: 'US/DTS' },
  { key: 'detail', label: '任务详情' },
  { key: 'progress', label: '进度' },
  { key: 'estimated', label: '预计' },
  { key: 'actual', label: '实际' },
  { key: 'plannedWeekly', label: '本周计划' },
  { key: 'weeklyActual', label: '本周实际' },
  { key: 'plannedTime', label: '计划时间' },
  { key: 'actualTime', label: '实际时间' },
  { key: 'assignee', label: '责任人' },
  { key: 'remark', label: '备注' },
  { key: 'actions', label: '操作' },
];
```

**c) Add hook call (after existing hooks):**
```tsx
const { visibleKeys, isVisible, ColumnConfigButton } = useColumnVisibility(TASK_COLUMNS);
```

**d) Add ColumnConfigButton to toolbar (inside the `<Group>` before the closing `</Group>`):**

Replace the Group closing line. Current toolbar:
```tsx
<Group mb="md" align="flex-end">
  <Select ... />
  <Select ... />
  <Button ...>新增任务</Button>
  <Button ...>复制上周任务</Button>
  <Button ...>刷新</Button>
</Group>
```

Change `</Group>` to:
```tsx
  {ColumnConfigButton}
</Group>
```

But wait — we want it on the right side. Consider adding `justify="space-between"` or wrapping in a flex container. Better approach: nest the Group inside a flex container, or use `ml="auto"` style on the gear icon. Actually, the simplest approach:
```tsx
<Group mb="md" align="flex-end" justify="space-between">
  <Group align="flex-end" gap="sm">
    <Select ... />
    <Select ... />
    <Button ...>新增任务</Button>
    <Button ...>复制上周任务</Button>
    <Button ...>刷新</Button>
  </Group>
  {ColumnConfigButton}
</Group>
```

Actually hmm, this changes the structure more than needed. A simpler approach: just add `ml="auto"` wrapper around ColumnConfigButton, but ColumnConfigButton is a ReactElement so it needs to be wrapped in a Box or span.

Better: just add the gear button as the last item in the Group. The user said "右侧展示一个齿轮图标" — just placing it last in the toolbar Group achieves this naturally. No need for justify="space-between".

**e) Conditionally render table headers:**

Replace the entire `<Table.Thead>` content. Current:
```tsx
<Table.Tr>
  <Table.Th {...getThProps('project')}>
    <Group gap={4} wrap="nowrap">
      项目
      <ActionIcon ... />
    </Group>
    {resizeHandle('project')}
  </Table.Th>
  <Table.Th {...getThProps('usDts')}>US/DTS{resizeHandle('usDts')}</Table.Th>
  <Table.Th {...getThProps('detail')}>任务详情{resizeHandle('detail')}</Table.Th>
  <Table.Th {...getThProps('progress')}>进度{resizeHandle('progress')}</Table.Th>
  <Table.Th {...getThProps('estimated')}>预计{resizeHandle('estimated')}</Table.Th>
  <Table.Th {...getThProps('actual')}>实际{resizeHandle('actual')}</Table.Th>
  <Table.Th {...getThProps('plannedWeekly')}>本周计划{resizeHandle('plannedWeekly')}</Table.Th>
  <Table.Th {...getThProps('weeklyActual')}>本周实际{resizeHandle('weeklyActual')}</Table.Th>
  <Table.Th {...getThProps('plannedTime')}>计划时间{resizeHandle('plannedTime')}</Table.Th>
  <Table.Th {...getThProps('actualTime')}>实际时间{resizeHandle('actualTime')}</Table.Th>
  <Table.Th {...getThProps('assignee')}>
    <Group gap={4} wrap="nowrap">
      责任人
      <ActionIcon ... />
    </Group>
    {resizeHandle('assignee')}
  </Table.Th>
  <Table.Th {...getThProps('remark')}>备注{resizeHandle('remark')}</Table.Th>
  <Table.Th {...getThProps('actions')}>操作</Table.Th>
</Table.Tr>
```

Replace with:
```tsx
<Table.Tr>
  {isVisible('project') && (
    <Table.Th {...getThProps('project')}>
      <Group gap={4} wrap="nowrap">
        项目
        <ActionIcon size="xs" variant={sortField === 'project' ? 'filled' : 'subtle'} onClick={() => handleSort('project')}>
          {sortField === 'project' && sortDirection === 'desc' ? '▼' : '▲'}
        </ActionIcon>
      </Group>
      {resizeHandle('project')}
    </Table.Th>
  )}
  {isVisible('usDts') && (
    <Table.Th {...getThProps('usDts')}>US/DTS{resizeHandle('usDts')}</Table.Th>
  )}
  {isVisible('detail') && (
    <Table.Th {...getThProps('detail')}>任务详情{resizeHandle('detail')}</Table.Th>
  )}
  {isVisible('progress') && (
    <Table.Th {...getThProps('progress')}>进度{resizeHandle('progress')}</Table.Th>
  )}
  {isVisible('estimated') && (
    <Table.Th {...getThProps('estimated')}>预计{resizeHandle('estimated')}</Table.Th>
  )}
  {isVisible('actual') && (
    <Table.Th {...getThProps('actual')}>实际{resizeHandle('actual')}</Table.Th>
  )}
  {isVisible('plannedWeekly') && (
    <Table.Th {...getThProps('plannedWeekly')}>本周计划{resizeHandle('plannedWeekly')}</Table.Th>
  )}
  {isVisible('weeklyActual') && (
    <Table.Th {...getThProps('weeklyActual')}>本周实际{resizeHandle('weeklyActual')}</Table.Th>
  )}
  {isVisible('plannedTime') && (
    <Table.Th {...getThProps('plannedTime')}>计划时间{resizeHandle('plannedTime')}</Table.Th>
  )}
  {isVisible('actualTime') && (
    <Table.Th {...getThProps('actualTime')}>实际时间{resizeHandle('actualTime')}</Table.Th>
  )}
  {isVisible('assignee') && (
    <Table.Th {...getThProps('assignee')}>
      <Group gap={4} wrap="nowrap">
        责任人
        <ActionIcon size="xs" variant={sortField === 'assignee' ? 'filled' : 'subtle'} onClick={() => handleSort('assignee')}>
          {sortField === 'assignee' && sortDirection === 'desc' ? '▼' : '▲'}
        </ActionIcon>
      </Group>
      {resizeHandle('assignee')}
    </Table.Th>
  )}
  {isVisible('remark') && (
    <Table.Th {...getThProps('remark')}>备注{resizeHandle('remark')}</Table.Th>
  )}
  {isVisible('actions') && (
    <Table.Th {...getThProps('actions')}>操作</Table.Th>
  )}
</Table.Tr>
```

**f) Conditionally render tbody cells:**

For each task row, replace:
```tsx
{sortedTasks.map((task) => (
  <Table.Tr key={task.id}>
    <Table.Td style={{ width: columnWidths.project }}>...</Table.Td>
    <Table.Td style={{ width: columnWidths.usDts }}>...</Table.Td>
    <Table.Td style={{ width: columnWidths.detail }}>...</Table.Td>
    ...
    <Table.Td style={{ width: columnWidths.actions }}>...</Table.Td>
  </Table.Tr>
))}
```

With:
```tsx
{sortedTasks.map((task) => (
  <Table.Tr key={task.id}>
    {isVisible('project') && (
      <Table.Td style={{ width: columnWidths.project }}>
        <Tooltip label={task.project} disabled={task.project.length <= 10}>
          <Text lineClamp={1} style={{ maxWidth: columnWidths.project, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {task.project}
          </Text>
        </Tooltip>
      </Table.Td>
    )}
    {isVisible('usDts') && (
      <Table.Td style={{ width: columnWidths.usDts }}>{renderUsDts(task)}</Table.Td>
    )}
    {isVisible('detail') && (
      <Table.Td style={{ width: columnWidths.detail }}>
        <Tooltip label={task.taskDetail} multiline maw={400} styles={{ tooltip: { whiteSpace: 'pre-wrap', wordBreak: 'break-word' } }}>
          <Text lineClamp={2} style={{ maxWidth: columnWidths.detail }}>{task.taskDetail}</Text>
        </Tooltip>
      </Table.Td>
    )}
    {isVisible('progress') && (
      <Table.Td style={{ width: columnWidths.progress }}>
        <Badge color={getProgressColor(task.progress)}>{task.progress}%</Badge>
      </Table.Td>
    )}
    {isVisible('estimated') && (
      <Table.Td style={{ width: columnWidths.estimated }}>{task.estimatedWorkload || '-'}</Table.Td>
    )}
    {isVisible('actual') && (
      <Table.Td style={{ width: columnWidths.actual }}>{task.actualWorkload || '-'}</Table.Td>
    )}
    {isVisible('plannedWeekly') && (
      <Table.Td style={{ width: columnWidths.plannedWeekly }}>{task.plannedWeeklyWorkload || '-'}</Table.Td>
    )}
    {isVisible('weeklyActual') && (
      <Table.Td style={{ width: columnWidths.weeklyActual }}>{task.weeklyWorkload || '-'}</Table.Td>
    )}
    {isVisible('plannedTime') && (
      <Table.Td style={{ width: columnWidths.plannedTime }}>
        <Text size="xs">{task.plannedStartDate || '-'} ~ {task.plannedEndDate || '-'}</Text>
      </Table.Td>
    )}
    {isVisible('actualTime') && (
      <Table.Td style={{ width: columnWidths.actualTime }}>
        <Text size="xs">{task.actualStartDate || '-'} ~ {task.actualEndDate || '-'}</Text>
      </Table.Td>
    )}
    {isVisible('assignee') && (
      <Table.Td style={{ width: columnWidths.assignee }}>{task.assignee || '-'}</Table.Td>
    )}
    {isVisible('remark') && (
      <Table.Td style={{ width: columnWidths.remark }}>
        {task.remark ? (
          <Tooltip label={task.remark} multiline maw={300} styles={{ tooltip: { whiteSpace: 'pre-wrap', wordBreak: 'break-word' } }}>
            <span style={{ display: 'inline-block', cursor: 'pointer' }}>
              <Text lineClamp={2} style={{ maxWidth: columnWidths.remark }}>{task.remark}</Text>
            </span>
          </Tooltip>
        ) : (
          <Text c="dimmed">-</Text>
        )}
      </Table.Td>
    )}
    {isVisible('actions') && (
      <Table.Td style={{ width: columnWidths.actions }}>
        {canOperateTask(task) ? (
          <Group gap={4} wrap="nowrap">
            <Button size="compact-xs" variant="light" onClick={() => openEditModal(task)}>编辑</Button>
            <Button size="compact-xs" variant="light" color="red" onClick={() => handleDeleteClick(task.id)}>删除</Button>
          </Group>
        ) : (
          <Text c="dimmed" size="xs">-</Text>
        )}
      </Table.Td>
    )}
  </Table.Tr>
))}
```

**g) Update empty state colSpan to dynamic:**

Change `colSpan={13}` to `colSpan={visibleKeys.length}`.

**h) Add `{ColumnConfigButton}` to the toolbar Group:**

Place it as the last child of the outer `<Group mb="md" align="flex-end">`.

- [ ] **Step 4: Run all tests and verify they pass**

```bash
cd FE && npx vitest run test/unit/hooks/useColumnVisibility.test.tsx test/integration/TaskTable.visibility.integration.test.tsx
```
Expected: All tests PASS

- [ ] **Step 5: Stage changes**

```bash
git -C /root/projects/work-report-generator add FE/src/components/TaskTable/TaskTable.tsx FE/test/integration/TaskTable.visibility.integration.test.tsx
```

---

### Task 3: WeeklyReport 任务明细表集成列配置隐藏

**Files:**
- Modify: `FE/src/pages/WeeklyReport.page.tsx`

- [ ] **Step 1: Add imports and column metadata**

In `FE/src/pages/WeeklyReport.page.tsx`, add import:
```tsx
import { useColumnVisibility, type ColumnMeta } from '../hooks/useColumnVisibility';
```

Add the column metadata constant near `WEEKLY_COLUMN_DEFAULTS`:
```tsx
const WEEKLY_COLUMNS: ColumnMeta[] = [
  { key: 'project', label: '项目' },
  { key: 'usDts', label: 'US/DTS' },
  { key: 'detail', label: '任务详情' },
  { key: 'progress', label: '进度' },
  { key: 'estimated', label: '预计' },
  { key: 'actual', label: '实际' },
  { key: 'plannedWeekly', label: '本周计划' },
  { key: 'weeklyActual', label: '本周实际' },
  { key: 'plannedTime', label: '计划时间' },
  { key: 'actualTime', label: '实际时间' },
  { key: 'assignee', label: '责任人' },
  { key: 'remark', label: '备注' },
];
```

- [ ] **Step 2: Add hook call**

After the existing `useColumnResize` call:
```tsx
const { visibleKeys, isVisible, ColumnConfigButton } = useColumnVisibility(WEEKLY_COLUMNS);
```

- [ ] **Step 3: Add ColumnConfigButton to toolbar and conditional column rendering**

**a) Toolbar —** Replace:
```tsx
<Group mb="sm">
  <Text size="lg" fw={500}>任务明细</Text>
</Group>
```
With:
```tsx
<Group mb="sm" justify="space-between">
  <Text size="lg" fw={500}>任务明细</Text>
  {ColumnConfigButton}
</Group>
```

**b) Table headers —** Add `isVisible()` guards around each `<Table.Th>`, same pattern as TaskTable (12 columns, no actions column).

**c) Table body —** Add `isVisible()` guards around each `<Table.Td>`, same pattern as TaskTable.

**d) Empty state colSpan —** Change `colSpan={12}` to `colSpan={visibleKeys.length}`.

- [ ] **Step 4: Run typecheck and verify**

```bash
cd FE && npm run typecheck
```
Expected: No errors

- [ ] **Step 5: Run all related tests**

```bash
cd FE && npx vitest run test/unit/hooks/useColumnVisibility.test.tsx test/integration/TaskTable.visibility.integration.test.tsx test/integration/TaskTable.resize.integration.test.tsx
```
Expected: All tests PASS

- [ ] **Step 6: Stage changes**

```bash
git -C /root/projects/work-report-generator add FE/src/pages/WeeklyReport.page.tsx
```

---

### Task 4: 完整验证

- [ ] **Step 1: Run full test suite**

```bash
cd FE && npm run test
```
Expected: All tests PASS (typecheck + prettier + lint + vitest + build)

- [ ] **Step 2: Final staging**

```bash
git -C /root/projects/work-report-generator status
```
Verify all changed files are staged and ready for user to commit.
