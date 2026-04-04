import axios from 'axios';
import type { Task, CreateTaskDto, UpdateTaskDto, QueryTaskDto, WeeklySummary } from '../types/task';

const API_BASE = 'http://localhost:3001/api/tasks';

export const taskApi = {
  getAll: async (query?: QueryTaskDto): Promise<Task[]> => {
    const params = new URLSearchParams();
    if (query?.year) params.append('year', query.year.toString());
    if (query?.weekNumber) params.append('weekNumber', query.weekNumber.toString());
    if (query?.project) params.append('project', query.project);
    const url = params.toString() ? `${API_BASE}?${params}` : API_BASE;
    const res = await axios.get<Task[]>(url);
    return res.data;
  },

  getById: async (id: number): Promise<Task> => {
    const res = await axios.get<Task>(`${API_BASE}/${id}`);
    return res.data;
  },

  getWeeklySummary: async (year: number, weekNumber: number): Promise<WeeklySummary> => {
    const res = await axios.get<WeeklySummary>(`${API_BASE}/summary?year=${year}&weekNumber=${weekNumber}`);
    return res.data;
  },

  create: async (dto: CreateTaskDto): Promise<Task> => {
    const res = await axios.post<Task>(API_BASE, dto);
    return res.data;
  },

  update: async (id: number, dto: UpdateTaskDto): Promise<Task> => {
    const res = await axios.put<Task>(`${API_BASE}/${id}`, dto);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE}/${id}`);
  },
};
