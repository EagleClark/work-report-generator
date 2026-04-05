import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AIAnalysisController } from './controllers/ai-analysis.controller';
import { AIAnalysisService } from './services/ai-analysis.service';
import { OpenAIProvider } from './services/openai.provider';
import { AIAnalysis } from './entities/ai-analysis.entity';
import { WorkReportModule } from '../work-report/work-report.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AIAnalysis]),
    ConfigModule,
    WorkReportModule,
  ],
  controllers: [AIAnalysisController],
  providers: [AIAnalysisService, OpenAIProvider],
  exports: [AIAnalysisService],
})
export class AIAnalysisModule {}