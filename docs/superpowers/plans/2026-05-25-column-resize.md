# 表格列宽拖动调整 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 TaskTable 和 WeeklyReport 任务明细表增加列宽拖动调整功能，会话内有效。

**Architecture:** 提取一个通用 `useColumnResize` hook，在 `<th>` 右边缘放置 invisible 拖拽手柄，通过 mousedown/mousemove/mouseup 实现列宽调整。hook 管理 columnWidths 状态，提供 `getThProps`（注入到 `<Table.Th>` 的 style）和 `resizeHandle`（渲染在 `<Table.Th>` 内部的拖拽竖条）。

**Tech Stack:** React hooks + TypeScript，不引入第三方依赖

---

### Task 1: 创建 `useColumnResize` hook

**Files:**
- Create: `FE/src/hooks/useColumnResize.ts`

- [ ] **Step 1: 实现完整 hook（含 resizeHandle）**

```typescript
import { useState, useCallback, useRef, useEffect } from 'react';

export interface ColumnResizeResult {
  columnWidths: Record<string, number>;
  getThProps: (columnKey: string) => React.ThHTMLAttributes<HTMLTableHeaderCellElement> & {
    style: React.CSSProperties;
  };
  resizeHandle: (columnKey: string) => React.ReactElement;
  resetWidths: () => void;
}

export function useColumnResize(defaultWidths: Record<string, number>): ColumnResizeResult {
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(defaultWidths);
  const dragState = useRef<{
    columnKey: string;
    startX: number;
    startWidth: number;
  } | null>(null);

  const handleMouseDown = useCallback(
    (columnKey: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragState.current = {
        columnKey,
        startX: e.clientX,
        startWidth: columnWidths[columnKey] || defaultWidths[columnKey],
      };
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
    },
    [columnWidths, defaultWidths],
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState.current) return;
      const { columnKey, startX, startWidth } = dragState.current;
      const diff = e.clientX - startX;
      const newWidth = Math.max(60, startWidth + diff);
      setColumnWidths((prev) => ({ ...prev, [columnKey]: newWidth }));
    };

    const handleMouseUp = () => {
      if (!dragState.current) return;
      dragState.current = null;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const getThProps = useCallback(
    (columnKey: string) => {
      const width = columnWidths[columnKey] ?? defaultWidths[columnKey];
      return {
        style: {
          width,
          minWidth: width,
          position: 'relative' as const,
        },
      };
    },
    [columnWidths, defaultWidths],
  );

  const resizeHandle = useCallback(
    (columnKey: string) => (
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: 8,
          cursor: 'col-resize',
          zIndex: 1,
        }}
        onMouseDown={(e) => handleMouseDown(columnKey, e)}
      />
    ),
    [handleMouseDown],
  );

  const resetWidths = useCallback(() => {
    setColumnWidths(defaultWidths);
  }, [defaultWidths]);

  return { columnWidths, getThProps, resizeHandle, resetWidths };
}
```

- [ ] **Step 2: 检查 TypeScript 编译**

Run: `cd FE && npx tsc --noEmit src/hooks/useColumnResize.ts`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add FE/src/hooks/useColumnResize.ts
git commit -m "feat: 新增useColumnResize通用hook"
```

---

### Task 2: 接入 TaskTable

**Files:**
- Modify: `FE/src/components/TaskTable/TaskTable.tsx`

- [ ] **Step 1: 添加 import 和常量**

在现有 import 下方添加：

```typescript
import { useColumnResize } from '../../hooks/useColumnResize';
```

在组件定义上方添加常量：

```typescript
const TASK_COLUMN_DEFAULTS: Record<string, number> = {
  project: 100,
  usDts: 190,
  detail: 300,
  progress: 90,
  estimated: 90,
  actual: 90,
  plannedWeekly: 90,
  weeklyActual: 90,
  plannedTime: 170,
  actualTime: 170,
  assignee: 90,
  remark: 110,
  actions: 100,
};
```

- [ ] **Step 2: 在组件内调用 hook**

在 `const { user, hasRole } = useAuth();`（行 33）之后添加：

```typescript
const { columnWidths, getThProps, resizeHandle } = useColumnResize(TASK_COLUMN_DEFAULTS);
```

- [ ] **Step 3: 替换 <Table.Th> ——带排序的列（行 265-272 项目列）**

把：
```tsx
<Table.Th style={{ width: 100 }}>
  <Group gap={4} wrap="nowrap">
    项目
    <ActionIcon size="xs" variant={sortField === 'project' ? 'filled' : 'subtle'} onClick={() => handleSort('project')}>
      {sortField === 'project' && sortDirection === 'desc' ? '▼' : '▲'}
    </ActionIcon>
  </Group>
</Table.Th>
```

改为：
```tsx
<Table.Th {...getThProps('project')}>
  <Group gap={4} wrap="nowrap">
    项目
    <ActionIcon size="xs" variant={sortField === 'project' ? 'filled' : 'subtle'} onClick={() => handleSort('project')}>
      {sortField === 'project' && sortDirection === 'desc' ? '▼' : '▲'}
    </ActionIcon>
  </Group>
  {resizeHandle('project')}
</Table.Th>
```

- [ ] **Step 4: 替换 <Table.Th> ——纯文本列（行 273-278）**

将 5 个 `<Table.Th style={{ width: XXX }}>文字</Table.Th>` 改为 `{...getThProps}` + `{resizeHandle}` 模式：

```tsx
<Table.Th {...getThProps('usDts')}>US/DTS{resizeHandle('usDts')}</Table.Th>
<Table.Th {...getThProps('detail')}>任务详情{resizeHandle('detail')}</Table.Th>
<Table.Th {...getThProps('progress')}>进度{resizeHandle('progress')}</Table.Th>
<Table.Th {...getThProps('estimated')}>预计{resizeHandle('estimated')}</Table.Th>
<Table.Th {...getThProps('actual')}>实际{resizeHandle('actual')}</Table.Th>
```

- [ ] **Step 5: 替换 <Table.Th> ——继续 4 列（行 279-282）**

```tsx
<Table.Th {...getThProps('plannedWeekly')}>本周计划{resizeHandle('plannedWeekly')}</Table.Th>
<Table.Th {...getThProps('weeklyActual')}>本周实际{resizeHandle('weeklyActual')}</Table.Th>
<Table.Th {...getThProps('plannedTime')}>计划时间{resizeHandle('plannedTime')}</Table.Th>
<Table.Th {...getThProps('actualTime')}>实际时间{resizeHandle('actualTime')}</Table.Th>
```

- [ ] **Step 6: 替换 <Table.Th> ——责任人列（行 282-289）+ 备注（行 290）+ 操作（行 291）**

责任人（带排序）：
```tsx
<Table.Th {...getThProps('assignee')}>
  <Group gap={4} wrap="nowrap">
    责任人
    <ActionIcon size="xs" variant={sortField === 'assignee' ? 'filled' : 'subtle'} onClick={() => handleSort('assignee')}>
      {sortField === 'assignee' && sortDirection === 'desc' ? '▼' : '▲'}
    </ActionIcon>
  </Group>
  {resizeHandle('assignee')}
</Table.Th>
```

备注和操作：
```tsx
<Table.Th {...getThProps('remark')}>备注{resizeHandle('remark')}</Table.Th>
<Table.Th {...getThProps('actions')}>操作{resizeHandle('actions')}</Table.Th>
```

- [ ] **Step 7: 替换所有 <Table.Td> 的固定宽度为动态宽度**

数据行（行 302-378）中，将每列的 `style={{ width: XXX }}` 改为 `style={{ width: columnWidths.xxx }}`：

| 原宽度 | 改为 |
|--------|------|
| `style={{ width: 100 }}`（项目列） | `style={{ width: columnWidths.project }}` |
| `style={{ width: 190 }}`（US/DTS） | `style={{ width: columnWidths.usDts }}` |
| `style={{ width: 300 }}`（任务详情） | `style={{ width: columnWidths.detail }}` |
| `style={{ width: 90 }}`（进度） | `style={{ width: columnWidths.progress }}` |
| `style={{ width: 90 }}`（预计） | `style={{ width: columnWidths.estimated }}` |
| `style={{ width: 90 }}`（实际） | `style={{ width: columnWidths.actual }}` |
| `style={{ width: 90 }}`（本周计划） | `style={{ width: columnWidths.plannedWeekly }}` |
| `style={{ width: 90 }}`（本周实际） | `style={{ width: columnWidths.weeklyActual }}` |
| `style={{ width: 170 }}`（计划时间） | `style={{ width: columnWidths.plannedTime }}` |
| `style={{ width: 170 }}`（实际时间） | `style={{ width: columnWidths.actualTime }}` |
| `style={{ width: 90 }}`（责任人） | `style={{ width: columnWidths.assignee }}` |
| `style={{ width: 110 }}`（备注） | `style={{ width: columnWidths.remark }}` |
| `style={{ width: 100 }}`（操作） | `style={{ width: columnWidths.actions }}` |

- [ ] **Step 8: 更新 Table 添加 tableLayout: fixed**

将 `<Table striped highlightOnHover style={{ minWidth: 1680 }}>` 改为：

```tsx
<Table striped highlightOnHover style={{ minWidth: 1680, tableLayout: 'fixed' }}>
```

- [ ] **Step 9: TypeScript 检查 + 运行测试**

```bash
cd FE && npx tsc --noEmit
cd FE && npx vitest --run
```

Expected: No type errors, all tests pass.

- [ ] **Step 10: Commit**

```bash
git add FE/src/components/TaskTable/TaskTable.tsx
git commit -m "feat: TaskTable接入列宽拖动调整"
```

---

### Task 3: 接入 WeeklyReport 任务明细表

**Files:**
- Modify: `FE/src/pages/WeeklyReport.page.tsx`

- [ ] **Step 1: 添加 import 和常量**

在文件顶部 import 区域添加：

```typescript
import { useColumnResize } from '../../hooks/useColumnResize';
```

在组件定义上方添加常量：

```typescript
const WEEKLY_COLUMN_DEFAULTS: Record<string, number> = {
  project: 100,
  usDts: 190,
  detail: 300,
  progress: 90,
  estimated: 90,
  actual: 90,
  plannedWeekly: 90,
  weeklyActual: 90,
  plannedTime: 170,
  actualTime: 170,
  assignee: 90,
  remark: 110,
};
```

- [ ] **Step 2: 在组件内调用 hook**

找到 `WeeklyReport` 组件内其他 hook 调用处，添加：

```typescript
const { columnWidths, getThProps, resizeHandle } = useColumnResize(WEEKLY_COLUMN_DEFAULTS);
```

- [ ] **Step 3: 替换任务明细表（行 627-652）的 <Table.Th> ——项目列（带排序）**

```tsx
<Table.Th {...getThProps('project')}>
  <Group gap={4} wrap="nowrap">
    项目
    <ActionIcon size="xs" variant={sortField === 'project' ? 'filled' : 'subtle'} onClick={() => handleSort('project')}>
      {sortField === 'project' && sortDirection === 'desc' ? '▼' : '▲'}
    </ActionIcon>
  </Group>
  {resizeHandle('project')}
</Table.Th>
```

- [ ] **Step 4: 替换 <Table.Th> ——纯文本列（US/DTS 到 实际时间）**

```tsx
<Table.Th {...getThProps('usDts')}>US/DTS{resizeHandle('usDts')}</Table.Th>
<Table.Th {...getThProps('detail')}>任务详情{resizeHandle('detail')}</Table.Th>
<Table.Th {...getThProps('progress')}>进度{resizeHandle('progress')}</Table.Th>
<Table.Th {...getThProps('estimated')}>预计{resizeHandle('estimated')}</Table.Th>
<Table.Th {...getThProps('actual')}>实际{resizeHandle('actual')}</Table.Th>
<Table.Th {...getThProps('plannedWeekly')}>本周计划{resizeHandle('plannedWeekly')}</Table.Th>
<Table.Th {...getThProps('weeklyActual')}>本周实际{resizeHandle('weeklyActual')}</Table.Th>
<Table.Th {...getThProps('plannedTime')}>计划时间{resizeHandle('plannedTime')}</Table.Th>
<Table.Th {...getThProps('actualTime')}>实际时间{resizeHandle('actualTime')}</Table.Th>
```

- [ ] **Step 5: 替换 <Table.Th> ——责任人（带排序）+ 备注**

```tsx
<Table.Th {...getThProps('assignee')}>
  <Group gap={4} wrap="nowrap">
    责任人
    <ActionIcon size="xs" variant={sortField === 'assignee' ? 'filled' : 'subtle'} onClick={() => handleSort('assignee')}>
      {sortField === 'assignee' && sortDirection === 'desc' ? '▼' : '▲'}
    </ActionIcon>
  </Group>
  {resizeHandle('assignee')}
</Table.Th>
<Table.Th {...getThProps('remark')}>备注{resizeHandle('remark')}</Table.Th>
```

- [ ] **Step 6: 替换所有 <Table.Td> 的固定宽度为动态宽度**

与 Task 2 Step 7 映射相同（少一个 actions 列），全部改为 `style={{ width: columnWidths.xxx }}`。

- [ ] **Step 7: 更新 Table 添加 tableLayout: fixed**

将行 624 的 `<Table striped highlightOnHover style={{ minWidth: 1680 }}>` 改为：

```tsx
<Table striped highlightOnHover style={{ minWidth: 1680, tableLayout: 'fixed' }}>
```

- [ ] **Step 8: TypeScript 检查 + 运行测试**

```bash
cd FE && npx tsc --noEmit
cd FE && npx vitest --run
```
Expected: No type errors, all tests pass.

- [ ] **Step 9: Commit**

```bash
git add FE/src/pages/WeeklyReport.page.tsx
git commit -m "feat: WeeklyReport任务明细表接入列宽拖动调整"
```

---

### Task 4: 手动验证

- [ ] **Step 1: 启动项目**

```bash
cd BE && npm run start:dev &
cd FE && npm run dev &
```

- [ ] **Step 2: 验证 TaskTable**

1. 打开 `http://localhost:5173`，登录（admin / admin123）
2. 任务表格中 hover 任意列头右边缘，光标变 `col-resize`
3. 拖动调整列宽，确认实时变化
4. 拖到小于 60px 时不再缩小
5. 刷新页面后列宽恢复默认值

- [ ] **Step 3: 验证 WeeklyReport 任务明细表**

1. 进入 `/weekly-report?year=2026&week=21`
2. 滚动到"任务明细"表格，重复 Step 2 验证

- [ ] **Step 4: Commit（如有微调）**

```bash
git add -A
git commit -m "chore: 列宽拖动功能验证通过"
```
