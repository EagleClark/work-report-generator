import {
  Injectable,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../auth/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createDto: CreateUserDto, currentUser: User): Promise<Partial<User>> {
    // 只有超管可以创建管理员
    if (createDto.role === UserRole.ADMIN && currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('只有超级管理员可以创建管理员');
    }

    // 不能创建超管
    if (createDto.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('不能创建超级管理员');
    }

    // 检查用户名是否已存在
    const existing = await this.userRepository.findOne({
      where: { username: createDto.username },
    });
    if (existing) {
      throw new ConflictException('用户名已存在');
    }

    const hashedPassword = await bcrypt.hash(createDto.password, 10);
    const user = this.userRepository.create({
      ...createDto,
      password: hashedPassword,
      role: createDto.role || UserRole.USER,
    });

    const savedUser = await this.userRepository.save(user);
    const { password, ...result } = savedUser;
    return result;
  }

  async findAll(currentUser: User): Promise<Partial<User>[]> {
    // 管理员和超管可以看到所有用户
    const users = await this.userRepository.find({
      order: { createdAt: 'DESC' },
    });

    return users.map(({ password, ...user }) => user);
  }

  async findOne(id: number): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    const { password, ...result } = user;
    return result;
  }

  async update(id: number, updateDto: UpdateUserDto, currentUser: User): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 只有超管可以修改角色为管理员
    if (updateDto.role === UserRole.ADMIN && currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('只有超级管理员可以设置管理员角色');
    }

    // 不能修改为超管
    if (updateDto.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('不能设置为超级管理员');
    }

    // 检查用户名是否被其他用户使用
    if (updateDto.username && updateDto.username !== user.username) {
      const existing = await this.userRepository.findOne({
        where: { username: updateDto.username },
      });
      if (existing) {
        throw new ConflictException('用户名已存在');
      }
    }

    // 更新密码需要加密
    if (updateDto.password) {
      updateDto.password = await bcrypt.hash(updateDto.password, 10);
    }

    Object.assign(user, updateDto);
    const savedUser = await this.userRepository.save(user);
    const { password, ...result } = savedUser;
    return result;
  }

  async remove(id: number, currentUser: User): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 不能删除超管
    if (user.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('不能删除超级管理员');
    }

    // 不能删除自己
    if (user.id === currentUser.id) {
      throw new ForbiddenException('不能删除自己');
    }

    await this.userRepository.remove(user);
  }
}