import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateAnalysisDto {
  @IsNotEmpty()
  @IsNumber()
  year: number;

  @IsNotEmpty()
  @IsNumber()
  weekNumber: number;

  @IsOptional()
  @IsString()
  userPrompt?: string;

  @IsOptional()
  @IsString()
  forceRegenerate?: string;
}

export class QueryAnalysisDto {
  @IsOptional()
  @IsNumber()
  year?: number;

  @IsOptional()
  @IsNumber()
  weekNumber?: number;
}