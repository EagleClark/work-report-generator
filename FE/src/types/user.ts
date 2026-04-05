export enum UserRole {
  GUEST = 'GUEST',
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export interface User {
  id: number;
  username: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface JwtPayload {
  sub: number;
  username: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export interface CreateUserDto {
  username: string;
  password: string;
  role?: UserRole;
}

export interface UpdateUserDto {
  username?: string;
  password?: string;
  role?: UserRole;
}