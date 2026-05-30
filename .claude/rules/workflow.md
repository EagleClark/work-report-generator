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

## 流程分级

根据任务类型选择对应流程，不要一刀切。

### 如何选择

| 特征 | 小 Bug 修复 | 重构 | 需求开发 |
|------|:-----------:|:----:|:--------:|
| 改动范围 | 几个文件/几行 | 跨文件/跨模块 | 新模块/新功能 |
| 是否改变行为 | 否（恢复预期行为） | 否（行为不变） | 是 |
| 是否新增 API/组件 | 否 | 否 | 通常是 |
| 预估时间 | < 1h | 1-4h | > 4h |
| 测试策略 | 补回归测试 | 确保已有测试通过 | 全套新测试 |

**不确定时取更高级别**——宁可多走一步，不要漏。

---

## 🔧 小 Bug 修复

```
① 复现 — 定位根因，写一个失败测试复现 Bug
② 修复 — 最小改动修 Bug
③ test-analyzer — 运行测试，确认修复 + 无回归
④ reviewer — 检视变更
⑤ git add — 暂存，提醒用户手动提交
```

| 步骤 | 必须调用 |
|------|---------|
| 定位根因 | `superpowers:systematic-debugging` |
| 完成后 | `superpowers:verification-before-completion` |

**规则：**
- 修复前必须写测试复现 Bug
- 修复后运行 `test-analyzer` 确认全部通过
- 必须经过 reviewer 检视
- 不要求单元+集成+E2E 全套——只补与 Bug 相关的测试

---

## 🔨 重构

```
① 方案 — 说明目标架构、影响范围、风险点
② 实现 — 执行重构，保持行为不变
③ test-analyzer — 运行已有测试，确认全部通过
④ reviewer — 检视变更（重点：行为是否真的不变）
⑤ git add — 暂存，提醒用户手动提交
```

| 步骤 | 必须调用 |
|------|---------|
| 入口 | `superpowers:using-superpowers` |
| 完成后 | `superpowers:verification-before-completion` |

**规则：**
- 重构前必须写清楚方案（目标架构 + 影响范围）
- 已有测试**必须全部通过**，否则先修 Bug
- 如果重构暴露了测试覆盖盲区 → 补测试
- 不要求写新测试（除非发现遗漏）
- 不要求 E2E 测试

---

## 🚀 需求开发

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
④ test-analyzer — 汇总测试结果，分析失败，修到全部通过
⑤ frontend-reviewer / backend-reviewer — 检视变更
⑥ verification — 运行完整验证确认通过
⑦ git add — 暂存，提醒用户手动提交
```

步骤 ③ 完成后，使用 `superpowers:dispatching-parallel-agents` 同时 dispatch 三个测试 agent。

| 步骤 | 必须调用的 Skill |
|------|-----------------|
| 入口 | `superpowers:using-superpowers` |
| 需求分析 | `superpowers:brainstorming` |
| 写测试 | `superpowers:test-driven-development` |
| 调试 | `superpowers:systematic-debugging` |
| 完成后 | `superpowers:verification-before-completion` |

**规则：**
- 禁止跳过 brainstorming 直接写代码
- 禁止跳过 TDD 直接写实现
- 禁止跳过 review 直接提交
- 提交前必须跑通所有测试
- 必须同时编写单元测试 + 集成测试 + E2E 测试（可并行）
- **需求变更后，必须检查现有测试用例是否受影响，并补齐遗漏的测试覆盖**

---

## 通用规则（所有流程）

- **每次修改后执行 `git add` 暂存，但不要执行 `git commit`，提交由用户手动触发**
- **每次变更后检查现有测试是否受影响，补齐遗漏的测试覆盖**
- 不确定走哪个流程时，选更高级别
