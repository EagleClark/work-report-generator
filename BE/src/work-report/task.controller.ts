import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto, UpdateTaskDto, QueryTaskDto } from './dto/task.dto';

@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  create(@Body() createDto: CreateTaskDto) {
    return this.taskService.create(createDto);
  }

  @Get()
  findAll(
    @Query('year') year?: string,
    @Query('weekNumber') weekNumber?: string,
    @Query('project') project?: string,
  ) {
    const query: QueryTaskDto = {};
    if (year) query.year = parseInt(year, 10);
    if (weekNumber) query.weekNumber = parseInt(weekNumber, 10);
    if (project) query.project = project;
    return this.taskService.findAll(query);
  }

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
  update(@Param('id') id: string, @Body() updateDto: UpdateTaskDto) {
    return this.taskService.update(+id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.taskService.remove(+id);
  }
}
