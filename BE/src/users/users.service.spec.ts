import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User, UserRole } from '../auth/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

// bcrypt exports hash as a non-configurable property, so jest.spyOn cannot
// redefine it. We must mock the entire module at the top level.
jest.mock('bcrypt', () => ({ hash: jest.fn() }));

type MockRepository = jest.Mocked<
  Pick<Repository<User>, 'findOne' | 'find' | 'create' | 'save' | 'remove'>
>;

describe('UsersService', () => {
  let service: UsersService;
  let repository: MockRepository;
  let mockUser: User;
  let mockAdmin: User;
  let mockSuperAdmin: User;

  const baseTime = new Date('2024-01-01T00:00:00Z');

  function createUser(overrides: Partial<User> = {}): User {
    return {
      id: 1,
      username: 'testuser',
      password: 'hashedPwd',
      role: UserRole.USER,
      createdAt: baseTime,
      updatedAt: baseTime,
      tasks: [] as any[],
      ...overrides,
    };
  }

  beforeEach(async () => {
    // Fresh copies for every test to prevent Object.assign mutations in the
    // service's update method from leaking across tests.
    mockUser = createUser();
    mockAdmin = createUser({ id: 2, username: 'admin', role: UserRole.ADMIN });
    mockSuperAdmin = createUser({
      id: 3,
      username: 'superadmin',
      role: UserRole.SUPER_ADMIN,
    });

    // Clear bcrypt mock between tests
    (bcrypt.hash as jest.Mock).mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateUserDto = {
      username: 'newuser',
      password: 'password123',
    };

    it('should create a user successfully with default USER role', async () => {
      repository.findOne.mockResolvedValue(null);
      const newUser: User = createUser({ id: 4, username: 'newuser' });
      repository.create.mockReturnValue(newUser);
      repository.save.mockResolvedValue(newUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPwd');

      const result = await service.create(createDto, mockSuperAdmin);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(repository.create).toHaveBeenCalledWith({
        ...createDto,
        password: 'hashedPwd',
        role: UserRole.USER,
      });
      expect(repository.save).toHaveBeenCalledWith(newUser);
      expect(result).not.toHaveProperty('password');
      expect(result.username).toBe('newuser');
      expect(result.role).toBe(UserRole.USER);
    });

    it('should create a user with specified role when provided', async () => {
      const dto: CreateUserDto = { ...createDto, role: UserRole.GUEST };
      repository.findOne.mockResolvedValue(null);
      const newUser: User = createUser({
        id: 5,
        username: 'guest',
        role: UserRole.GUEST,
      });
      repository.create.mockReturnValue(newUser);
      repository.save.mockResolvedValue(newUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPwd');

      const result = await service.create(dto, mockSuperAdmin);

      expect(repository.create).toHaveBeenCalledWith({
        ...dto,
        password: 'hashedPwd',
        role: UserRole.GUEST,
      });
      expect(result.role).toBe(UserRole.GUEST);
    });

    it('should throw ForbiddenException when non-SUPER_ADMIN creates an ADMIN', async () => {
      const dto: CreateUserDto = { ...createDto, role: UserRole.ADMIN };

      await expect(service.create(dto, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.create(dto, mockAdmin)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException when trying to create a SUPER_ADMIN', async () => {
      const dto: CreateUserDto = { ...createDto, role: UserRole.SUPER_ADMIN };

      await expect(service.create(dto, mockSuperAdmin)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ConflictException when username already exists', async () => {
      repository.findOne.mockResolvedValue(mockUser);

      await expect(service.create(createDto, mockSuperAdmin)).rejects.toThrow(
        ConflictException,
      );
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { username: 'newuser' },
      });
    });
  });

  describe('findAll', () => {
    it('should return all users without passwords', async () => {
      const users = [mockAdmin, mockUser, mockSuperAdmin];
      repository.find.mockResolvedValue(users);

      const result = await service.findAll(mockSuperAdmin);

      expect(repository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveLength(3);
      result.forEach((user) => {
        expect(user).not.toHaveProperty('password');
      });
    });
  });

  describe('findOne', () => {
    it('should return user without password when found', async () => {
      repository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne(1);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).not.toHaveProperty('password');
      expect(result.username).toBe('testuser');
    });

    it('should throw NotFoundException when user is not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 999 } });
    });
  });

  describe('update', () => {
    it('should update username successfully', async () => {
      const existingUser = createUser();
      const updateDto: UpdateUserDto = { username: 'updateduser' };
      const savedUser: User = { ...existingUser, username: 'updateduser' };
      repository.findOne
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(null);
      repository.save.mockResolvedValue(savedUser);

      const result = await service.update(1, updateDto, mockSuperAdmin);

      expect(repository.findOne).toHaveBeenNthCalledWith(1, {
        where: { id: 1 },
      });
      expect(repository.findOne).toHaveBeenNthCalledWith(2, {
        where: { username: 'updateduser' },
      });
      expect(repository.save).toHaveBeenCalled();
      expect(result).not.toHaveProperty('password');
      expect(result.username).toBe('updateduser');
    });

    it('should update password successfully', async () => {
      const existingUser = createUser();
      const updateDto: UpdateUserDto = { password: 'newpassword123' };
      const savedUser: User = { ...existingUser, password: 'newHashedPwd' };
      repository.findOne.mockResolvedValue(existingUser);
      repository.save.mockResolvedValue(savedUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPwd');

      const result = await service.update(1, updateDto, mockSuperAdmin);

      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 10);
      expect(repository.save).toHaveBeenCalled();
      expect(result).not.toHaveProperty('password');
    });

    it('should throw NotFoundException when user does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.update(999, {} as UpdateUserDto, mockSuperAdmin),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when non-SUPER_ADMIN sets role to ADMIN', async () => {
      repository.findOne.mockResolvedValue(createUser());
      const updateDto: UpdateUserDto = { role: UserRole.ADMIN };

      await expect(service.update(1, updateDto, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.update(1, updateDto, mockAdmin)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException when trying to set role to SUPER_ADMIN', async () => {
      repository.findOne.mockResolvedValue(createUser());
      const updateDto: UpdateUserDto = { role: UserRole.SUPER_ADMIN };

      await expect(
        service.update(1, updateDto, mockSuperAdmin),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException when new username is already taken', async () => {
      const existingUser = createUser();
      const anotherUser = createUser({ id: 2, username: 'admin' });
      const updateDto: UpdateUserDto = { username: 'admin' };
      repository.findOne
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(anotherUser);

      await expect(
        service.update(1, updateDto, mockSuperAdmin),
      ).rejects.toThrow(ConflictException);
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('should skip username conflict check when username is unchanged', async () => {
      const existingUser = createUser({ username: 'testuser' });
      repository.findOne.mockResolvedValue(existingUser);
      repository.save.mockResolvedValue(existingUser);

      await service.update(1, { username: 'testuser' }, mockSuperAdmin);

      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(repository.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a user successfully', async () => {
      repository.findOne.mockResolvedValue(mockAdmin);
      repository.remove.mockResolvedValue(undefined);

      await service.remove(2, mockSuperAdmin);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 2 } });
      expect(repository.remove).toHaveBeenCalledWith(mockAdmin);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove(999, mockSuperAdmin)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when deleting a SUPER_ADMIN', async () => {
      repository.findOne.mockResolvedValue(mockSuperAdmin);

      await expect(service.remove(3, mockAdmin)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException when deleting yourself', async () => {
      repository.findOne.mockResolvedValue(mockUser);

      await expect(service.remove(1, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
