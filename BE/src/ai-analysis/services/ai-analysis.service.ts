import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AIAnalysis } from '../entities/ai-analysis.entity';
import { CreateAnalysisDto, QueryAnalysisDto } from '../dto/create-analysis.dto';
import { OpenAIProvider } from './openai.provider';
import { TaskService } from '../../work-report/task.service';

@Injectable()
export class AIAnalysisService {
  private readonly logger = new Logger(AIAnalysisService.name);

  constructor(
    @InjectRepository(AIAnalysis)
    private analysisRepository: Repository<AIAnalysis>,
    private openaiProvider: OpenAIProvider,
    private taskService: TaskService,
  ) {}

  async findByYearAndWeek(year: number, weekNumber: number): Promise<AIAnalysis | null> {
    return this.analysisRepository.findOne({
      where: { year, weekNumber },
    });
  }

  async generateAnalysis(dto: CreateAnalysisDto): Promise<AIAnalysis> {
    const { year, weekNumber, userPrompt, forceRegenerate } = dto;

    // 检查是否已存在分析
    const existing = await this.findByYearAndWeek(year, weekNumber);
    if (existing && forceRegenerate !== 'true') {
      return existing;
    }

    // 获取周报数据
    const summaryData = await this.taskService.getWeeklySummary(year, weekNumber);

    // 计算人员数量
    const assigneeSet = new Set(
      summaryData.tasks?.map((t: any) => t.assignee).filter(Boolean) || []
    );
    const assigneeCount = assigneeSet.size;

    // 构建请求
    const request = {
      summaryData: {
        ...summaryData,
        year,
        weekNumber,
        assigneeCount,
      },
      userPrompt,
    };

    try {
      // 调用 AI 服务
      const response = await this.openaiProvider.analyze(request);

      // 如果存在且强制重新生成，删除旧记录
      if (existing && forceRegenerate === 'true') {
        await this.analysisRepository.remove(existing);
      }

      // 保存分析结果
      const analysis = this.analysisRepository.create({
        year,
        weekNumber,
        analysisContent: response.content,
        userPrompt,
        modelType: 'OPENAI',
        modelName: process.env.AI_MODEL || 'gpt-4o-mini',
        metadata: response.metadata,
      });

      return this.analysisRepository.save(analysis);
    } catch (error) {
      this.logger.error(`Failed to generate analysis: ${error.message}`);
      throw error;
    }
  }

  async findAll(query: QueryAnalysisDto): Promise<AIAnalysis[]> {
    const where: any = {};
    if (query.year) where.year = query.year;
    if (query.weekNumber) where.weekNumber = query.weekNumber;

    return this.analysisRepository.find({
      where,
      order: { year: 'DESC', weekNumber: 'DESC', createdAt: 'DESC' },
    });
  }

  async delete(id: number): Promise<void> {
    const analysis = await this.analysisRepository.findOne({ where: { id } });
    if (!analysis) {
      throw new NotFoundException(`Analysis with ID ${id} not found`);
    }
    await this.analysisRepository.remove(analysis);
  }

  async generateAnalysisStream(dto: CreateAnalysisDto, onChunk: (chunk: string) => void): Promise<AIAnalysis> {
    const { year, weekNumber, userPrompt } = dto;

    // 删除已有分析
    const existing = await this.findByYearAndWeek(year, weekNumber);
    if (existing) {
      await this.analysisRepository.remove(existing);
    }

    // 获取周报数据
    const summaryData = await this.taskService.getWeeklySummary(year, weekNumber);

    // 计算人员数量
    const assigneeSet = new Set(
      summaryData.tasks?.map((t: any) => t.assignee).filter(Boolean) || []
    );
    const assigneeCount = assigneeSet.size;

    // 构建请求
    const request = {
      summaryData: {
        ...summaryData,
        year,
        weekNumber,
        assigneeCount,
      },
      userPrompt,
    };

    try {
      // 调用 AI 服务流式生成
      const response = await this.openaiProvider.analyzeStream(request, onChunk);

      // 保存分析结果
      const analysis = this.analysisRepository.create({
        year,
        weekNumber,
        analysisContent: response.content,
        userPrompt,
        modelType: 'OPENAI',
        modelName: process.env.AI_MODEL || 'gpt-4o-mini',
        metadata: response.metadata,
      });

      return this.analysisRepository.save(analysis);
    } catch (error) {
      this.logger.error(`Failed to generate analysis stream: ${error.message}`);
      throw error;
    }
  }
}