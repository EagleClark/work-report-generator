import { Test, TestingModule } from '@nestjs/testing';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import { CopyTaskDto } from './dto/copy-task.dto';
import { User, UserRole } from '../auth/entities/user.entity';

describe('TaskController', () => {
  let controller: TaskController;
  let service: Record<string, jest.Mock>;

  const mockUser: User = {
    id: 1,
    username: 'testuser',
    password: 'hashed',
    role: UserRole.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
    tasks: [],
  };

  const mockTaskService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getWeeklySummary: jest.fn(),
    copyIncompleteTasks: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskController],
      providers: [{ provide: TaskService, useValue: mockTaskService }],
    }).compile();

    controller = module.get<TaskController>(TaskController);
    service = module.get(TaskService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should delegate to taskService.create', async () => {
      const dto: CreateTaskDto = {
        project: 'ProjectA',
        taskDetail: 'Detail',
        weekNumber: 20,
        year: 2026,
        plannedWeeklyWorkload: 5,
      };
      const task = { id: 1, ...dto, userId: 1, assignee: 'testuser' };
      mockTaskService.create.mockResolvedValue(task);

      const result = await controller.create(dto, mockUser);

      expect(mockTaskService.create).toHaveBeenCalledWith(dto, mockUser);
      expect(result).toEqual(task);
    });
  });

  describe('findAll', () => {
    it('should delegate to taskService.findAll with parsed query params', async () => {
      const tasks = [{ id: 1, project: 'ProjectA' }];
      mockTaskService.findAll.mockResolvedValue(tasks);

      const result = await controller.findAll('2026', '20', 'ProjectA', mockUser);

      expect(mockTaskService.findAll).toHaveBeenCalledWith(
        { year: 2026, weekNumber: 20, project: 'ProjectA' },
        mockUser,
      );
      expect(result).toEqual(tasks);
    });

    it('should handle undefined query params', async () => {
      const tasks = [{ id: 1 }];
      mockTaskService.findAll.mockResolvedValue(tasks);

      const result = await controller.findAll(undefined, undefined, undefined, mockUser);

      expect(mockTaskService.findAll).toHaveBeenCalledWith({}, mockUser);
      expect(result).toEqual(tasks);
    });
  });

  describe('getWeeklySummary', () => {
    it('should delegate to taskService.getWeeklySummary with parsed numbers', async () => {
      const summary = {
        totalTasks: 3,
        completedTasks: 1,
        inProgressTasks: 1,
        notStartedTasks: 1,
        tasks: [],
      };
      mockTaskService.getWeeklySummary.mockResolvedValue(summary);

      const result = await controller.getWeeklySummary('2026', '20');

      expect(mockTaskService.getWeeklySummary).toHaveBeenCalledWith(2026, 20);
      expect(result).toEqual(summary);
    });
  });

  describe('copyTasks', () => {
    it('should delegate to taskService.copyIncompleteTasks', async () => {
      const dto: CopyTaskDto = { year: 2026, weekNumber: 20 };
      const copyResult = { copiedCount: 1, skippedCount: 0, skippedTasks: [] };
      mockTaskService.copyIncompleteTasks.mockResolvedValue(copyResult);

      const result = await controller.copyTasks(dto, mockUser);

      expect(mockTaskService.copyIncompleteTasks).toHaveBeenCalledWith(dto, mockUser);
      expect(result).toEqual(copyResult);
    });
  });

  describe('findOne', () => {
    it('should delegate to taskService.findOne with parsed number', async () => {
      const task = { id: 1, project: 'ProjectA' };
      mockTaskService.findOne.mockResolvedValue(task);

      const result = await controller.findOne('1');

      expect(mockTaskService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(task);
    });
  });

  describe('update', () => {
    it('should delegate to taskService.update with parsed id', async () => {
      const dto: UpdateTaskDto = { progress: 100 };
      const task = { id: 1, progress: 100 };
      mockTaskService.update.mockResolvedValue(task);

      const result = await controller.update('1', dto, mockUser);

      expect(mockTaskService.update).toHaveBeenCalledWith(1, dto, mockUser);
      expect(result).toEqual(task);
    });
  });

  describe('remove', () => {
    it('should delegate to taskService.remove with parsed id', async () => {
      mockTaskService.remove.mockResolvedValue(undefined);

      const result = await controller.remove('1', mockUser);

      expect(mockTaskService.remove).toHaveBeenCalledWith(1, mockUser);
      expect(result).toBeUndefined();
    });
  });
});
