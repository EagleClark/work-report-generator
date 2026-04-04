import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkReport } from './entities/work-report.entity';
import { CreateWorkReportDto, UpdateWorkReportDto, QueryWorkReportDto } from './dto/work-report.dto';

@Injectable()
export class WorkReportService {
  constructor(
    @InjectRepository(WorkReport)
    private workReportRepository: Repository<WorkReport>,
  ) {}

  async create(createDto: CreateWorkReportDto): Promise<WorkReport> {
    const report = this.workReportRepository.create(createDto);
    return this.workReportRepository.save(report);
  }

  async findAll(query: QueryWorkReportDto): Promise<WorkReport[]> {
    const where: any = {};
    if (query.year) where.year = query.year;
    if (query.weekNumber) where.weekNumber = query.weekNumber;
    
    return this.workReportRepository.find({
      where,
      order: { year: 'DESC', weekNumber: 'DESC' },
    });
  }

  async findOne(id: number): Promise<WorkReport> {
    const report = await this.workReportRepository.findOne({ where: { id } });
    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }
    return report;
  }

  async update(id: number, updateDto: UpdateWorkReportDto): Promise<WorkReport> {
    const report = await this.findOne(id);
    Object.assign(report, updateDto);
    return this.workReportRepository.save(report);
  }

  async remove(id: number): Promise<void> {
    const report = await this.findOne(id);
    await this.workReportRepository.remove(report);
  }
}
