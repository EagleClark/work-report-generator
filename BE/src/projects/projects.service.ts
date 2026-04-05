import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
  ) {}

  async create(createDto: CreateProjectDto): Promise<Project> {
    // 检查项目名是否已存在
    const existing = await this.projectRepository.findOne({
      where: { name: createDto.name },
    });
    if (existing) {
      throw new ConflictException('项目名称已存在');
    }

    const project = this.projectRepository.create(createDto);
    return this.projectRepository.save(project);
  }

  async findAll(): Promise<Project[]> {
    return this.projectRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Project> {
    const project = await this.projectRepository.findOne({ where: { id } });
    if (!project) {
      throw new NotFoundException('项目不存在');
    }
    return project;
  }

  async update(id: number, updateDto: UpdateProjectDto): Promise<Project> {
    const project = await this.findOne(id);

    // 检查项目名是否被其他项目使用
    if (updateDto.name && updateDto.name !== project.name) {
      const existing = await this.projectRepository.findOne({
        where: { name: updateDto.name },
      });
      if (existing) {
        throw new ConflictException('项目名称已存在');
      }
    }

    Object.assign(project, updateDto);
    return this.projectRepository.save(project);
  }

  async remove(id: number): Promise<void> {
    const project = await this.findOne(id);
    await this.projectRepository.remove(project);
  }
}