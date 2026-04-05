import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto, UpdateTaskDto, QueryTaskDto } from './dto/task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../auth/entities/user.entity';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  create(@Body() createDto: CreateTaskDto, @CurrentUser() user: User) {
    return this.taskService.create(createDto, user);
  }

  @Get()
  findAll(
    @Query('year') year?: string,
    @Query('weekNumber') weekNumber?: string,
    @Query('project') project?: string,
    @CurrentUser() user?: User,
  ) {
    const query: QueryTaskDto = {};
    if (year) query.year = parseInt(year, 10);
    if (weekNumber) query.weekNumber = parseInt(weekNumber, 10);
    if (project) query.project = project;
    return this.taskService.findAll(query, user);
  }

  @Public()
  @Get('summary')
  getWeeklySummary(
    @Query('year') year: string,
    @Query('weekNumber') weekNumber: string,
  ) {
    return this.taskService.getWeeklySummary(parseInt(year, 10), parseInt(weekNumber, 10));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.taskService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateTaskDto, @CurrentUser() user: User) {
    return this.taskService.update(+id, updateDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.taskService.remove(+id, user);
  }
}