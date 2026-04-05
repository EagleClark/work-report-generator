import api from './api';
import type { Task, CreateTaskDto, UpdateTaskDto, QueryTaskDto, WeeklySummary, CopyTaskDto, CopyTaskResult } from '../types/task';

const API_BASE = '/tasks';

export const taskApi = {
  getAll: async (query?: QueryTaskDto): Promise<Task[]> => {
    const params = new URLSearchParams();
    if (query?.year) params.append('year', query.year.toString());
    if (query?.weekNumber) params.append('weekNumber', query.weekNumber.toString());
    if (query?.project) params.append('project', query.project);
    const url = params.toString() ? `${API_BASE}?${params}` : API_BASE;
    const res = await api.get<Task[]>(url);
    return res.data;
  },

  getById: async (id: number): Promise<Task> => {
    const res = await api.get<Task>(`${API_BASE}/${id}`);
    return res.data;
  },

  getWeeklySummary: async (year: number, weekNumber: number): Promise<WeeklySummary> => {
    const res = await api.get<WeeklySummary>(`${API_BASE}/summary?year=${year}&weekNumber=${weekNumber}`);
    return res.data;
  },

  create: async (dto: CreateTaskDto): Promise<Task> => {
    const res = await api.post<Task>(API_BASE, dto);
    return res.data;
  },

  update: async (id: number, dto: UpdateTaskDto): Promise<Task> => {
    const res = await api.put<Task>(`${API_BASE}/${id}`, dto);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`${API_BASE}/${id}`);
  },

  copyIncompleteTasks: async (dto: CopyTaskDto): Promise<CopyTaskResult> => {
    const res = await api.post<CopyTaskResult>(`${API_BASE}/copy`, dto);
    return res.data;
  },
};
