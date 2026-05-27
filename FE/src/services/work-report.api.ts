import api from './api';
import type { WorkReport, CreateWorkReportDto, UpdateWorkReportDto, QueryWorkReportDto } from '../types/work-report';

export const workReportApi = {
  getAll: async (query?: QueryWorkReportDto): Promise<WorkReport[]> => {
    const params = new URLSearchParams();
    if (query?.year) {
      params.append('year', query.year.toString());
    }
    if (query?.weekNumber) {
      params.append('weekNumber', query.weekNumber.toString());
    }
    const url = params.toString() ? `/work-reports?${params}` : '/work-reports';
    const res = await api.get<WorkReport[]>(url);
    return res.data;
  },

  getById: async (id: number): Promise<WorkReport> => {
    const res = await api.get<WorkReport>(`/work-reports/${id}`);
    return res.data;
  },

  create: async (dto: CreateWorkReportDto): Promise<WorkReport> => {
    const res = await api.post<WorkReport>('/work-reports', dto);
    return res.data;
  },

  update: async (id: number, dto: UpdateWorkReportDto): Promise<WorkReport> => {
    const res = await api.put<WorkReport>(`/work-reports/${id}`, dto);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/work-reports/${id}`);
  },
};
