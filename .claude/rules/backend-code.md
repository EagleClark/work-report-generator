---
paths: 
  - "BE/"
---

# 后端代码规范（本项目专属）

## 文件组织

每个功能模块遵循统一目录结构：
```
feature-name/
  feature-name.module.ts
  feature-name.controller.ts    # 或 controllers/ 子目录（复杂模块）
  feature-name.service.ts       # 或 services/ 子目录
  dto/                          # class-validator 装饰的 DTO
  entities/                     # TypeORM 实体
```

## 命名规范

| 类别 | 规范 | 示例 |
|------|------|------|
| Controller 类 | `PascalCase` + Controller | `TasksController` |
| Service 类 | `PascalCase` + Service | `TasksService` |
| Entity 类 | `PascalCase` | `Task` |
| Entity 表名 | snake_case 复数 | `@Entity('tasks')` |
| DTO 类 | `Create/Update/Query` + 实体名 + `Dto` | `CreateTaskDto` |
| Module 文件 | `kebab-case.module.ts` | `work-report.module.ts` |
| Enum | `PascalCase`，值用 `UPPER_SNAKE_CASE` | `UserRole.SUPER_ADMIN` |

## Controller 规范

- 路由前缀用**小写复数**：`@Controller('tasks')`
- 构造器注入一律 `private readonly`：
  ```typescript
  constructor(private readonly tasksService: TasksService) {}
  ```
- ID 参数用 `@Param('id', ParseIntPipe) id: number`（自动转 number，不要手动 `+id`）
- 类级别挂 `@UseGuards(JwtAuthGuard, RolesGuard)`，公开接口用 `@Public()` 豁免
- 角色限制用 `@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)`
- Controller 直接 `return this.xxxService.method()`，让 NestJS 做序列化

## Service 规范

- Repository 注入：`@InjectRepository(Entity) private repo: Repository<Entity>`
- 创建：`this.repo.create(dto)` → `this.repo.save(entity)`
- 更新：`Object.assign(entity, dto)` → `this.repo.save(entity)`
- 删除前先 find，找不到抛 `NotFoundException`
- 唯一性冲突抛 `ConflictException`，错误消息用中文
- 权限检查在 Service 层做（接收 `currentUser: User` 参数）
- 返回用户对象前必须 `const { password, ...result } = user; return result;`

## DTO 规范

- 全部字段用 class-validator 装饰：`@IsNotEmpty()`、`@IsString()`、`@IsOptional()` 等
- 验证错误消息用中文：`@IsNotEmpty({ message: '项目名称不能为空' })`
- Create DTO 字段必填（不加 `?`），Update DTO 全字段可选（加 `?` + `@IsOptional()`）
- 同一模块的多个 DTO 可以放一个文件，也可以分开放——但别混用两种风格

## 错误处理

- 统一用 NestJS 内置异常：`NotFoundException`、`ConflictException`、`ForbiddenException`
- 错误消息用中文
- Service 内用 `private readonly logger = new Logger(XxxService.name)` 记录错误

## AI SSE 流式

- Controller 注入 `@Res() res: Response`，手动设置 SSE header
- Service 通过 callback 写 chunk：`(chunk) => res.write(chunk)`
- 流前检查 `isGenerating` 状态防并发
- 结束后必须 `res.end()`
- 错误写入结构 `__ERROR__: {...}` 后再 `res.end()`
