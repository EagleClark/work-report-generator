import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AIAnalysisService } from '../services/ai-analysis.service';
import { CreateAnalysisDto, QueryAnalysisDto } from '../dto/create-analysis.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/entities/user.entity';

@Controller('ai-analysis')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AIAnalysisController {
  constructor(private readonly aiAnalysisService: AIAnalysisService) {}

  @Get()
  findAll(@Query() query: QueryAnalysisDto) {
    return this.aiAnalysisService.findAll(query);
  }

  @Get('current')
  getCurrent(
    @Query('year') year: string,
    @Query('weekNumber') weekNumber: string,
  ) {
    return this.aiAnalysisService.findByYearAndWeek(
      parseInt(year, 10),
      parseInt(weekNumber, 10),
    );
  }

  @Post('generate')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  generate(@Body() dto: CreateAnalysisDto) {
    return this.aiAnalysisService.generateAnalysis(dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  delete(@Param('id') id: string) {
    return this.aiAnalysisService.delete(+id);
  }
}