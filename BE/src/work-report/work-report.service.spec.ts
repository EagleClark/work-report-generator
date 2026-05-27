import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WorkReportService } from './work-report.service';
import { WorkReport } from './entities/work-report.entity';
import { CreateWorkReportDto, UpdateWorkReportDto } from './dto/work-report.dto';
import { NotFoundException } from '@nestjs/common';

describe('WorkReportService', () => {
  let service: WorkReportService;
  let repo: Record<string, jest.Mock>;

  const createMockReport = (overrides: Partial<WorkReport> = {}): WorkReport => ({
    id: 1,
    title: 'Weekly Report',
    content: 'Report content',
    weekNumber: 20,
    year: 2026,
    userId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkReportService,
        { provide: getRepositoryToken(WorkReport), useValue: mockRepository },
      ],
    }).compile();

    service = module.get<WorkReportService>(WorkReportService);
    repo = module.get(getRepositoryToken(WorkReport));
  });

  describe('create', () => {
    it('should create a work report', async () => {
      const createDto: CreateWorkReportDto = {
        title: 'New Report',
        content: 'Content',
        weekNumber: 20,
        year: 2026,
      };
      const report = createMockReport({ title: 'New Report', content: 'Content' });
      repo.create.mockReturnValue(report);
      repo.save.mockResolvedValue(report);

      const result = await service.create(createDto);

      expect(repo.create).toHaveBeenCalledWith(createDto);
      expect(repo.save).toHaveBeenCalledWith(report);
      expect(result).toEqual(report);
    });
  });

  describe('findAll', () => {
    it('should return all reports without filters', async () => {
      const reports = [createMockReport()];
      repo.find.mockResolvedValue(reports);

      const result = await service.findAll({});

      expect(repo.find).toHaveBeenCalledWith({
        where: {},
        order: { year: 'DESC', weekNumber: 'DESC' },
      });
      expect(result).toEqual(reports);
    });

    it('should filter by year and weekNumber', async () => {
      const reports = [createMockReport()];
      repo.find.mockResolvedValue(reports);

      const result = await service.findAll({ year: 2026, weekNumber: 20 });

      expect(repo.find).toHaveBeenCalledWith({
        where: { year: 2026, weekNumber: 20 },
        order: { year: 'DESC', weekNumber: 'DESC' },
      });
      expect(result).toEqual(reports);
    });
  });

  describe('findOne', () => {
    it('should return a report by id when found', async () => {
      const report = createMockReport();
      repo.findOne.mockResolvedValue(report);

      const result = await service.findOne(1);

      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(report);
    });

    it('should throw NotFoundException when report does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('Report with ID 999 not found');
    });
  });

  describe('update', () => {
    it('should update a report', async () => {
      const report = createMockReport();
      repo.findOne.mockResolvedValue(report);
      const updated = { ...report, title: 'Updated Title' };
      repo.save.mockResolvedValue(updated);

      const result = await service.update(1, { title: 'Updated Title' });

      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Updated Title' }),
      );
      expect(result.title).toBe('Updated Title');
    });

    it('should throw NotFoundException when updating non-existent report', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(
        service.update(999, { title: 'Nope' } as UpdateWorkReportDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a report', async () => {
      const report = createMockReport();
      repo.findOne.mockResolvedValue(report);
      repo.remove.mockResolvedValue(report);

      await service.remove(1);

      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(repo.remove).toHaveBeenCalledWith(report);
    });

    it('should throw NotFoundException when removing non-existent report', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
