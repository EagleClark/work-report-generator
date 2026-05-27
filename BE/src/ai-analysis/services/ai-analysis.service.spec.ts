import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AIAnalysisService } from './ai-analysis.service';
import { AIAnalysis } from '../entities/ai-analysis.entity';
import { OpenAIProvider } from './openai.provider';
import { TaskService } from '../../work-report/task.service';
import { CreateAnalysisDto } from '../dto/create-analysis.dto';

describe('AIAnalysisService', () => {
  let service: AIAnalysisService;
  let repository: jest.Mocked<Repository<AIAnalysis>>;
  let openaiProvider: jest.Mocked<OpenAIProvider>;
  let taskService: jest.Mocked<TaskService>;

  const mockAnalysis: AIAnalysis = {
    id: 1,
    year: 2026,
    weekNumber: 22,
    analysisContent: '分析报告内容',
    userPrompt: '请分析',
    modelType: 'OPENAI',
    modelName: 'gpt-4o-mini',
    metadata: { tokenCount: 500, generationTime: 3.2 },
    createdAt: new Date('2026-05-27'),
    updatedAt: new Date('2026-05-27'),
  };

  const mockCreateDto: CreateAnalysisDto = {
    year: 2026,
    weekNumber: 22,
    userPrompt: '请分析',
  };

  const mockSummaryData = {
    totalTasks: 10,
    totalPlannedWeeklyWorkload: 40,
    totalWeeklyWorkload: 45,
    completedTasks: 5,
    inProgressTasks: 3,
    notStartedTasks: 2,
    assigneeStats: [
      { assignee: '张三', weeklyWorkload: 5, plannedWeeklyWorkload: 5 },
    ],
    tasks: [
      {
        assignee: '张三',
        project: '项目A',
        taskDetail: '开发任务',
        weeklyWorkload: 5,
        plannedWeeklyWorkload: 5,
        estimatedWorkload: 3,
        actualWorkload: 4,
        progress: 100,
        remark: '',
      },
      {
        assignee: '李四',
        project: '项目B',
        taskDetail: '测试任务',
        weeklyWorkload: 3,
        plannedWeeklyWorkload: 3,
        estimatedWorkload: 2,
        actualWorkload: 2,
        progress: 100,
        remark: '',
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AIAnalysisService,
        {
          provide: getRepositoryToken(AIAnalysis),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: OpenAIProvider,
          useValue: {
            analyze: jest.fn(),
            analyzeStream: jest.fn(),
            validateConfig: jest.fn(),
          },
        },
        {
          provide: TaskService,
          useValue: {
            getWeeklySummary: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AIAnalysisService>(AIAnalysisService);
    repository = module.get(getRepositoryToken(AIAnalysis));
    openaiProvider = module.get(OpenAIProvider);
    taskService = module.get(TaskService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getGeneratingStatus', () => {
    it('应该返回当前生成状态的副本', () => {
      const status = service.getGeneratingStatus();

      expect(status).toEqual({
        isGenerating: false,
        year: null,
        weekNumber: null,
        partialContent: '',
      });
    });

    it('返回的副本修改后不应影响内部状态', () => {
      const status = service.getGeneratingStatus();
      status.isGenerating = true;

      const statusAgain = service.getGeneratingStatus();
      expect(statusAgain.isGenerating).toBe(false);
    });
  });

  describe('findByYearAndWeek', () => {
    it('存在分析记录时应返回该记录', async () => {
      repository.findOne.mockResolvedValue(mockAnalysis);

      const result = await service.findByYearAndWeek(2026, 22);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { year: 2026, weekNumber: 22 },
      });
      expect(result).toEqual(mockAnalysis);
    });

    it('不存在分析记录时应返回 null', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.findByYearAndWeek(2026, 99);

      expect(result).toBeNull();
    });
  });

  describe('generateAnalysis', () => {
    it('已存在分析且不强制重新生成时应直接返回现有记录', async () => {
      repository.findOne.mockResolvedValue(mockAnalysis);

      const result = await service.generateAnalysis(mockCreateDto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { year: 2026, weekNumber: 22 },
      });
      expect(taskService.getWeeklySummary).not.toHaveBeenCalled();
      expect(openaiProvider.analyze).not.toHaveBeenCalled();
      expect(repository.create).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
      expect(result).toEqual(mockAnalysis);
    });

    it('不存在分析时应调用 AI 生成并保存新记录', async () => {
      repository.findOne.mockResolvedValue(null);
      taskService.getWeeklySummary.mockResolvedValue(mockSummaryData);
      openaiProvider.analyze.mockResolvedValue({
        content: 'AI生成的分析内容',
        metadata: { tokenCount: 500, generationTime: 3.2 },
      });
      repository.create.mockReturnValue(mockAnalysis);
      repository.save.mockResolvedValue(mockAnalysis);

      const result = await service.generateAnalysis(mockCreateDto);

      expect(taskService.getWeeklySummary).toHaveBeenCalledWith(2026, 22);
      expect(openaiProvider.analyze).toHaveBeenCalledWith({
        summaryData: {
          ...mockSummaryData,
          year: 2026,
          weekNumber: 22,
          assigneeCount: 2,
        },
        userPrompt: '请分析',
      });
      expect(repository.create).toHaveBeenCalledWith({
        year: 2026,
        weekNumber: 22,
        analysisContent: 'AI生成的分析内容',
        userPrompt: '请分析',
        modelType: 'OPENAI',
        modelName: 'gpt-4o-mini',
        metadata: { tokenCount: 500, generationTime: 3.2 },
      });
      expect(repository.save).toHaveBeenCalledWith(mockAnalysis);
      expect(result).toEqual(mockAnalysis);
    });

    it('存在分析且 forceRegenerate 为 true 时应删除旧记录并创建新记录', async () => {
      repository.findOne.mockResolvedValue(mockAnalysis);
      taskService.getWeeklySummary.mockResolvedValue(mockSummaryData);
      openaiProvider.analyze.mockResolvedValue({
        content: '重新生成的分析内容',
        metadata: { tokenCount: 600, generationTime: 4.0 },
      });
      const newAnalysis = { ...mockAnalysis, id: 2 };
      repository.create.mockReturnValue(newAnalysis);
      repository.save.mockResolvedValue(newAnalysis);

      const result = await service.generateAnalysis({
        ...mockCreateDto,
        forceRegenerate: 'true',
      });

      expect(repository.remove).toHaveBeenCalledWith(mockAnalysis);
      expect(openaiProvider.analyze).toHaveBeenCalled();
      expect(repository.create).toHaveBeenCalledWith({
        year: 2026,
        weekNumber: 22,
        analysisContent: '重新生成的分析内容',
        userPrompt: '请分析',
        modelType: 'OPENAI',
        modelName: 'gpt-4o-mini',
        metadata: { tokenCount: 600, generationTime: 4.0 },
      });
      expect(repository.save).toHaveBeenCalledWith(newAnalysis);
      expect(result).toEqual(newAnalysis);
    });

    it('assigneeCount 应根据任务中不重复的 assignee 计算', async () => {
      repository.findOne.mockResolvedValue(null);
      const summaryWithRepeatedAssignee = {
        ...mockSummaryData,
        tasks: [
          { assignee: '张三', project: '项目A', taskDetail: '任务1', weeklyWorkload: 3 },
          { assignee: '张三', project: '项目A', taskDetail: '任务2', weeklyWorkload: 4 },
          { assignee: '李四', project: '项目B', taskDetail: '任务3', weeklyWorkload: 5 },
          { assignee: null, project: '项目C', taskDetail: '任务4', weeklyWorkload: 2 },
        ],
      };
      taskService.getWeeklySummary.mockResolvedValue(summaryWithRepeatedAssignee);
      openaiProvider.analyze.mockResolvedValue({
        content: '内容',
        metadata: {},
      });
      repository.create.mockReturnValue(mockAnalysis);
      repository.save.mockResolvedValue(mockAnalysis);

      await service.generateAnalysis(mockCreateDto);

      expect(openaiProvider.analyze).toHaveBeenCalledWith(
        expect.objectContaining({
          summaryData: expect.objectContaining({
            assigneeCount: 2, // 张三、李四（null 被 filter 排除）
          }),
        }),
      );
    });

    it('AI 调用失败时应抛出错误', async () => {
      repository.findOne.mockResolvedValue(null);
      taskService.getWeeklySummary.mockResolvedValue(mockSummaryData);
      const apiError = new Error('API 调用失败');
      openaiProvider.analyze.mockRejectedValue(apiError);

      await expect(service.generateAnalysis(mockCreateDto)).rejects.toThrow(
        'API 调用失败',
      );

      expect(repository.create).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('空任务列表时 assigneeCount 应为 0', async () => {
      repository.findOne.mockResolvedValue(null);
      taskService.getWeeklySummary.mockResolvedValue({
        ...mockSummaryData,
        tasks: [],
      });
      openaiProvider.analyze.mockResolvedValue({
        content: '内容',
        metadata: {},
      });
      repository.create.mockReturnValue(mockAnalysis);
      repository.save.mockResolvedValue(mockAnalysis);

      await service.generateAnalysis(mockCreateDto);

      expect(openaiProvider.analyze).toHaveBeenCalledWith(
        expect.objectContaining({
          summaryData: expect.objectContaining({ assigneeCount: 0 }),
        }),
      );
    });
  });

  describe('findAll', () => {
    it('无条件查询时应返回所有记录并按 year、weekNumber、createdAt 降序排列', async () => {
      const analyses = [mockAnalysis];
      repository.find.mockResolvedValue(analyses);

      const result = await service.findAll({});

      expect(repository.find).toHaveBeenCalledWith({
        where: {},
        order: { year: 'DESC', weekNumber: 'DESC', createdAt: 'DESC' },
      });
      expect(result).toEqual(analyses);
    });

    it('应按 year 过滤', async () => {
      repository.find.mockResolvedValue([mockAnalysis]);

      const result = await service.findAll({ year: 2026 });

      expect(repository.find).toHaveBeenCalledWith({
        where: { year: 2026 },
        order: { year: 'DESC', weekNumber: 'DESC', createdAt: 'DESC' },
      });
      expect(result).toEqual([mockAnalysis]);
    });

    it('应按 weekNumber 过滤', async () => {
      repository.find.mockResolvedValue([mockAnalysis]);

      const result = await service.findAll({ weekNumber: 22 });

      expect(repository.find).toHaveBeenCalledWith({
        where: { weekNumber: 22 },
        order: { year: 'DESC', weekNumber: 'DESC', createdAt: 'DESC' },
      });
      expect(result).toEqual([mockAnalysis]);
    });

    it('没有记录时应返回空数组', async () => {
      repository.find.mockResolvedValue([]);

      const result = await service.findAll({});

      expect(result).toEqual([]);
    });
  });

  describe('delete', () => {
    it('存在分析记录时应删除成功', async () => {
      repository.findOne.mockResolvedValue(mockAnalysis);
      repository.remove.mockResolvedValue(mockAnalysis);

      await service.delete(1);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(repository.remove).toHaveBeenCalledWith(mockAnalysis);
    });

    it('不存在分析记录时应抛出 NotFoundException', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.delete(999)).rejects.toThrow(NotFoundException);
      await expect(service.delete(999)).rejects.toThrow(
        'Analysis with ID 999 not found',
      );

      expect(repository.remove).not.toHaveBeenCalled();
    });
  });

  describe('generateAnalysisStream', () => {
    const onChunk = jest.fn();

    beforeEach(() => {
      onChunk.mockClear();
    });

    it('应成功生成流式分析并保存结果', async () => {
      repository.findOne.mockResolvedValue(null);
      taskService.getWeeklySummary.mockResolvedValue(mockSummaryData);
      openaiProvider.analyzeStream.mockImplementation(
        async (_request, _onChunk) => {
          _onChunk('逐步');
          _onChunk('生成');
          _onChunk('内容');
          return {
            content: '逐步生成内容',
            metadata: { tokenCount: 125, generationTime: 5.0 },
          };
        },
      );
      repository.create.mockReturnValue(mockAnalysis);
      repository.save.mockResolvedValue(mockAnalysis);

      const result = await service.generateAnalysisStream(
        mockCreateDto,
        onChunk,
      );

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { year: 2026, weekNumber: 22 },
      });
      expect(taskService.getWeeklySummary).toHaveBeenCalledWith(2026, 22);
      expect(openaiProvider.analyzeStream).toHaveBeenCalledWith(
        {
          summaryData: {
            ...mockSummaryData,
            year: 2026,
            weekNumber: 22,
            assigneeCount: 2,
          },
          userPrompt: '请分析',
        },
        expect.any(Function),
      );
      expect(onChunk).toHaveBeenCalledTimes(3);
      expect(onChunk).toHaveBeenNthCalledWith(1, '逐步');
      expect(onChunk).toHaveBeenNthCalledWith(2, '生成');
      expect(onChunk).toHaveBeenNthCalledWith(3, '内容');
      expect(repository.create).toHaveBeenCalledWith({
        year: 2026,
        weekNumber: 22,
        analysisContent: '逐步生成内容',
        userPrompt: '请分析',
        modelType: 'OPENAI',
        modelName: 'gpt-4o-mini',
        metadata: { tokenCount: 125, generationTime: 5.0 },
      });
      expect(repository.save).toHaveBeenCalledWith(mockAnalysis);
      expect(result).toEqual(mockAnalysis);

      // 生成完成后应重置状态
      const status = service.getGeneratingStatus();
      expect(status.isGenerating).toBe(false);
      expect(status.partialContent).toBe('');
    });

    it('正在生成中时调用应抛出 ConflictException', async () => {
      // 先触发一次生成，但不等待完成，让状态保持为 generating
      repository.findOne.mockResolvedValue(null);
      taskService.getWeeklySummary.mockResolvedValue(mockSummaryData);
      // 返回一个永远不会 resolved 的 promise，模拟正在生成
      openaiProvider.analyzeStream.mockImplementation(
        () => new Promise(() => {}),
      );

      // 启动生成但不 await
      const generatePromise = service.generateAnalysisStream(
        mockCreateDto,
        jest.fn(),
      );

      // 等待状态变为 generating
      await new Promise(process.nextTick);

      // 再次调用应被拒绝
      await expect(
        service.generateAnalysisStream(mockCreateDto, jest.fn()),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.generateAnalysisStream(mockCreateDto, jest.fn()),
      ).rejects.toThrow('正在生成分析中，请稍后再试');

      // 清理：确保初始的生成 promise 解决
      // 注意：由于我们无法 resolve 那个 promise，测试结束后通过 gc 处理
      // 这里不 await generatePromise，因为它在等待一个永不 resolve 的 promise
    });

    it('已存在分析记录时应先删除再生成', async () => {
      const existingAnalysis = { ...mockAnalysis, id: 1 };
      repository.findOne.mockResolvedValue(existingAnalysis);
      taskService.getWeeklySummary.mockResolvedValue(mockSummaryData);
      openaiProvider.analyzeStream.mockResolvedValue({
        content: '新内容',
        metadata: {},
      });
      repository.create.mockReturnValue(mockAnalysis);
      repository.save.mockResolvedValue(mockAnalysis);

      await service.generateAnalysisStream(mockCreateDto, onChunk);

      expect(repository.remove).toHaveBeenCalledWith(existingAnalysis);
      expect(openaiProvider.analyzeStream).toHaveBeenCalled();
    });

    it('生成过程中出错应重置生成状态并抛出错误', async () => {
      repository.findOne.mockResolvedValue(null);
      taskService.getWeeklySummary.mockResolvedValue(mockSummaryData);
      const streamError = new Error('流式生成失败');
      openaiProvider.analyzeStream.mockRejectedValue(streamError);

      await expect(
        service.generateAnalysisStream(mockCreateDto, onChunk),
      ).rejects.toThrow('流式生成失败');

      // 错误后应重置生成状态
      const status = service.getGeneratingStatus();
      expect(status.isGenerating).toBe(false);
      expect(status.partialContent).toBe('');
    });

    it('partialContent 应在流式生成过程中逐步累积', async () => {
      repository.findOne.mockResolvedValue(null);
      taskService.getWeeklySummary.mockResolvedValue(mockSummaryData);
      openaiProvider.analyzeStream.mockImplementation(
        async (_request, _onChunk) => {
          _onChunk('第一段');
          _onChunk('第二段');
          return { content: '第一段第二段', metadata: {} };
        },
      );
      repository.create.mockReturnValue(mockAnalysis);
      repository.save.mockResolvedValue(mockAnalysis);

      const capturedChunks: string[] = [];
      await service.generateAnalysisStream(mockCreateDto, (chunk) => {
        capturedChunks.push(chunk);
      });

      expect(capturedChunks).toEqual(['第一段', '第二段']);
    });
  });
});
