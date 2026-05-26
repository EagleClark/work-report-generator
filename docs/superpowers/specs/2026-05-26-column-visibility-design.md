# 列配置隐藏功能设计

## 概述

在 TaskTable 和 WeeklyReport 任务明细表工具栏右侧新增齿轮图标，点击弹出 Popover 勾选列显示/隐藏，会话内生效。

## 需求

- 表格工具栏右侧展示齿轮图标
- 点击弹出 Popover，内含各列的 Checkbox 列表
- 勾选控制列的显示/隐藏
- 仅会话内生效，刷新后恢复全部显示

## 涉及文件

| 操作 | 文件 |
|------|------|
| Create | `FE/src/hooks/useColumnVisibility.tsx` |
| Modify | `FE/src/components/TaskTable/TaskTable.tsx` |
| Modify | `FE/src/pages/WeeklyReport.page.tsx` |
| Create | `FE/test/unit/hooks/useColumnVisibility.test.tsx` |
| Modify | `FE/test/integration/TaskTable.resize.integration.test.tsx` |

## 架构

### useColumnVisibility hook

```typescript
// FE/src/hooks/useColumnVisibility.tsx

interface ColumnMeta {
  key: string;
  label: string;
}

interface ColumnVisibilityResult {
  visibleKeys: string[];                         // 按原始顺序的可见列 key 列表
  isVisible: (key: string) => boolean;
  toggleColumn: (key: string) => void;
  showAll: () => void;
  hideAll: () => void;
  ColumnConfigButton: React.ReactElement;         // 齿轮图标 + Popover
}
```

- 内部状态：`hiddenKeys: Set<string>`，初始为空（全部显示）
- `visibleKeys` 从 `columns` 参数过滤掉 `hiddenKeys` 中的 key，保持原始顺序
- `ColumnConfigButton` 使用 `IconSettings`（`@tabler/icons-react`）+ Mantine `Popover` + `Checkbox`
- Popover 内每行一个 Checkbox，checked = isVisible，onChange = toggleColumn

### 表格集成

1. 工具栏 `<Group>` 右侧追加 `{ColumnConfigButton}`
2. `<thead>` 只渲染 `visibleKeys` 中包含的列
3. `<tbody>` 只渲染 `visibleKeys` 中包含的列
4. 空数据行的 `colSpan` 动态计算为 `visibleKeys.length`（TaskTable 操作列 +1）
5. 与 `useColumnResize` 独立，互不影响

### 边界条件

- 至少保留 1 列可见（当用户试图隐藏最后一列时，Checkbox 置灰不可取消勾选）
- 所有列均可配置显示隐藏，包括 TaskTable 的操作列

## 数据流

```
useColumnVisibility({ key: 'project', label: '项目' }, ...)
  → hiddenKeys (Set) 
  → visibleKeys = allKeys.filter(k => !hiddenKeys.has(k))
  → 渲染时只遍历 visibleKeys
```

## 测试策略

- 单元测试：hook 的 toggleColumn、isVisible、visibleKeys、showAll、hideAll
- 集成测试：TaskTable 渲染齿轮图标，点击弹出 Popover，取消勾选后列隐藏

## 前提依赖

- 项目已安装 `@tabler/icons-react`（Mantine 依赖）
