import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkReportController } from './work-report.controller';
import { WorkReportService } from './work-report.service';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { WorkReport } from './entities/work-report.entity';
import { Task } from './entities/task.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WorkReport, Task])],
  controllers: [WorkReportController, TaskController],
  providers: [WorkReportService, TaskService],
  exports: [TaskService],
})
export class WorkReportModule {}
