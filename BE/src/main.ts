import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './auth/entities/user.entity';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.setGlobalPrefix('api');

  // 初始化超级管理员
  const userRepository = app.get<Repository<User>>(getRepositoryToken(User));
  const superAdmin = await userRepository.findOne({
    where: { role: UserRole.SUPER_ADMIN },
  });

  if (!superAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = userRepository.create({
      username: 'admin',
      password: hashedPassword,
      role: UserRole.SUPER_ADMIN,
    });
    await userRepository.save(admin);
    console.log('Default super admin created: admin / admin123');
  }

  await app.listen(3001);
  console.log('Server running on http://localhost:3001');
}
bootstrap();
