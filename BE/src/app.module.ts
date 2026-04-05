import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { WorkReportModule } from './work-report/work-report.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { AIAnalysisModule } from './ai-analysis/ai-analysis.module';
import { WorkReport } from './work-report/entities/work-report.entity';
import { Task } from './work-report/entities/task.entity';
import { User } from './auth/entities/user.entity';
import { Project } from './projects/entities/project.entity';
import { AIAnalysis } from './ai-analysis/entities/ai-analysis.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'work-report.db',
      entities: [WorkReport, Task, User, Project, AIAnalysis],
      synchronize: true,
    }),
    AuthModule,
    UsersModule,
    ProjectsModule,
    WorkReportModule,
    AIAnalysisModule,
  ],
})
export class AppModule {}
