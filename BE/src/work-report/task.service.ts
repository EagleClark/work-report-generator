import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto, UpdateTaskDto, QueryTaskDto } from './dto/task.dto';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
  ) {}

  async create(createDto: CreateTaskDto): Promise<Task> {
    const task = this.taskRepository.create(createDto);
    return this.taskRepository.save(task);
  }

  async findAll(query: QueryTaskDto): Promise<Task[]> {
    const where: any = {};
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

  async update(id: number, updateDto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(id);
    Object.assign(task, updateDto);
    return this.taskRepository.save(task);
  }

  async remove(id: number): Promise<void> {
    const task = await this.findOne(id);
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
