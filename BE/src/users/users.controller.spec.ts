import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { User, UserRole } from '../auth/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;

  const mockUser: User = {
    id: 1,
    username: 'admin',
    password: 'hashed',
    role: UserRole.ADMIN,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    tasks: [] as any[],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should call service.findAll with current user', async () => {
      const expected = [{ id: 2, username: 'test', role: UserRole.USER }];
      service.findAll.mockResolvedValue(expected);

      const result = await controller.findAll(mockUser);

      expect(service.findAll).toHaveBeenCalledWith(mockUser);
      expect(result).toBe(expected);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with the provided id', async () => {
      const expected = { id: 1, username: 'test', role: UserRole.USER };
      service.findOne.mockResolvedValue(expected);

      const result = await controller.findOne(1);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toBe(expected);
    });
  });

  describe('create', () => {
    it('should call service.create with dto and current user', async () => {
      const dto: CreateUserDto = {
        username: 'newuser',
        password: 'password123',
      };
      const expected = { id: 4, username: 'newuser', role: UserRole.USER };
      service.create.mockResolvedValue(expected);

      const result = await controller.create(dto, mockUser);

      expect(service.create).toHaveBeenCalledWith(dto, mockUser);
      expect(result).toBe(expected);
    });
  });

  describe('update', () => {
    it('should call service.update with id, dto and current user', async () => {
      const dto: UpdateUserDto = { username: 'updated' };
      const expected = { id: 1, username: 'updated', role: UserRole.USER };
      service.update.mockResolvedValue(expected);

      const result = await controller.update(1, dto, mockUser);

      expect(service.update).toHaveBeenCalledWith(1, dto, mockUser);
      expect(result).toBe(expected);
    });
  });

  describe('remove', () => {
    it('should call service.remove with id and current user', async () => {
      service.remove.mockResolvedValue(undefined);

      const result = await controller.remove(1, mockUser);

      expect(service.remove).toHaveBeenCalledWith(1, mockUser);
      expect(result).toBeUndefined();
    });
  });
});
