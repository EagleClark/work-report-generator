import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
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

  @Post('generate-stream')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async generateStream(@Body() dto: CreateAnalysisDto, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      await this.aiAnalysisService.generateAnalysisStream(dto, (chunk: string) => {
        res.write(chunk);
      });

      res.end();
    } catch (error) {
      res.write(`生成失败: ${error.message}`);
      res.end();
    }
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  delete(@Param('id') id: string) {
    return this.aiAnalysisService.delete(+id);
  }
}