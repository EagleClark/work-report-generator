import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @MinLength(6, { message: '密码至少6位' })
  oldPassword: string;

  @IsString()
  @MinLength(6, { message: '密码至少6位' })
  newPassword: string;
}