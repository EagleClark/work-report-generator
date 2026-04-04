import { IsNotEmpty, IsNumber, IsOptional, IsString, IsDateString, Min, Max } from 'class-validator';

export class CreateTaskDto {
  @IsNotEmpty()
  @IsString()
  project: string;

  @IsOptional()
  @IsString()
  usDts?: string;

  @IsNotEmpty()
  @IsString()
  taskDetail: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progress?: number;

  @IsOptional()
  @IsNumber()
  estimatedWorkload?: number;

  @IsOptional()
  @IsDateString()
  plannedStartDate?: string;

  @IsOptional()
  @IsDateString()
  plannedEndDate?: string;

  @IsOptional()
  @IsNumber()
  actualWorkload?: number;

  @IsOptional()
  @IsNumber()
  weeklyWorkload?: number;

  @IsOptional()
  @IsDateString()
  actualStartDate?: string;

  @IsOptional()
  @IsDateString()
  actualEndDate?: string;

  @IsOptional()
  @IsString()
  assignee?: string;

  @IsOptional()
  @IsString()
  remark?: string;

  @IsNotEmpty()
  @IsNumber()
  weekNumber: number;

  @IsNotEmpty()
  @IsNumber()
  year: number;

  @IsOptional()
  @IsString()
  userId?: string;
}

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  project?: string;

  @IsOptional()
  @IsString()
  usDts?: string;

  @IsOptional()
  @IsString()
  taskDetail?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progress?: number;

  @IsOptional()
  @IsNumber()
  estimatedWorkload?: number;

  @IsOptional()
  @IsDateString()
  plannedStartDate?: string;

  @IsOptional()
  @IsDateString()
  plannedEndDate?: string;

  @IsOptional()
  @IsNumber()
  actualWorkload?: number;

  @IsOptional()
  @IsNumber()
  weeklyWorkload?: number;

  @IsOptional()
  @IsDateString()
  actualStartDate?: string;

  @IsOptional()
  @IsDateString()
  actualEndDate?: string;

  @IsOptional()
  @IsString()
  assignee?: string;

  @IsOptional()
  @IsString()
  remark?: string;

  @IsOptional()
  @IsNumber()
  weekNumber?: number;

  @IsOptional()
  @IsNumber()
  year?: number;

  @IsOptional()
  @IsString()
  userId?: string;
}

export class QueryTaskDto {
  @IsOptional()
  @IsNumber()
  year?: number;

  @IsOptional()
  @IsNumber()
  weekNumber?: number;

  @IsOptional()
  @IsString()
  project?: string;
}
