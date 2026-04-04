import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkReportModule } from './work-report/work-report.module';
import { WorkReport } from './work-report/entities/work-report.entity';
import { Task } from './work-report/entities/task.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'work-report.db',
      entities: [WorkReport, Task],
      synchronize: true,
    }),
    WorkReportModule,
  ],
})
export class AppModule {}
