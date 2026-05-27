import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { AIAnalysisController } from './ai-analysis.controller';
import { AIAnalysisService } from '../services/ai-analysis.service';
import { CreateAnalysisDto } from '../dto/create-analysis.dto';
import { UserRole } from '../../auth/entities/user.entity';

describe('AIAnalysisController', () => {
  let controller: AIAnalysisController;
  let service: jest.Mocked<AIAnalysisService>;

  const mockAnalysis = {
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AIAnalysisController],
      providers: [
        {
          provide: AIAnalysisService,
          useValue: {
            findAll: jest.fn(),
            findByYearAndWeek: jest.fn(),
            getGeneratingStatus: jest.fn(),
            generateAnalysis: jest.fn(),
            generateAnalysisStream: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AIAnalysisController>(AIAnalysisController);
    service = module.get(AIAnalysisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('应调用 service.findAll 并返回结果', async () => {
      const analyses = [mockAnalysis];
      service.findAll.mockResolvedValue(analyses);

      const result = await controller.findAll({});

      expect(service.findAll).toHaveBeenCalledWith({});
      expect(result).toEqual(analyses);
    });

    it('应传递 year 和 weekNumber 查询参数', async () => {
      service.findAll.mockResolvedValue([mockAnalysis]);

      await controller.findAll({ year: 2026, weekNumber: 22 });

      expect(service.findAll).toHaveBeenCalledWith({
        year: 2026,
        weekNumber: 22,
      });
    });

    it('应只传递 year 参数', async () => {
      service.findAll.mockResolvedValue([mockAnalysis]);

      await controller.findAll({ year: 2026 });

      expect(service.findAll).toHaveBeenCalledWith({ year: 2026 });
    });
  });

  describe('getCurrent', () => {
    it('应调用 service.findByYearAndWeek 并返回结果', async () => {
      service.findByYearAndWeek.mockResolvedValue(mockAnalysis);

      const result = await controller.getCurrent('2026', '22');

      expect(service.findByYearAndWeek).toHaveBeenCalledWith(2026, 22);
      expect(result).toEqual(mockAnalysis);
    });

    it('找不到时应返回 null', async () => {
      service.findByYearAndWeek.mockResolvedValue(null);

      const result = await controller.getCurrent('2026', '99');

      expect(result).toBeNull();
    });
  });

  describe('getGeneratingStatus', () => {
    it('应调用 service.getGeneratingStatus 并返回结果', async () => {
      const status = {
        isGenerating: false,
        year: null,
        weekNumber: null,
        partialContent: '',
      };
      service.getGeneratingStatus.mockReturnValue(status);

      const result = controller.getGeneratingStatus();

      expect(service.getGeneratingStatus).toHaveBeenCalled();
      expect(result).toEqual(status);
    });

    it('正在生成中时应返回生成状态', () => {
      const generatingStatus = {
        isGenerating: true,
        year: 2026,
        weekNumber: 22,
        partialContent: '部分内容',
      };
      service.getGeneratingStatus.mockReturnValue(generatingStatus);

      const result = controller.getGeneratingStatus();

      expect(result.isGenerating).toBe(true);
      expect(result.partialContent).toBe('部分内容');
    });
  });

  describe('generate', () => {
    it('应调用 service.generateAnalysis 并返回结果', async () => {
      service.generateAnalysis.mockResolvedValue(mockAnalysis);

      const result = await controller.generate(mockCreateDto);

      expect(service.generateAnalysis).toHaveBeenCalledWith(mockCreateDto);
      expect(result).toEqual(mockAnalysis);
    });
  });

  describe('generateStream', () => {
    let mockResponse: jest.Mocked<Response>;

    beforeEach(() => {
      mockResponse = {
        setHeader: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as jest.Mocked<Response>;
    });

    it('未在生成中时应设置 SSE header 并调用 service.generateAnalysisStream', async () => {
      service.getGeneratingStatus.mockReturnValue({
        isGenerating: false,
        year: null,
        weekNumber: null,
        partialContent: '',
      });
      service.generateAnalysisStream.mockImplementation(
        async (_dto, onChunk) => {
          onChunk('流式');
          onChunk('内容');
          return mockAnalysis;
        },
      );

      await controller.generateStream(mockCreateDto, mockResponse);

      expect(service.getGeneratingStatus).toHaveBeenCalled();
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/event-stream',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Cache-Control',
        'no-cache',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Connection',
        'keep-alive',
      );
      expect(service.generateAnalysisStream).toHaveBeenCalledWith(
        mockCreateDto,
        expect.any(Function),
      );
      expect(mockResponse.write).toHaveBeenCalledTimes(2);
      expect(mockResponse.write).toHaveBeenNthCalledWith(1, '流式');
      expect(mockResponse.write).toHaveBeenNthCalledWith(2, '内容');
      expect(mockResponse.end).toHaveBeenCalled();
    });

    it('正在生成中时应返回 409 冲突状态且不设置 SSE header', async () => {
      service.getGeneratingStatus.mockReturnValue({
        isGenerating: true,
        year: 2026,
        weekNumber: 22,
        partialContent: '已有内容',
      });

      await controller.generateStream(mockCreateDto, mockResponse);

      expect(mockResponse.setHeader).not.toHaveBeenCalled();
      expect(service.generateAnalysisStream).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.CONFLICT,
        message: '正在生成分析中，请稍后再试',
        error: 'Conflict',
      });
    });

    it('生成过程中 service 抛出错误时应写入 __ERROR__ 并结束响应', async () => {
      service.getGeneratingStatus.mockReturnValue({
        isGenerating: false,
        year: null,
        weekNumber: null,
        partialContent: '',
      });
      const streamError = new Error('AI 服务异常');
      service.generateAnalysisStream.mockRejectedValue(streamError);

      await controller.generateStream(mockCreateDto, mockResponse);

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/event-stream',
      );
      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining('__ERROR__'),
      );
      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining('AI 服务异常'),
      );
      expect(mockResponse.end).toHaveBeenCalled();
    });

    it('错误响应应包含完整的错误信息结构', async () => {
      service.getGeneratingStatus.mockReturnValue({
        isGenerating: false,
        year: null,
        weekNumber: null,
        partialContent: '',
      });
      service.generateAnalysisStream.mockRejectedValue(
        new Error('生成分析失败'),
      );

      await controller.generateStream(mockCreateDto, mockResponse);

      const errorWriteCall = mockResponse.write.mock.calls.find(
        ([arg]) => typeof arg === 'string' && arg.includes('__ERROR__'),
      );
      expect(errorWriteCall).toBeDefined();
      const errorPayload = JSON.parse(
        (errorWriteCall![0] as string).replace('__ERROR__: ', ''),
      );
      expect(errorPayload).toMatchObject({
        success: false,
        error: true,
        message: '生成分析失败',
      });
    });
  });

  describe('delete', () => {
    it('应调用 service.delete 并传入数字 id', async () => {
      service.delete.mockResolvedValue(undefined);

      await controller.delete('1');

      expect(service.delete).toHaveBeenCalledWith(1);
    });

    it('删除不存在记录时应传递错误', async () => {
      service.delete.mockRejectedValue(new Error('Analysis with ID 999 not found'));

      await expect(controller.delete('999')).rejects.toThrow(
        'Analysis with ID 999 not found',
      );
    });
  });
});
