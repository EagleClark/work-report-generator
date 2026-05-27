import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ProjectsService } from './projects.service';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let repository: jest.Mocked<Repository<Project>>;

  const createProject = (overrides: Partial<Project> = {}): Project => ({
    id: 1,
    name: '测试项目',
    description: '这是一个测试项目',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: getRepositoryToken(Project),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    repository = module.get(getRepositoryToken(Project));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a project successfully', async () => {
      const project = createProject();
      const dto: CreateProjectDto = { name: '新项目', description: '项目描述' };
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(project);
      repository.save.mockResolvedValue(project);

      const result = await service.create(dto);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { name: dto.name } });
      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(repository.save).toHaveBeenCalledWith(project);
      expect(result).toEqual(project);
    });

    it('should throw ConflictException when project name already exists', async () => {
      const dto: CreateProjectDto = { name: '新项目' };
      repository.findOne.mockResolvedValue(createProject());

      await expect(service.create(dto)).rejects.toThrow('项目名称已存在');
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all projects ordered by createdAt DESC', async () => {
      const projects = [createProject({ id: 2 }), createProject({ id: 1 })];
      repository.find.mockResolvedValue(projects);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalledWith({ order: { createdAt: 'DESC' } });
      expect(result).toEqual(projects);
    });

    it('should return an empty array when no projects exist', async () => {
      repository.find.mockResolvedValue([]);
      expect(await service.findAll()).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a project when it exists', async () => {
      const project = createProject();
      repository.findOne.mockResolvedValue(project);

      const result = await service.findOne(1);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(project);
    });

    it('should throw NotFoundException when project does not exist', async () => {
      repository.findOne.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow('项目不存在');
    });
  });

  describe('update', () => {
    it('should update both name and description successfully', async () => {
      const existing = createProject();
      const updated = createProject({ name: '新名称', description: '新描述' });
      repository.findOne.mockResolvedValueOnce(existing); // id lookup
      repository.findOne.mockResolvedValueOnce(null); // name conflict check
      repository.save.mockResolvedValue(updated);

      const result = await service.update(1, { name: '新名称', description: '新描述' });

      expect(repository.findOne).toHaveBeenNthCalledWith(1, { where: { id: 1 } });
      expect(repository.findOne).toHaveBeenNthCalledWith(2, { where: { name: '新名称' } });
      expect(result.name).toBe('新名称');
    });

    it('should update only description when name is not provided', async () => {
      const existing = createProject();
      const updated = createProject({ description: '仅更新描述' });
      repository.findOne.mockResolvedValue(existing);
      repository.save.mockResolvedValue(updated);

      const result = await service.update(1, { description: '仅更新描述' });

      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(result.description).toBe('仅更新描述');
    });

    it('should update only name when description is not provided', async () => {
      const existing = createProject();
      const updated = createProject({ name: '仅更新名称' });
      repository.findOne.mockResolvedValueOnce(existing);
      repository.findOne.mockResolvedValueOnce(null);
      repository.save.mockResolvedValue(updated);

      const result = await service.update(1, { name: '仅更新名称' });

      expect(repository.findOne).toHaveBeenCalledTimes(2);
      expect(result.name).toBe('仅更新名称');
    });

    it('should update successfully when name unchanged', async () => {
      const existing = createProject();
      const updated = createProject({ description: '新描述' });
      repository.findOne.mockResolvedValue(existing);
      repository.save.mockResolvedValue(updated);

      const result = await service.update(1, { name: existing.name, description: '新描述' });

      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(result.description).toBe('新描述');
    });

    it('should throw ConflictException when updating to an existing name', async () => {
      repository.findOne.mockResolvedValueOnce(createProject({ id: 1, name: '项目A' }));
      repository.findOne.mockResolvedValueOnce(createProject({ id: 2, name: '已存在的项目名' }));

      await expect(service.update(1, { name: '已存在的项目名' })).rejects.toThrow('项目名称已存在');
    });

    it('should throw NotFoundException when project to update does not exist', async () => {
      repository.findOne.mockResolvedValue(null);
      await expect(service.update(999, {} as UpdateProjectDto)).rejects.toThrow('项目不存在');
    });
  });

  describe('remove', () => {
    it('should remove a project successfully', async () => {
      const project = createProject();
      repository.findOne.mockResolvedValue(project);
      repository.remove.mockResolvedValue(project);

      await service.remove(1);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(repository.remove).toHaveBeenCalledWith(project);
    });

    it('should throw NotFoundException when project to remove does not exist', async () => {
      repository.findOne.mockResolvedValue(null);
      await expect(service.remove(999)).rejects.toThrow('项目不存在');
    });
  });
});
