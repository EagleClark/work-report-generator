import { IsNumber, IsOptional, IsEnum, Min, Max } from 'class-validator';

export enum CopyMode {
  SELF = 'SELF', // 复制自己的任务
  ALL = 'ALL', // 复制所有用户任务（管理员）
  SPECIFIC_USER = 'SPECIFIC_USER', // 复制指定用户任务（管理员）
}

export class CopyTaskDto {
  @IsNumber()
  @Min(2000)
  @Max(2100)
  year: number;

  @IsNumber()
  @Min(1)
  @Max(53)
  weekNumber: number; // 目标周数（本周）

  @IsOptional()
  @IsEnum(CopyMode)
  copyMode?: CopyMode; // 默认 SELF

  @IsOptional()
  @IsNumber()
  userId?: number; // SPECIFIC_USER 模式时必需
}

export class CopyTaskResultDto {
  copiedCount: number;
  skippedCount: number;
  skippedTasks: Array<{ task: string; reason: string }>;
}