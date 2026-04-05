import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty({ message: '项目名称不能为空' })
  @MaxLength(100, { message: '项目名称最多100字符' })
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500, { message: '项目描述最多500字符' })
  description?: string;
}