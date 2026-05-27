import { Test, TestingModule } from '@nestjs/testing';
import { WorkReportController } from './work-report.controller';
import { WorkReportService } from './work-report.service';
import { CreateWorkReportDto, UpdateWorkReportDto } from './dto/work-report.dto';

describe('WorkReportController', () => {
  let controller: WorkReportController;
  let service: Record<string, jest.Mock>;

  const mockWorkReportService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkReportController],
      providers: [
        { provide: WorkReportService, useValue: mockWorkReportService },
      ],
    }).compile();

    controller = module.get<WorkReportController>(WorkReportController);
    service = module.get(WorkReportService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should delegate to workReportService.create', async () => {
      const dto: CreateWorkReportDto = {
        title: 'Report',
        content: 'Content',
        weekNumber: 20,
        year: 2026,
      };
      const report = { id: 1, ...dto, userId: null };
      mockWorkReportService.create.mockResolvedValue(report);

      const result = await controller.create(dto);

      expect(mockWorkReportService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(report);
    });
  });

  describe('findAll', () => {
    it('should delegate to workReportService.findAll with parsed query params', async () => {
      const reports = [{ id: 1, title: 'Report' }];
      mockWorkReportService.findAll.mockResolvedValue(reports);

      const result = await controller.findAll('2026', '20');

      expect(mockWorkReportService.findAll).toHaveBeenCalledWith({
        year: 2026,
        weekNumber: 20,
      });
      expect(result).toEqual(reports);
    });

    it('should handle undefined query params', async () => {
      const reports = [{ id: 1, title: 'Report' }];
      mockWorkReportService.findAll.mockResolvedValue(reports);

      const result = await controller.findAll(undefined, undefined);

      expect(mockWorkReportService.findAll).toHaveBeenCalledWith({});
      expect(result).toEqual(reports);
    });
  });

  describe('findOne', () => {
    it('should delegate to workReportService.findOne with parsed number', async () => {
      const report = { id: 1, title: 'Report' };
      mockWorkReportService.findOne.mockResolvedValue(report);

      const result = await controller.findOne('1');

      expect(mockWorkReportService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(report);
    });
  });

  describe('update', () => {
    it('should delegate to workReportService.update with parsed id', async () => {
      const dto: UpdateWorkReportDto = { title: 'Updated Report' };
      const report = { id: 1, title: 'Updated Report' };
      mockWorkReportService.update.mockResolvedValue(report);

      const result = await controller.update('1', dto);

      expect(mockWorkReportService.update).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(report);
    });
  });

  describe('remove', () => {
    it('should delegate to workReportService.remove with parsed id', async () => {
      mockWorkReportService.remove.mockResolvedValue(undefined);

      const result = await controller.remove('1');

      expect(mockWorkReportService.remove).toHaveBeenCalledWith(1);
      expect(result).toBeUndefined();
    });
  });
});
