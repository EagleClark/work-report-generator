# 表格列宽拖动调整功能

## 范围

仅以下两个表格：
- `TaskTable`（13 列）
- `WeeklyReport` 任务明细表（12 列）

列宽调整为会话内有效，刷新后恢复默认。

## 方案

轻量自定义 hook `useColumnResize`，通过 mousedown/mousemove/mouseup 在列边框拖拽实现。不引入第三方依赖。

### API

```typescript
function useColumnResize(defaultWidths: Record<string, number>): {
  columnWidths: Record<string, number>;
  getThProps: (columnKey: string) => ThProps;
  resetWidths: () => void;
}
```

- `defaultWidths`: 各列默认宽度（px）
- `columnWidths`: 当前各列宽度（px）
- `getThProps`: 返回需注入 `<Table.Th>` 的 props（style + onMouseDown）
- `resetWidths`: 重置为默认宽度

### 交互细节

- 拖拽手柄在 `<th>` 右边缘，hover 时 cursor 变为 col-resize
- 最小宽度 60px
- 拖拽时 body 设置 `userSelect: none` 禁止文本选中

### 文件变更

1. **新增** `FE/src/hooks/useColumnResize.ts` — hook 实现
2. **修改** `FE/src/components/TaskTable/TaskTable.tsx` — 接入 hook
3. **修改** `FE/src/pages/WeeklyReport.page.tsx` — 接入 hook

### 测试

- `useColumnResize` 单测：初始宽度、拖动改变宽度、最小宽度约束、resetWidths
- TaskTable 集成测试：渲染后列宽与默认值一致
