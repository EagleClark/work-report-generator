import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export interface AIAnalysisRequest {
  summaryData: any;
  userPrompt?: string;
}

export interface AIAnalysisResponse {
  content: string;
  metadata?: {
    tokenCount?: number;
    generationTime?: number;
  };
}

@Injectable()
export class OpenAIProvider {
  private readonly logger = new Logger(OpenAIProvider.name);
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('AI_API_KEY');
    const baseURL = this.configService.get<string>('AI_BASE_URL') || 'https://api.openai.com/v1';
    const extraHeaders = this.configService.get<string>('AI_EXTRA_HEADERS') || '{}';

    this.openai = new OpenAI({
      apiKey,
      baseURL,
      defaultHeaders: this.parseExtraHeaders(extraHeaders),
    });
  }

  private parseExtraHeaders(jsonStr: string): Record<string, string> {
    try {
      return JSON.parse(jsonStr);
    } catch {
      return {};
    }
  }

  async analyze(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    const model = this.configService.get<string>('AI_MODEL') || 'gpt-4o-mini';
    const startTime = Date.now();

    const systemPrompt = `你是一个专业的人力资源分析师。请根据周报数据生成简明的人力分析报告。

**核心要求：**
1. 全文控制在500字以内，言简意赅
2. 只聚焦两个重点：人力情况和风险预警
3. 使用 Markdown 格式，结构清晰

**人力情况分析规则（重要）：**
判断人力压力的关键是对比"实际工作量"与"本周工作日数"：

- 如果实际工作量 > 工作日数：说明该人员加班了，人力压力大
  - 例：工作日5天，实际投入6人天 = 加班1天，人力压力大
  - 例：工作日4天（有假期），实际投入5人天 = 加班1天，人力压力大

- 如果实际工作量 ≈ 工作日数：人力正常
  - 例：工作日5天，实际投入5人天 = 正常满负荷

- 如果实际工作量 < 工作日数：不要轻易下结论
  - 可能原因：请假、支援其他项目、等待任务等
  - 例：工作日5天，实际投入3人天 = 可能请假或被抽调，需核实
  - 不可草率判断"工作量不饱和"

- 特殊情况：如果用户明确告知某人请假，但工作量仍然接近满负荷
  - 例：请假2天，工作日剩3天，实际投入4人天 = 加班工作，人力压力极大

**输出格式：**
## 人力情况
（分析各人员工作量是否合理，是否存在加班情况）

## 风险预警
（指出进度滞后、人力不足等风险点）`;

    const userPrompt = this.buildUserPrompt(request);

    try {
      const response = await this.openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content || '';
      const tokenCount = response.usage?.total_tokens;

      return {
        content,
        metadata: {
          tokenCount,
          generationTime: (Date.now() - startTime) / 1000,
        },
      };
    } catch (error) {
      this.logger.error(`AI analysis failed: ${error.message}`);
      throw error;
    }
  }

  private buildUserPrompt(request: AIAnalysisRequest): string {
    const { summaryData, userPrompt } = request;

    // 计算本周工作日数（简单估算：默认5天）
    // 实际应用中可以接入节假日 API
    const workingDays = this.estimateWorkingDays(summaryData.year, summaryData.weekNumber);

    let prompt = `请根据以下周报数据生成人力分析报告：

## 基本信息
- 年份/周数：${summaryData.year || '未知'}年 第${summaryData.weekNumber || '未知'}周
- 本周工作日：约${workingDays}天（未考虑法定假期，如有假期请用户在提示词中说明）

## 整体统计
- 任务总数：${summaryData.totalTasks || 0} 个
- 参与人员：${summaryData.assigneeCount || 0} 人
- 计划工作量：${summaryData.totalPlannedWeeklyWorkload || 0} 人天
- 实际工作量：${summaryData.totalWeeklyWorkload || 0} 人天
- 偏差：${(summaryData.totalWeeklyWorkload || 0) - (summaryData.totalPlannedWeeklyWorkload || 0)} 人天

## 任务状态
- 已完成：${summaryData.completedTasks || 0}，进行中：${summaryData.inProgressTasks || 0}，未开始：${summaryData.notStartedTasks || 0}

## 人员工作量明细
${this.formatAssigneeStats(summaryData.assigneeStats, workingDays)}`;

    if (userPrompt) {
      prompt += `

## 用户补充信息
${userPrompt}`;
    }

    return prompt;
  }

  // 估算工作日数（简化版本，实际应接入节假日API）
  private estimateWorkingDays(year: number, weekNumber: number): number {
    // 默认返回5天，用户需要在提示词中说明特殊假期
    return 5;
  }

  private formatAssigneeStats(assigneeStats: any[], workingDays: number): string {
    if (!assigneeStats || assigneeStats.length === 0) {
      return '暂无人员统计数据';
    }

    return assigneeStats.map(stat => {
      const actual = stat.weeklyWorkload || 0;
      const planned = stat.plannedWeeklyWorkload || 0;
      const overtime = actual - workingDays;
      let status = '';
      if (overtime > 0) {
        status = `【加班${overtime}天，人力压力大】`;
      } else if (overtime < -1) {
        status = `【可能请假/支援其他项目，需核实】`;
      } else {
        status = `【正常】`;
      }
      return `- ${stat.assignee}：计划${planned}天，实际${actual}天 ${status}`;
    }).join('\n');
  }

  async validateConfig(): Promise<boolean> {
    const apiKey = this.configService.get<string>('AI_API_KEY');
    return !!apiKey && apiKey.length > 0;
  }
}