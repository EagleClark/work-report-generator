# 开发工作流

本项目配置了 agent 工作流和 superpowers skills，开发必须遵循此流程。

## Agent 列表

| Agent | 用途 |
|-------|------|
| `frontend-dev` | 前端 React + Mantine 代码开发 |
| `backend-dev` | 后端 NestJS + TypeORM 代码开发 |
| `unit-test-writer` | vitest 单元测试编写 |
| `integration-test-writer` | 跨组件/跨服务集成测试 |
| `e2e-test-writer` | Playwright E2E 测试 |
| `test-analyzer` | 执行测试、分析失败、提供修复 |
| `frontend-reviewer` | 前端代码检视 |
| `backend-reviewer` | 后端代码检视 |

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

## Superpowers Skills

每个步骤必须调用对应的 superpowers skill，不得跳过：

| 步骤 | 必须调用的 Skill |
|------|-----------------|
| 入口 | `superpowers:using-superpowers` |
| 需求分析 | `superpowers:brainstorming` |
| 写测试 | `superpowers:test-driven-development` |
| 调试 Bug | `superpowers:systematic-debugging` |
| 完成任务 | `superpowers:verification-before-completion` |

## 规则

- 禁止跳过 brainstorming 直接写代码
- 禁止跳过 TDD 直接写实现
- 禁止跳过 review 直接提交
- 提交前必须跑通所有测试
- 实现完成后必须同时编写单元测试、集成测试、E2E 测试（可并行），禁止只写一种
- **每次修改后执行 `git add` 暂存，但不要执行 `git commit`，提交由用户手动触发**
