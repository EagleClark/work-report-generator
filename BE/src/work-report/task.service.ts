import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto, UpdateTaskDto, QueryTaskDto } from './dto/task.dto';
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

    // 权限检查
    if (currentUser.role === UserRole.USER && task.userId !== currentUser.id.toString()) {
      throw new ForbiddenException('你只能修改自己的任务');
    }

    Object.assign(task, updateDto);
    return this.taskRepository.save(task);
  }

  async remove(id: number, currentUser: User): Promise<void> {
    const task = await this.findOne(id);

    // 权限检查
    if (currentUser.role === UserRole.USER && task.userId !== currentUser.id.toString()) {
      throw new ForbiddenException('你只能删除自己的任务');
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
      completedTasks: 0,
      inProgressTasks: 0,
      notStartedTasks: 0,
      tasks,
    };

    tasks.forEach((task) => {
      summary.totalEstimatedWorkload += task.estimatedWorkload || 0;
      summary.totalActualWorkload += task.actualWorkload || 0;
      summary.totalWeeklyWorkload += task.weeklyWorkload || 0;

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
}