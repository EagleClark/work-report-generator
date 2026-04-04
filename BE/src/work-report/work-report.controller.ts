import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { WorkReportService } from './work-report.service';
import { CreateWorkReportDto, UpdateWorkReportDto, QueryWorkReportDto } from './dto/work-report.dto';

@Controller('work-reports')
export class WorkReportController {
  constructor(private readonly workReportService: WorkReportService) {}

  @Post()
  create(@Body() createDto: CreateWorkReportDto) {
    return this.workReportService.create(createDto);
  }

  @Get()
  findAll(
    @Query('year') year?: string,
    @Query('weekNumber') weekNumber?: string,
  ) {
    const query: QueryWorkReportDto = {};
    if (year) query.year = parseInt(year, 10);
    if (weekNumber) query.weekNumber = parseInt(weekNumber, 10);
    return this.workReportService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workReportService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateWorkReportDto) {
    return this.workReportService.update(+id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.workReportService.remove(+id);
  }
}
