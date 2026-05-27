import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateWorkReportDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsNotEmpty()
  @IsNumber()
  weekNumber: number;

  @IsNotEmpty()
  @IsNumber()
  year: number;

  @IsOptional()
  @IsNumber()
  userId?: number;
}

export class UpdateWorkReportDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsNumber()
  weekNumber?: number;

  @IsOptional()
  @IsNumber()
  year?: number;

  @IsOptional()
  @IsNumber()
  userId?: number;
}

export class QueryWorkReportDto {
  @IsOptional()
  @IsNumber()
  year?: number;

  @IsOptional()
  @IsNumber()
  weekNumber?: number;
}
