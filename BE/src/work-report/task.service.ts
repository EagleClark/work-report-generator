import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto, UpdateTaskDto, QueryTaskDto } from './dto/task.dto';
import { CopyTaskDto, CopyTaskResultDto, CopyMode } from './dto/copy-task.dto';
import { User, UserRole } from '../auth/entities/user.entity';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
  ) {}

  async create(createDto: CreateTaskDto, currentUser: User): Promise<Task> {
    // 为任务关联用户ID
    if (!createDto.userId && currentUser) {
      createDto.userId = currentUser.id.toString();
    }
    // 自动填充负责人为当前用户名（普通用户不可修改）
    if (!createDto.assignee && currentUser) {
      createDto.assignee = currentUser.username;
    }
    const task = this.taskRepository.create(createDto);
    return this.taskRepository.save(task);
  }

  async findAll(query: QueryTaskDto, currentUser?: User): Promise<Task[]> {
    const where: any = {};

    // 所有登录用户都可以查看所有任务
    // 权限控制只在编辑/删除时生效

    if (query.year) where.year = query.year;
    if (query.weekNumber) where.weekNumber = query.weekNumber;
    if (query.project) where.project = query.project;

    return this.taskRepository.find({
      where,
      order: { year: 'DESC', weekNumber: 'DESC', id: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Task> {
    const task = await this.taskRepository.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return task;
  }

  async update(id: number, updateDto: UpdateTaskDto, currentUser: User): Promise<Task> {
    const task = await this.findOne(id);

    // 权限检查：普通用户只能修改自己的任务（检查 userId 或 assignee）
    if (currentUser.role === UserRole.USER) {
      const userIdMatch = task.userId && String(task.userId) === String(currentUser.id);
      const assigneeMatch = task.assignee === currentUser.username;
      if (!userIdMatch && !assigneeMatch) {
        throw new ForbiddenException('你只能修改自己的任务');
      }
    }

    Object.assign(task, updateDto);
    return this.taskRepository.save(task);
  }

  async remove(id: number, currentUser: User): Promise<void> {
    const task = await this.findOne(id);

    // 权限检查：普通用户只能删除自己的任务（检查 userId 或 assignee）
    if (currentUser.role === UserRole.USER) {
      const userIdMatch = task.userId && String(task.userId) === String(currentUser.id);
      const assigneeMatch = task.assignee === currentUser.username;
      if (!userIdMatch && !assigneeMatch) {
        throw new ForbiddenException('你只能删除自己的任务');
      }
    }

    await this.taskRepository.remove(task);
  }

  async getWeeklySummary(year: number, weekNumber: number): Promise<any> {
    const tasks = await this.taskRepository.find({
      where: { year, weekNumber },
      order: { id: 'ASC' },
    });

    const summary = {
      totalTasks: tasks.length,
      totalEstimatedWorkload: 0,
      totalActualWorkload: 0,
      totalWeeklyWorkload: 0,
      totalPlannedWeeklyWorkload: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      notStartedTasks: 0,
      tasks,
    };

    tasks.forEach((task) => {
      summary.totalEstimatedWorkload += task.estimatedWorkload || 0;
      summary.totalActualWorkload += task.actualWorkload || 0;
      summary.totalWeeklyWorkload += task.weeklyWorkload || 0;
      summary.totalPlannedWeeklyWorkload += task.plannedWeeklyWorkload || 0;

      if (task.progress === 100) {
        summary.completedTasks++;
      } else if (task.progress > 0) {
        summary.inProgressTasks++;
      } else {
        summary.notStartedTasks++;
      }
    });

    return summary;
  }

  async copyIncompleteTasks(dto: CopyTaskDto, currentUser: User): Promise<CopyTaskResultDto> {
    const { year, weekNumber, copyMode, userId: targetUserId } = dto;

    // 计算上周
    const sourceWeek = this.calculatePreviousWeek(year, weekNumber);
    const targetWeek = { year, weekNumber };

    // 确定要复制哪些用户的任务
    let sourceUserId: string | undefined;
    let useOrCondition = false; // 标记是否使用 OR 条件（管理员 SELF 模式）

    if (copyMode === CopyMode.SPECIFIC_USER) {
      if (!targetUserId) {
        throw new BadRequestException('SPECIFIC_USER 模式需要指定 userId');
      }
      if (currentUser.role === UserRole.USER) {
        throw new ForbiddenException('只有管理员可以复制其他用户的任务');
      }
      sourceUserId = targetUserId.toString();
    } else if (copyMode === CopyMode.ALL) {
      if (currentUser.role === UserRole.USER) {
        throw new ForbiddenException('只有管理员可以复制所有任务');
      }
      // ALL 模式不过滤 userId
    } else {
      // SELF 模式（默认）
      // 管理员复制自己的任务时，需要同时检查 userId 和 assignee
      if (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SUPER_ADMIN) {
        useOrCondition = true;
      } else {
        // 普通用户：只查询 userId 匹配的任务
        sourceUserId = currentUser.id.toString();
      }
    }

    // 查找上周未完成的任务（进度 < 100）
    let sourceTasks: Task[];

    if (useOrCondition) {
      // 管理员 SELF 模式：同时检查 userId 和 assignee
      const qb = this.taskRepository.createQueryBuilder('task');
      sourceTasks = await qb
        .where('task.year = :year', { year: sourceWeek.year })
        .andWhere('task.weekNumber = :weekNumber', { weekNumber: sourceWeek.weekNumber })
        .andWhere('task.progress < :progress', { progress: 100 })
        .andWhere('(task.userId = :userId OR task.assignee = :assignee)', {
          userId: currentUser.id.toString(),
          assignee: currentUser.username,
        })
        .getMany();
    } else {
      const where: any = {
        year: sourceWeek.year,
        weekNumber: sourceWeek.weekNumber,
        progress: LessThan(100),
      };

      if (sourceUserId) {
        where.userId = sourceUserId;
      }

      sourceTasks = await this.taskRepository.find({ where });
    }

    if (sourceTasks.length === 0) {
      return {
        copiedCount: 0,
        skippedCount: 0,
        skippedTasks: [],
      };
    }

    // 查询目标周的任务，用于重复检测
    const targetTasks = await this.taskRepository.find({
      where: {
        year: targetWeek.year,
        weekNumber: targetWeek.weekNumber,
      },
    });

    // 创建任务签名集合用于重复检测
    const targetTaskSignatures = new Set(
      targetTasks.map((task) => this.createTaskSignature(task)),
    );

    const copiedTasks: Task[] = [];
    const skippedTasks: Array<{ task: string; reason: string }> = [];

    for (const sourceTask of sourceTasks) {
      const signature = this.createTaskSignature(sourceTask);

      if (targetTaskSignatures.has(signature)) {
        // 发现重复 - 跳过
        skippedTasks.push({
          task: `${sourceTask.project} - ${sourceTask.taskDetail.substring(0, 30)}...`,
          reason: '已存在相同任务',
        });
        continue;
      }

      // 创建新任务，仅 weeklyWorkload 重置为 0，其他字段继承
      const newTask = this.taskRepository.create({
        project: sourceTask.project,
        usDts: sourceTask.usDts,
        usDtsLink: sourceTask.usDtsLink,
        taskDetail: sourceTask.taskDetail,
        progress: sourceTask.progress, // 继承原进度
        estimatedWorkload: sourceTask.estimatedWorkload,
        plannedStartDate: sourceTask.plannedStartDate, // 继承计划时间
        plannedEndDate: sourceTask.plannedEndDate,
        actualWorkload: sourceTask.actualWorkload,
        weeklyWorkload: 0, // 重置为 0
        plannedWeeklyWorkload: 0, // 重置为 0
        actualStartDate: sourceTask.actualStartDate, // 继承实际时间
        actualEndDate: sourceTask.actualEndDate,
        assignee: sourceTask.assignee,
        userId: sourceTask.userId,
        weekNumber: targetWeek.weekNumber,
        year: targetWeek.year,
        remark: sourceTask.remark, // 继承备注，不添加前缀
      });

      const savedTask = await this.taskRepository.save(newTask);
      copiedTasks.push(savedTask);
    }

    return {
      copiedCount: copiedTasks.length,
      skippedCount: skippedTasks.length,
      skippedTasks,
    };
  }

  private createTaskSignature(task: Task): string {
    // 创建唯一签名：userId + project + taskDetail + assignee
    return `${task.userId}-${task.project}-${task.taskDetail}-${task.assignee}`;
  }

  private calculatePreviousWeek(year: number, weekNumber: number): { year: number; weekNumber: number } {
    if (weekNumber === 1) {
      return { year: year - 1, weekNumber: 52 };
    }
    return { year, weekNumber: weekNumber - 1 };
  }
}