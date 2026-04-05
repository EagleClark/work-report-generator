import { IsString, IsOptional, IsEnum, MinLength } from 'class-validator';
import { UserRole } from '../../auth/entities/user.entity';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsOptional()
  @MinLength(6, { message: '密码至少6位' })
  password?: string;

  @IsEnum(UserRole, { message: '角色类型无效' })
  @IsOptional()
  role?: UserRole;
}