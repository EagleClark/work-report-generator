import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { User, UserRole } from './entities/user.entity';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    login: jest.Mock;
    changePassword: jest.Mock;
    getCurrentUser: jest.Mock;
  };

  const mockUser: User = {
    id: 1,
    username: 'testuser',
    password: 'hashed',
    role: UserRole.USER,
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
    tasks: [],
  };

  beforeEach(async () => {
    authService = {
      login: jest.fn(),
      changePassword: jest.fn(),
      getCurrentUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (ctx: any) => {
          ctx.switchToHttp().getRequest().user = mockUser;
          return true;
        },
      })
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should call authService.login and return the result', async () => {
      const loginDto = { username: 'testuser', password: 'password123' };
      const expectedResult = {
        access_token: 'jwt-token',
        user: { id: 1, username: 'testuser', role: UserRole.USER },
      };
      authService.login.mockResolvedValue(expectedResult);

      const result = await controller.login(loginDto);

      expect(authService.login).toHaveBeenCalledTimes(1);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toBe(expectedResult);
    });
  });

  describe('changePassword', () => {
    it('should call authService.changePassword with current user id and dto', async () => {
      const changePasswordDto = {
        oldPassword: 'oldPass',
        newPassword: 'newPass',
      };
      authService.changePassword.mockResolvedValue(undefined);

      await controller.changePassword(mockUser, changePasswordDto);

      expect(authService.changePassword).toHaveBeenCalledTimes(1);
      expect(authService.changePassword).toHaveBeenCalledWith(
        mockUser.id,
        changePasswordDto,
      );
    });
  });

  describe('getCurrentUser', () => {
    it('should call authService.getCurrentUser with current user id and return the result', async () => {
      const expectedResult = {
        id: 1,
        username: 'testuser',
        role: UserRole.USER,
      };
      authService.getCurrentUser.mockResolvedValue(expectedResult);

      const result = await controller.getCurrentUser(mockUser);

      expect(authService.getCurrentUser).toHaveBeenCalledTimes(1);
      expect(authService.getCurrentUser).toHaveBeenCalledWith(mockUser.id);
      expect(result).toBe(expectedResult);
    });
  });
});
