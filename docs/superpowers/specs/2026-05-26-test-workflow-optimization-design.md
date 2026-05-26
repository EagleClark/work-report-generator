# 测试用例固化 + 工作流并行优化

## Part 1: 测试用例固化

### 新增测试文件

| 文件 | 类型 | 覆盖 |
|------|------|------|
| `FE/test/unit/hooks/useColumnResize.test.tsx` | 单测 | hook 初始宽度、拖动改变宽度、最小宽度约束、resetWidths |
| `FE/test/integration/TaskTable.resize.integration.test.tsx` | 集成测试 | TaskTable 列头渲染 resizeHandle、拖动交互 |

### 测试模板（加入 testing.md）

在 `.claude/rules/testing.md` 新增"测试模板"章节：

1. **Hook 单测模板** — render 一个使用 hook 的 TestComponent，通过 data-testid 暴露状态，用 userEvent 模拟拖拽
2. **集成测试模板** — 用 MSW mock API，render 完整组件（含 MantineProvider + MemoryRouter），userEvent 模拟交互

## Part 2: 工作流并行优化

### 新流程

```
brainstorming → TDD → implement
                         ↓
         ┌───────────────┼───────────────┐
         ↓               ↓               ↓
   unit-test-writer  integration-test  e2e-test-writer
         └───────────────┼───────────────┘
                         ↓
                  test-analyzer
                         ↓
                  review → commit
```

三步测试 agent 由 `dispatching-parallel-agents` skill 统一调度，同时 dispatch 三个 agent，等待全部完成后进入 test-analyzer。

### 修改文件

- `CLAUDE.md` — 工作流图改为并行
- `.claude/rules/workflow.md` — 流程步骤更新
- `.claude/rules/testing.md` — 新增测试模板章节
