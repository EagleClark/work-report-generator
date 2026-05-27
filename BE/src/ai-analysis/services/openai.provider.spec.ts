import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { OpenAIProvider, AIAnalysisRequest } from './openai.provider';

// Mock the openai module
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    })),
  };
});

import OpenAI from 'openai';

describe('OpenAIProvider', () => {
  let provider: OpenAIProvider;
  let configService: jest.Mocked<ConfigService>;
  let mockOpenAIInstance: { chat: { completions: { create: jest.Mock } } };

  const mockRequest: AIAnalysisRequest = {
    summaryData: {
      year: 2026,
      weekNumber: 22,
      totalTasks: 10,
      totalWeeklyWorkload: 45,
      totalPlannedWeeklyWorkload: 40,
      completedTasks: 5,
      inProgressTasks: 3,
      notStartedTasks: 2,
      assigneeCount: 2,
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
      ],
    },
    userPrompt: '请分析本周工作情况',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenAIProvider,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    provider = module.get<OpenAIProvider>(OpenAIProvider);
    configService = module.get(ConfigService);

    // Get the mock OpenAI instance created in constructor
    const OpenAIMock = (OpenAI as unknown as jest.Mock);
    mockOpenAIInstance = OpenAIMock.mock.results[0]?.value;
    if (!mockOpenAIInstance) {
      // If constructor was already called, get the last instance
      const lastResult = OpenAIMock.mock.results[OpenAIMock.mock.results.length - 1];
      mockOpenAIInstance = lastResult?.value;
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('配置了 API KEY 时应创建 OpenAI 客户端', () => {
      jest.clearAllMocks();
      configService.get.mockImplementation((key: string) => {
        if (key === 'AI_API_KEY') return 'sk-test-key';
        if (key === 'AI_BASE_URL') return 'https://api.openai.com/v1';
        if (key === 'AI_EXTRA_HEADERS') return '{"X-Custom-Header":"value"}';
        return undefined;
      });

      const warnSpy = jest.spyOn(Logger.prototype, 'warn');
      new OpenAIProvider(configService);

      expect(OpenAI).toHaveBeenCalledWith(
        expect.objectContaining({
          apiKey: 'sk-test-key',
          baseURL: 'https://api.openai.com/v1',
          defaultHeaders: { 'X-Custom-Header': 'value' },
        }),
      );
      expect(warnSpy).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('未配置 API KEY 时应发出警告', () => {
      jest.clearAllMocks();
      configService.get.mockImplementation((key: string) => {
        if (key === 'AI_API_KEY') return undefined;
        if (key === 'AI_BASE_URL') return undefined;
        if (key === 'AI_EXTRA_HEADERS') return '{}';
        return undefined;
      });

      const warnSpy = jest.spyOn(Logger.prototype, 'warn');
      new OpenAIProvider(configService);

      expect(warnSpy).toHaveBeenCalledWith(
        'AI_API_KEY 未配置，AI 分析功能将不可用',
      );
      warnSpy.mockRestore();
    });

    it('未设置 AI_BASE_URL 时应使用默认值', () => {
      jest.clearAllMocks();
      configService.get.mockImplementation((key: string) => {
        if (key === 'AI_API_KEY') return 'sk-test';
        if (key === 'AI_EXTRA_HEADERS') return '{}';
        return undefined;
      });

      new OpenAIProvider(configService);

      expect(OpenAI).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://api.openai.com/v1',
        }),
      );
    });
  });

  describe('analyze', () => {
    it('成功调用 OpenAI 并返回内容与元数据', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: '分析报告内容',
            },
          },
        ],
        usage: {
          total_tokens: 500,
        },
      };

      configService.get.mockImplementation((key: string) => {
        if (key === 'AI_MODEL') return 'gpt-4o-mini';
        return undefined;
      });

      mockOpenAIInstance.chat.completions.create.mockResolvedValue(
        mockResponse,
      );

      const result = await provider.analyze(mockRequest);

      expect(mockOpenAIInstance.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: expect.any(String) },
          { role: 'user', content: expect.any(String) },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      expect(result.content).toBe('分析报告内容');
      expect(result.metadata).toBeDefined();
      expect(result.metadata!.tokenCount).toBe(500);
      expect(result.metadata!.generationTime).toBeGreaterThanOrEqual(0);
    });

    it('未配置 AI_MODEL 时应使用默认模型 gpt-4o-mini', async () => {
      configService.get.mockReturnValue(undefined);
      mockOpenAIInstance.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: '内容' } }],
        usage: { total_tokens: 100 },
      });

      await provider.analyze(mockRequest);

      expect(mockOpenAIInstance.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'gpt-4o-mini' }),
      );
    });

    it('响应的 choices 为空时应返回空字符串', async () => {
      configService.get.mockReturnValue(undefined);
      mockOpenAIInstance.chat.completions.create.mockResolvedValue({
        choices: [],
        usage: { total_tokens: 0 },
      });

      const result = await provider.analyze(mockRequest);

      expect(result.content).toBe('');
    });

    it('响应的 message.content 为 null 时应返回空字符串', async () => {
      configService.get.mockReturnValue(undefined);
      mockOpenAIInstance.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: null } }],
        usage: { total_tokens: 0 },
      });

      const result = await provider.analyze(mockRequest);

      expect(result.content).toBe('');
    });

    it('API 调用失败时应抛出错误', async () => {
      configService.get.mockReturnValue(undefined);
      const apiError = new Error('API rate limit exceeded');
      mockOpenAIInstance.chat.completions.create.mockRejectedValue(apiError);

      await expect(provider.analyze(mockRequest)).rejects.toThrow(
        'API rate limit exceeded',
      );
    });

    it('API 调用失败时应记录错误日志', async () => {
      configService.get.mockReturnValue(undefined);
      const apiError = new Error('Network error');
      mockOpenAIInstance.chat.completions.create.mockRejectedValue(apiError);

      const errorSpy = jest.spyOn(Logger.prototype, 'error');
      await expect(provider.analyze(mockRequest)).rejects.toThrow();

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('AI analysis failed: Network error'),
      );
      errorSpy.mockRestore();
    });

    it('usage 为 undefined 时 tokenCount 应为 undefined', async () => {
      configService.get.mockReturnValue(undefined);
      mockOpenAIInstance.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: '内容' } }],
        usage: undefined,
      });

      const result = await provider.analyze(mockRequest);

      expect(result.metadata!.tokenCount).toBeUndefined();
    });
  });

  describe('analyzeStream', () => {
    it('应成功流式调用并返回完整内容', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'AI_MODEL') return 'gpt-4o-mini';
        return undefined;
      });

      const mockChunks = [
        { choices: [{ delta: { content: '第一' } }] },
        { choices: [{ delta: { content: '段内' } }] },
        { choices: [{ delta: { content: '容' } }] },
        { choices: [{ delta: { content: null } }] },
        { choices: [{ delta: { content: '' } }] },
      ];

      async function* generateMockStream() {
        for (const chunk of mockChunks) {
          yield chunk;
        }
      }

      mockOpenAIInstance.chat.completions.create.mockResolvedValue(
        generateMockStream(),
      );

      const onChunk = jest.fn();
      const result = await provider.analyzeStream(mockRequest, onChunk);

      expect(mockOpenAIInstance.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: expect.any(String) },
          { role: 'user', content: expect.any(String) },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        stream: true,
      });

      expect(result.content).toBe('第一段内容');
      expect(onChunk).toHaveBeenCalledTimes(3);
      expect(onChunk).toHaveBeenNthCalledWith(1, '第一');
      expect(onChunk).toHaveBeenNthCalledWith(2, '段内');
      expect(onChunk).toHaveBeenNthCalledWith(3, '容');
    });

    it('未配置 AI_MODEL 时应使用默认模型 gpt-4o-mini', async () => {
      configService.get.mockReturnValue(undefined);

      async function* emptyStream() {}
      mockOpenAIInstance.chat.completions.create.mockResolvedValue(
        emptyStream(),
      );

      await provider.analyzeStream(mockRequest, jest.fn());

      expect(mockOpenAIInstance.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'gpt-4o-mini', stream: true }),
      );
    });

    it('流式数据中没有 delta content 时应跳过', async () => {
      configService.get.mockReturnValue(undefined);

      async function* generateStream() {
        yield { choices: [{ delta: { content: '内容' } }] };
        yield { choices: [{ delta: {} }] };
        yield { choices: [{}] };
      }

      mockOpenAIInstance.chat.completions.create.mockResolvedValue(
        generateStream(),
      );

      const onChunk = jest.fn();
      const result = await provider.analyzeStream(mockRequest, onChunk);

      expect(result.content).toBe('内容');
      expect(onChunk).toHaveBeenCalledTimes(1);
    });

    it('API 调用失败时应抛出错误', async () => {
      configService.get.mockReturnValue(undefined);
      const apiError = new Error('Stream timeout');
      mockOpenAIInstance.chat.completions.create.mockRejectedValue(apiError);

      await expect(
        provider.analyzeStream(mockRequest, jest.fn()),
      ).rejects.toThrow('Stream timeout');
    });

    it('API 调用失败时应记录错误日志', async () => {
      configService.get.mockReturnValue(undefined);
      mockOpenAIInstance.chat.completions.create.mockRejectedValue(
        new Error('Stream failed'),
      );

      const errorSpy = jest.spyOn(Logger.prototype, 'error');
      await expect(
        provider.analyzeStream(mockRequest, jest.fn()),
      ).rejects.toThrow();

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('AI stream analysis failed: Stream failed'),
      );
      errorSpy.mockRestore();
    });

    it('tokenCount 应基于内容长度估算', async () => {
      configService.get.mockReturnValue(undefined);

      async function* generateStream() {
        yield { choices: [{ delta: { content: 'hello world' } }] };
      }

      mockOpenAIInstance.chat.completions.create.mockResolvedValue(
        generateStream(),
      );

      const result = await provider.analyzeStream(mockRequest, jest.fn());

      // tokenCount = fullContent.length / 4
      expect(result.metadata!.tokenCount).toBe(11 / 4);
    });
  });

  describe('validateConfig', () => {
    it('API KEY 存在且不为空时应返回 true', async () => {
      configService.get.mockReturnValue('sk-valid-key');

      const result = await provider.validateConfig();

      expect(result).toBe(true);
      expect(configService.get).toHaveBeenCalledWith('AI_API_KEY');
    });

    it('API KEY 不存在时应返回 false', async () => {
      configService.get.mockReturnValue(undefined);

      const result = await provider.validateConfig();

      expect(result).toBe(false);
    });

    it('API KEY 为空字符串时应返回 false', async () => {
      configService.get.mockReturnValue('');

      const result = await provider.validateConfig();

      expect(result).toBe(false);
    });
  });

  describe('parseExtraHeaders', () => {
    it('有效 JSON 应返回解析后的对象', () => {
      // Access private method via prototype
      const result = (OpenAIProvider as any).prototype.parseExtraHeaders.call(
        provider,
        '{"Authorization":"Bearer test","X-Custom":"value"}',
      );

      expect(result).toEqual({
        Authorization: 'Bearer test',
        'X-Custom': 'value',
      });
    });

    it('无效 JSON 应返回空对象', () => {
      const result = (OpenAIProvider as any).prototype.parseExtraHeaders.call(
        provider,
        'invalid json',
      );

      expect(result).toEqual({});
    });

    it('空字符串应返回空对象', () => {
      const result = (OpenAIProvider as any).prototype.parseExtraHeaders.call(
        provider,
        '',
      );

      expect(result).toEqual({});
    });
  });
});
