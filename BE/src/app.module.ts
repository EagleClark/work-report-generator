import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkReportModule } from './work-report/work-report.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { WorkReport } from './work-report/entities/work-report.entity';
import { Task } from './work-report/entities/task.entity';
import { User } from './auth/entities/user.entity';
import { Project } from './projects/entities/project.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'work-report.db',
      entities: [WorkReport, Task, User, Project],
      synchronize: true,
    }),
    AuthModule,
    UsersModule,
    ProjectsModule,
    WorkReportModule,
  ],
})
export class AppModule {}
