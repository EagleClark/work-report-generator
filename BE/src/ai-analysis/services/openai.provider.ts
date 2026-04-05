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

    const systemPrompt = this.buildSystemPrompt();
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

  async analyzeStream(request: AIAnalysisRequest, onChunk: (chunk: string) => void): Promise<AIAnalysisResponse> {
    const model = this.configService.get<string>('AI_MODEL') || 'gpt-4o-mini';
    const startTime = Date.now();

    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(request);

    try {
      const stream = await this.openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        stream: true,
      });

      let fullContent = '';
      let tokenCount = 0;

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullContent += content;
          onChunk(content);
        }
      }

      // 尝试获取 token 使用量（某些流式 API 可能不返回）
      tokenCount = fullContent.length / 4; // 粗略估算

      return {
        content: fullContent,
        metadata: {
          tokenCount,
          generationTime: (Date.now() - startTime) / 1000,
        },
      };
    } catch (error) {
      this.logger.error(`AI stream analysis failed: ${error.message}`);
      throw error;
    }
  }

  private buildSystemPrompt(): string {
    return `你是一个专业的人力资源分析师。请根据周报数据生成详细的人力分析报告。

**核心要求：**
1. 全文控制在800字以内
2. 重点分析：每个人的人力压力 + 整体团队压力
3. 使用 Markdown 格式，结构清晰

**人力压力判断规则（核心）：**
判断人力压力的关键是对比"本周实际工作量"与"本周工作日数"：

- 实际工作量 > 工作日数：加班，人力压力大
  - 例：工作日5天，实际6人天 = 加班1天，压力大
  - 例：工作日4天（有假期），实际5人天 = 加班1天，压力大

- 实际工作量 ≈ 工作日数：正常满负荷

- 实际工作量 < 工作日数：不要轻易下结论
  - 可能原因：请假、支援其他项目、等待任务
  - 不可草率判断"工作量不饱和"

- 特殊情况：用户明确告知请假，但工作量仍接近满负荷
  - 例：请假2天，剩余3个工作日，实际投入4天 = 加班工作，压力极大

**任务偏差分析规则：**
- 严重超支（偏差>2天或>20%）：需分析原因
- 轻微超支（偏差1-2天或10-20%）：需关注风险
- 备注：重点关注备注中的偏差原因说明

**输出格式：**
## 个人压力分析
（逐人分析工作量、是否加班、压力等级）

## 团队整体压力
（团队整体人力是否充足、是否有风险）

## 风险预警
（指出进度滞后、人力不足、任务超支等风险点）`;
  }

  private buildUserPrompt(request: AIAnalysisRequest): string {
    const { summaryData, userPrompt } = request;

    // 计算本周工作日数
    const workingDays = this.estimateWorkingDays(summaryData.year, summaryData.weekNumber);

    // 分析已完成任务的偏差
    const taskDeviations = this.analyzeTaskDeviations(summaryData.tasks);

    // 生成每个人的任务明细
    const personalDetails = this.generatePersonalDetails(summaryData.tasks, workingDays);

    let prompt = `请根据以下周报数据生成人力分析报告：

## 基本信息
- 年份/周数：${summaryData.year || '未知'}年 第${summaryData.weekNumber || '未知'}周
- 本周工作日：约${workingDays}天（未考虑法定假期，如有假期请用户在提示词中说明）

## 团队整体统计
- 任务总数：${summaryData.totalTasks || 0} 个
- 参与人员：${summaryData.assigneeCount || 0} 人
- 计划工作量：${summaryData.totalPlannedWeeklyWorkload || 0} 人天
- 实际工作量：${summaryData.totalWeeklyWorkload || 0} 人天
- 整体偏差：${(summaryData.totalWeeklyWorkload || 0) - (summaryData.totalPlannedWeeklyWorkload || 0)} 人天

## 任务状态分布
- 已完成：${summaryData.completedTasks || 0}，进行中：${summaryData.inProgressTasks || 0}，未开始：${summaryData.notStartedTasks || 0}

## 人员工作量汇总
${this.formatAssigneeStats(summaryData.assigneeStats, workingDays)}

## 每个人任务明细
${personalDetails}

## 已完成任务偏差分析
${taskDeviations}`;

    if (userPrompt) {
      prompt += `

## 用户补充信息
${userPrompt}`;
    }

    return prompt;
  }

  // 生成每个人的任务明细
  private generatePersonalDetails(tasks: any[], workingDays: number): string {
    if (!tasks || tasks.length === 0) {
      return '暂无任务数据';
    }

    // 按人员分组
    const byAssignee = new Map<string, any[]>();
    tasks.forEach(t => {
      const assignee = t.assignee || '未分配';
      if (!byAssignee.has(assignee)) {
        byAssignee.set(assignee, []);
      }
      byAssignee.get(assignee)!.push(t);
    });

    // 格式化每个人的明细
    const lines: string[] = [];
    byAssignee.forEach((personTasks, assignee) => {
      const weeklyWorkload = personTasks.reduce((sum, t) => sum + (t.weeklyWorkload || 0), 0);
      const plannedWorkload = personTasks.reduce((sum, t) => sum + (t.plannedWeeklyWorkload || 0), 0);
      const overtime = weeklyWorkload - workingDays;

      lines.push(`### ${assignee}`);
      lines.push(`本周投入: ${weeklyWorkload}人天（计划${plannedWorkload}人天）| 压力判断: ${overtime > 0 ? '加班' + overtime + '天，压力大' : overtime < -1 ? '可能请假/支援其他' : '正常'}`);
      lines.push('任务列表:');
      personTasks.forEach(t => {
        const progress = t.progress || 0;
        const status = progress === 100 ? '✓已完成' : progress > 0 ? '◐进行中' : '○未开始';
        lines.push(`  ${status} 【${t.project}】${t.taskDetail.substring(0, 25)}${t.taskDetail.length > 25 ? '...' : ''}`);
        lines.push(`       进度${progress}% | 预计${t.estimatedWorkload || 0}天 | 实际${t.actualWorkload || 0}天 | 本周${t.weeklyWorkload || 0}天`);
        if (t.remark) {
          lines.push(`       备注: ${t.remark.substring(0, 50)}${t.remark.length > 50 ? '...' : ''}`);
        }
      });
      lines.push('');
    });

    return lines.join('\n');
  }

  // 分析已完成任务的偏差
  private analyzeTaskDeviations(tasks: any[]): string {
    if (!tasks || tasks.length === 0) {
      return '暂无任务数据';
    }

    // 过滤已完成的任务，且有预估工作量
    const completedTasks = tasks.filter(t => t.progress === 100 && t.estimatedWorkload > 0);

    if (completedTasks.length === 0) {
      return '暂无已完成的任务偏差数据';
    }

    // 计算偏差并排序
    const deviations = completedTasks.map(t => {
      const actual = t.actualWorkload || 0;
      const estimated = t.estimatedWorkload || 0;
      const deviation = actual - estimated;
      const deviationRate = estimated > 0 ? ((deviation / estimated) * 100).toFixed(1) : '0';
      return {
        project: t.project,
        taskDetail: t.taskDetail,
        assignee: t.assignee || '未分配',
        estimated,
        actual,
        deviation,
        deviationRate,
        remark: t.remark || '',
      };
    }).sort((a, b) => b.deviation - a.deviation);

    // 格式化输出
    return deviations.map(t => {
      const sign = t.deviation > 0 ? '+' : '';
      let line = `- 【${t.project}】${t.taskDetail.substring(0, 30)}${t.taskDetail.length > 30 ? '...' : ''}`;
      line += `\n  责任人: ${t.assignee} | 计划${t.estimated}天 | 实际${t.actual}天 | 偏差${sign}${t.deviation}天(${sign}${t.deviationRate}%)`;
      if (t.remark) {
        line += `\n  备注: ${t.remark}`;
      }
      return line;
    }).join('\n');
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
      let pressure = '';
      if (overtime > 1) {
        pressure = '⚠️ 压力大';
      } else if (overtime > 0) {
        pressure = '⚡ 轻微加班';
      } else if (overtime < -1) {
        pressure = '❓ 待核实';
      } else {
        pressure = '✅ 正常';
      }
      return `- ${stat.assignee}：计划${planned}天，实际${actual}天，偏差${actual - planned >= 0 ? '+' : ''}${(actual - planned).toFixed(1)}天 ${pressure}`;
    }).join('\n');
  }

  async validateConfig(): Promise<boolean> {
    const apiKey = this.configService.get<string>('AI_API_KEY');
    return !!apiKey && apiKey.length > 0;
  }
}