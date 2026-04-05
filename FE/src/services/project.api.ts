import api from './api';

export interface Project {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectDto {
  name: string;
  description?: string;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
}

export const projectApi = {
  getAll: async (): Promise<Project[]> => {
    const res = await api.get<Project[]>('/projects');
    return res.data;
  },

  getById: async (id: number): Promise<Project> => {
    const res = await api.get<Project>(`/projects/${id}`);
    return res.data;
  },

  create: async (dto: CreateProjectDto): Promise<Project> => {
    const res = await api.post<Project>('/projects', dto);
    return res.data;
  },

  update: async (id: number, dto: UpdateProjectDto): Promise<Project> => {
    const res = await api.put<Project>(`/projects/${id}`, dto);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },
};