import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LessThan } from 'typeorm';
import { TaskService } from './task.service';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/task.dto';
import { CopyMode } from './dto/copy-task.dto';
import { User, UserRole } from '../auth/entities/user.entity';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

describe('TaskService', () => {
  let service: TaskService;
  let repo: Record<string, jest.Mock>;

  const mockUser: User = {
    id: 1,
    username: 'testuser',
    password: 'hashed',
    role: UserRole.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
    tasks: [],
  };

  const mockAdmin: User = {
    id: 2,
    username: 'admin',
    password: 'hashed',
    role: UserRole.ADMIN,
    createdAt: new Date(),
    updatedAt: new Date(),
    tasks: [],
  };

  const createMockTask = (overrides: Partial<Task> = {}): Task => ({
    id: 1,
    project: 'ProjectA',
    usDts: null,
    usDtsLink: null,
    taskDetail: 'Implement feature X',
    progress: 50,
    estimatedWorkload: 10,
    actualWorkload: 5,
    weeklyWorkload: 3,
    plannedWeeklyWorkload: 5,
    plannedStartDate: null,
    plannedEndDate: null,
    actualStartDate: null,
    actualEndDate: null,
    assignee: 'testuser',
    remark: null,
    weekNumber: 20,
    year: 2026,
    userId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: null,
    ...overrides,
  });

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        { provide: getRepositoryToken(Task), useValue: mockRepository },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
    repo = module.get(getRepositoryToken(Task));
  });

  describe('create', () => {
    it('should fill userId and assignee from currentUser when not provided in DTO', async () => {
      const createDto: CreateTaskDto = {
        project: 'ProjectA',
        taskDetail: 'Detail',
        weekNumber: 20,
        year: 2026,
        plannedWeeklyWorkload: 5,
      };
      const task = createMockTask({ progress: 0, estimatedWorkload: 0, actualWorkload: 0, weeklyWorkload: 0 });
      repo.create.mockReturnValue(task);
      repo.save.mockResolvedValue(task);

      const result = await service.create(createDto, mockUser);

      expect(createDto.userId).toBe(1);
      expect(createDto.assignee).toBe('testuser');
      expect(repo.create).toHaveBeenCalledWith(createDto);
      expect(repo.save).toHaveBeenCalledWith(task);
      expect(result).toEqual(task);
    });

    it('should not override userId and assignee when already provided in DTO', async () => {
      const createDto: CreateTaskDto = {
        project: 'ProjectB',
        taskDetail: 'Detail',
        weekNumber: 20,
        year: 2026,
        plannedWeeklyWorkload: 5,
        userId: 999,
        assignee: 'existing-user',
      };
      const task = createMockTask({
        project: 'ProjectB',
        userId: 999,
        assignee: 'existing-user',
        progress: 0,
        estimatedWorkload: 0,
        actualWorkload: 0,
        weeklyWorkload: 0,
      });
      repo.create.mockReturnValue(task);
      repo.save.mockResolvedValue(task);

      const result = await service.create(createDto, mockUser);

      expect(createDto.userId).toBe(999);
      expect(createDto.assignee).toBe('existing-user');
      expect(repo.save).toHaveBeenCalledWith(task);
      expect(result).toEqual(task);
    });
  });

  describe('findAll', () => {
    it('should return all tasks without filters', async () => {
      const tasks = [createMockTask()];
      repo.find.mockResolvedValue(tasks);

      const result = await service.findAll({}, mockUser);

      expect(repo.find).toHaveBeenCalledWith({
        where: {},
        order: { year: 'DESC', weekNumber: 'DESC', id: 'DESC' },
      });
      expect(result).toEqual(tasks);
    });

    it('should filter by year, weekNumber, and project', async () => {
      const tasks = [createMockTask()];
      repo.find.mockResolvedValue(tasks);

      const result = await service.findAll(
        { year: 2026, weekNumber: 20, project: 'ProjectA' },
        mockUser,
      );

      expect(repo.find).toHaveBeenCalledWith({
        where: { year: 2026, weekNumber: 20, project: 'ProjectA' },
        order: { year: 'DESC', weekNumber: 'DESC', id: 'DESC' },
      });
      expect(result).toEqual(tasks);
    });
  });

  describe('findOne', () => {
    it('should return a task by id when found', async () => {
      const task = createMockTask();
      repo.findOne.mockResolvedValue(task);

      const result = await service.findOne(1);

      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(task);
    });

    it('should throw NotFoundException when task does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 999 } });
    });
  });

  describe('update', () => {
    it('should allow admin to update any task', async () => {
      const task = createMockTask({ userId: 999, assignee: 'other-user' });
      repo.findOne.mockResolvedValue(task);
      const updated = { ...task, progress: 100 };
      repo.save.mockResolvedValue(updated);

      const result = await service.update(1, { progress: 100 }, mockAdmin);

      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(repo.save).toHaveBeenCalled();
      expect(result.progress).toBe(100);
    });

    it('should allow USER to update own task by userId match', async () => {
      const task = createMockTask({ userId: 1, assignee: 'testuser' });
      repo.findOne.mockResolvedValue(task);
      const updated = { ...task, progress: 80 };
      repo.save.mockResolvedValue(updated);

      const result = await service.update(1, { progress: 80 }, mockUser);

      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ progress: 80 }));
      expect(result.progress).toBe(80);
    });

    it('should allow USER to update own task by assignee match when userId is null', async () => {
      const task = createMockTask({ userId: null, assignee: 'testuser' });
      repo.findOne.mockResolvedValue(task);
      const updated = { ...task, progress: 80 };
      repo.save.mockResolvedValue(updated);

      const result = await service.update(1, { progress: 80 }, mockUser);

      expect(repo.save).toHaveBeenCalled();
      expect(result.progress).toBe(80);
    });

    it('should throw ForbiddenException when USER tries to update another user\'s task', async () => {
      const task = createMockTask({ userId: 2, assignee: 'other-user' });
      repo.findOne.mockResolvedValue(task);

      await expect(service.update(1, { progress: 80 }, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.update(1, { progress: 80 }, mockUser)).rejects.toThrow(
        '你只能修改自己的任务',
      );
    });
  });

  describe('remove', () => {
    it('should allow admin to delete any task', async () => {
      const task = createMockTask({ userId: 999, assignee: 'other-user' });
      repo.findOne.mockResolvedValue(task);
      repo.remove.mockResolvedValue(task);

      await service.remove(1, mockAdmin);

      expect(repo.remove).toHaveBeenCalledWith(task);
    });

    it('should allow USER to delete own task', async () => {
      const task = createMockTask({ userId: 1, assignee: 'testuser' });
      repo.findOne.mockResolvedValue(task);
      repo.remove.mockResolvedValue(task);

      await service.remove(1, mockUser);

      expect(repo.remove).toHaveBeenCalledWith(task);
    });

    it('should throw ForbiddenException when USER tries to delete another user\'s task', async () => {
      const task = createMockTask({ userId: 2, assignee: 'other-user' });
      repo.findOne.mockResolvedValue(task);

      await expect(service.remove(1, mockUser)).rejects.toThrow(ForbiddenException);
      await expect(service.remove(1, mockUser)).rejects.toThrow('你只能删除自己的任务');
    });
  });

  describe('getWeeklySummary', () => {
    it('should return correct statistics for the given week', async () => {
      const tasks = [
        createMockTask({
          id: 1,
          progress: 100,
          estimatedWorkload: 10,
          actualWorkload: 8,
          weeklyWorkload: 5,
          plannedWeeklyWorkload: 5,
        }),
        createMockTask({
          id: 2,
          progress: 50,
          estimatedWorkload: 5,
          actualWorkload: 3,
          weeklyWorkload: 2,
          plannedWeeklyWorkload: 4,
        }),
        createMockTask({
          id: 3,
          progress: 0,
          estimatedWorkload: 3,
          actualWorkload: 0,
          weeklyWorkload: 0,
          plannedWeeklyWorkload: 2,
        }),
      ];
      repo.find.mockResolvedValue(tasks);

      const result = await service.getWeeklySummary(2026, 20);

      expect(repo.find).toHaveBeenCalledWith({
        where: { year: 2026, weekNumber: 20 },
        order: { id: 'ASC' },
      });
      expect(result.totalTasks).toBe(3);
      expect(result.totalEstimatedWorkload).toBe(18);
      expect(result.totalActualWorkload).toBe(11);
      expect(result.totalWeeklyWorkload).toBe(7);
      expect(result.totalPlannedWeeklyWorkload).toBe(11);
      expect(result.completedTasks).toBe(1);
      expect(result.inProgressTasks).toBe(1);
      expect(result.notStartedTasks).toBe(1);
      expect(result.tasks).toEqual(tasks);
    });
  });

  describe('copyIncompleteTasks', () => {
    it('should copy own incomplete tasks in SELF mode for regular user', async () => {
      const sourceTask = createMockTask({ id: 2, progress: 50, weekNumber: 19 });
      const newTask = createMockTask({ id: 3, weekNumber: 20, year: 2026 });
      repo.find.mockResolvedValueOnce([sourceTask]);
      repo.find.mockResolvedValueOnce([]);
      repo.create.mockReturnValue(newTask);
      repo.save.mockResolvedValue(newTask);

      const result = await service.copyIncompleteTasks(
        { year: 2026, weekNumber: 20, copyMode: CopyMode.SELF },
        mockUser,
      );

      expect(repo.find).toHaveBeenNthCalledWith(1, {
        where: { year: 2026, weekNumber: 19, progress: LessThan(100), userId: 1 },
      });
      expect(repo.find).toHaveBeenNthCalledWith(2, {
        where: { year: 2026, weekNumber: 20 },
      });
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          year: 2026,
          weekNumber: 20,
          weeklyWorkload: 0,
          plannedWeeklyWorkload: 0,
        }),
      );
      expect(result.copiedCount).toBe(1);
      expect(result.skippedCount).toBe(0);
      expect(result.skippedTasks).toEqual([]);
    });

    it('should use OR condition in SELF mode for admin', async () => {
      const sourceTask = createMockTask({ id: 2, progress: 50, weekNumber: 19, userId: 5, assignee: 'someone' });
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([sourceTask]),
      };
      repo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      repo.find.mockResolvedValue([]);
      const newTask = createMockTask({ id: 3, weekNumber: 20 });
      repo.create.mockReturnValue(newTask);
      repo.save.mockResolvedValue(newTask);

      const result = await service.copyIncompleteTasks(
        { year: 2026, weekNumber: 20, copyMode: CopyMode.SELF },
        mockAdmin,
      );

      expect(repo.createQueryBuilder).toHaveBeenCalledWith('task');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('task.year = :year', {
        year: 2026,
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(3);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'task.weekNumber = :weekNumber',
        { weekNumber: 19 },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'task.progress < :progress',
        { progress: 100 },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(task.userId = :userId OR task.assignee = :assignee)',
        { userId: mockAdmin.id, assignee: mockAdmin.username },
      );
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
      expect(result.copiedCount).toBe(1);
    });

    it('should default to SELF mode when copyMode is not provided', async () => {
      repo.find.mockResolvedValue([]);

      await service.copyIncompleteTasks(
        { year: 2026, weekNumber: 20 } as any,
        mockUser,
      );

      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 1 }),
        }),
      );
    });

    it('should throw ForbiddenException for USER in ALL mode', async () => {
      await expect(
        service.copyIncompleteTasks(
          { year: 2026, weekNumber: 20, copyMode: CopyMode.ALL },
          mockUser,
        ),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.copyIncompleteTasks(
          { year: 2026, weekNumber: 20, copyMode: CopyMode.ALL },
          mockUser,
        ),
      ).rejects.toThrow('只有管理员可以复制所有任务');
    });

    it('should copy specific user tasks in SPECIFIC_USER mode for admin', async () => {
      const sourceTask = createMockTask({
        id: 2,
        userId: 5,
        assignee: 'other',
        progress: 50,
        weekNumber: 19,
      });
      const newTask = createMockTask({
        id: 3,
        userId: 5,
        assignee: 'other',
        weekNumber: 20,
      });
      repo.find.mockResolvedValueOnce([sourceTask]);
      repo.find.mockResolvedValueOnce([]);
      repo.create.mockReturnValue(newTask);
      repo.save.mockResolvedValue(newTask);

      const result = await service.copyIncompleteTasks(
        { year: 2026, weekNumber: 20, copyMode: CopyMode.SPECIFIC_USER, userId: 5 },
        mockAdmin,
      );

      expect(repo.find).toHaveBeenNthCalledWith(1, {
        where: { year: 2026, weekNumber: 19, progress: LessThan(100), userId: 5 },
      });
      expect(result.copiedCount).toBe(1);
      expect(result.skippedCount).toBe(0);
    });

    it('should throw BadRequestException for SPECIFIC_USER mode without userId', async () => {
      await expect(
        service.copyIncompleteTasks(
          { year: 2026, weekNumber: 20, copyMode: CopyMode.SPECIFIC_USER },
          mockAdmin,
        ),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.copyIncompleteTasks(
          { year: 2026, weekNumber: 20, copyMode: CopyMode.SPECIFIC_USER },
          mockAdmin,
        ),
      ).rejects.toThrow('SPECIFIC_USER 模式需要指定 userId');
    });

    it('should throw ForbiddenException for USER in SPECIFIC_USER mode', async () => {
      await expect(
        service.copyIncompleteTasks(
          { year: 2026, weekNumber: 20, copyMode: CopyMode.SPECIFIC_USER, userId: 5 },
          mockUser,
        ),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.copyIncompleteTasks(
          { year: 2026, weekNumber: 20, copyMode: CopyMode.SPECIFIC_USER, userId: 5 },
          mockUser,
        ),
      ).rejects.toThrow('只有管理员可以复制其他用户的任务');
    });

    it('should return zero counts when no source tasks found', async () => {
      repo.find.mockResolvedValue([]);

      const result = await service.copyIncompleteTasks(
        { year: 2026, weekNumber: 20, copyMode: CopyMode.SELF },
        mockUser,
      );

      expect(result).toEqual({ copiedCount: 0, skippedCount: 0, skippedTasks: [] });
    });

    it('should skip duplicate tasks that already exist in target week', async () => {
      const sourceTask = createMockTask({ id: 2, progress: 50, weekNumber: 19 });
      const existingTargetTask = createMockTask({
        id: 3,
        weekNumber: 20,
        year: 2026,
      });
      repo.find.mockResolvedValueOnce([sourceTask]);
      repo.find.mockResolvedValueOnce([existingTargetTask]);

      const result = await service.copyIncompleteTasks(
        { year: 2026, weekNumber: 20, copyMode: CopyMode.SELF },
        mockUser,
      );

      expect(result.copiedCount).toBe(0);
      expect(result.skippedCount).toBe(1);
      expect(result.skippedTasks).toHaveLength(1);
      expect(result.skippedTasks[0].reason).toBe('已存在相同任务');
      expect(result.skippedTasks[0].task).toContain('ProjectA');
    });

    it('should handle cross-year previous week calculation for week 1', async () => {
      repo.find.mockResolvedValue([]);

      await service.copyIncompleteTasks(
        { year: 2026, weekNumber: 1, copyMode: CopyMode.SELF },
        mockUser,
      );

      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            year: 2025,
            weekNumber: 52,
            userId: 1,
          }),
        }),
      );
    });
  });
});
