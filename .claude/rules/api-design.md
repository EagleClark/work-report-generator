# API 设计规范（本项目专属）

## 路由命名

- 全部小写复数：`/api/tasks`、`/api/projects`、`/api/users`、`/api/work-reports`
- 全局前缀 `/api` 已在 `main.ts` 中设置，Controller 路由不要重复加
- RESTful 风格：`GET /tasks`、`POST /tasks`、`PUT /tasks/:id`、`DELETE /tasks/:id`

## 请求/响应格式

### GET 列表
```
GET /api/tasks?year=2026&weekNumber=21
→ Task[]
```

### GET 单个
```
GET /api/tasks/1
→ Task
```

### POST 创建
```
POST /api/tasks
Body: CreateTaskDto
→ Task (201)
```

### PUT 更新
```
PUT /api/tasks/1
Body: UpdateTaskDto
→ Task
```

### DELETE 删除
```
DELETE /api/tasks/1
→ void (200)
```

## DTO 类型名称

| 用途 | 命名 |
|------|------|
| 创建 | `CreateXxxDto` |
| 更新 | `UpdateXxxDto`（全字段可选） |
| 查询 | `QueryXxxDto` |
| 特殊操作 | `CopyTaskDto`、`GenerateAnalysisDto` |

## 认证与鉴权

- 除公开接口外，所有接口需 `Authorization: Bearer <token>`
- 公开接口加 `@Public()` 装饰器
- 角色限制加 `@Roles(...)` 装饰器
- 当前用户信息通过 `@CurrentUser()` 注入

## 错误响应

- 400：参数校验失败（class-validator 自动返回）
- 401：未登录 / token 无效
- 403：无权限（`ForbiddenException`）
- 404：资源不存在（`NotFoundException`）
- 409：冲突（`ConflictException`，如重名、并发生成中）
- 所有错误消息用中文

## 流式接口（SSE）

```
POST /api/ai-analysis/generate-stream
Response:
  Content-Type: text/event-stream
  Cache-Control: no-cache
  Connection: keep-alive

Body: 原始流式文本（非标准 SSE data: 格式）
错误: __ERROR__: { ... }
```

## 前后端类型同步

- 前端 `FE/src/types/` 的类型定义应与后端 DTO 保持一致
- Entity 接口、枚举值必须同步
- 修改后端 DTO 后**务必同步更新前端类型文件**
