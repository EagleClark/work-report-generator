import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User, UserRole } from './entities/user.entity';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: { findOne: jest.Mock; save: jest.Mock };
  let jwtService: { sign: jest.Mock };

  const createUser = (overrides: Partial<User> = {}): User => ({
    id: 1,
    username: 'testuser',
    password: 'hashedPassword',
    role: UserRole.USER,
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
    tasks: [],
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User));
    jwtService = module.get(JwtService) as unknown as { sign: jest.Mock };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const loginDto = { username: 'testuser', password: 'correctPassword' };

    it('should return access_token and user without password when credentials are valid', async () => {
      const user = createUser();
      userRepository.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue('jwt-token');

      const result = await service.login(loginDto);

      expect(result).toEqual({
        access_token: 'jwt-token',
        user: expect.objectContaining({ id: 1, username: 'testuser', role: UserRole.USER }),
      });
      expect((result as { user: Record<string, unknown> }).user).not.toHaveProperty('password');
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      userRepository.findOne.mockResolvedValue(null);
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      userRepository.findOne.mockResolvedValue(createUser());
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateUser', () => {
    it('should return user when found', async () => {
      const user = createUser();
      userRepository.findOne.mockResolvedValue(user);
      const result = await service.validateUser(1);
      expect(result).toEqual(user);
    });

    it('should return null when user is not found', async () => {
      userRepository.findOne.mockResolvedValue(null);
      expect(await service.validateUser(999)).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('should return user without password when found', async () => {
      userRepository.findOne.mockResolvedValue(createUser());
      const result = await service.getCurrentUser(1);
      expect(result).not.toHaveProperty('password');
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      userRepository.findOne.mockResolvedValue(null);
      await expect(service.getCurrentUser(999)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('changePassword', () => {
    const changePasswordDto = { oldPassword: 'oldPassword123', newPassword: 'newPassword456' };

    it('should hash new password and save user when old password is correct', async () => {
      const user = createUser();
      userRepository.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');

      await service.changePassword(1, changePasswordDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword456', 10);
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      userRepository.findOne.mockResolvedValue(null);
      await expect(service.changePassword(999, changePasswordDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException when old password is wrong', async () => {
      const user = createUser();
      userRepository.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.changePassword(1, changePasswordDto)).rejects.toThrow(BadRequestException);
    });
  });
});
