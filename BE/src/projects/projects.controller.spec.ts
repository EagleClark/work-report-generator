import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project } from './entities/project.entity';

describe('ProjectsController', () => {
  let controller: ProjectsController;
  let service: jest.Mocked<ProjectsService>;

  const mockProject: Project = {
    id: 1,
    name: '测试项目',
    description: '这是一个测试项目',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  const mockCreateDto: CreateProjectDto = {
    name: '新项目',
    description: '项目描述',
  };

  const mockUpdateDto: UpdateProjectDto = {
    name: '更新后的项目',
    description: '更新后的描述',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        {
          provide: ProjectsService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ProjectsController>(ProjectsController);
    service = module.get(ProjectsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all projects', async () => {
      const projects = [mockProject];
      service.findAll.mockResolvedValue(projects);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalledTimes(1);
      expect(service.findAll).toHaveBeenCalledWith();
      expect(result).toEqual(projects);
    });
  });

  describe('findOne', () => {
    it('should return a project by id', async () => {
      service.findOne.mockResolvedValue(mockProject);

      const result = await controller.findOne(1);

      expect(service.findOne).toHaveBeenCalledTimes(1);
      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockProject);
    });

    it('should pass the id as a number', async () => {
      service.findOne.mockResolvedValue(mockProject);

      await controller.findOne(42);

      expect(service.findOne).toHaveBeenCalledWith(42);
    });
  });

  describe('create', () => {
    it('should create a project', async () => {
      service.create.mockResolvedValue(mockProject);

      const result = await controller.create(mockCreateDto);

      expect(service.create).toHaveBeenCalledTimes(1);
      expect(service.create).toHaveBeenCalledWith(mockCreateDto);
      expect(result).toEqual(mockProject);
    });

    it('should pass the DTO as-is to the service', async () => {
      const dto: CreateProjectDto = { name: '仅名称项目' };
      service.create.mockResolvedValue({ ...mockProject, name: '仅名称项目' });

      await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('update', () => {
    it('should update a project by id', async () => {
      const updatedProject = { ...mockProject, ...mockUpdateDto };
      service.update.mockResolvedValue(updatedProject);

      const result = await controller.update(1, mockUpdateDto);

      expect(service.update).toHaveBeenCalledTimes(1);
      expect(service.update).toHaveBeenCalledWith(1, mockUpdateDto);
      expect(result).toEqual(updatedProject);
    });

    it('should pass the id and DTO correctly', async () => {
      const dto: UpdateProjectDto = { description: '仅描述' };
      service.update.mockResolvedValue({ ...mockProject, description: '仅描述' });

      await controller.update(5, dto);

      expect(service.update).toHaveBeenCalledWith(5, dto);
    });
  });

  describe('remove', () => {
    it('should remove a project by id', async () => {
      service.remove.mockResolvedValue(undefined);

      const result = await controller.remove(1);

      expect(service.remove).toHaveBeenCalledTimes(1);
      expect(service.remove).toHaveBeenCalledWith(1);
      expect(result).toBeUndefined();
    });

    it('should pass the id as a number', async () => {
      service.remove.mockResolvedValue(undefined);

      await controller.remove(10);

      expect(service.remove).toHaveBeenCalledWith(10);
    });
  });
});
