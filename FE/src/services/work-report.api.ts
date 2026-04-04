import axios from 'axios';
import type { WorkReport, CreateWorkReportDto, UpdateWorkReportDto, QueryWorkReportDto } from '../types/work-report';

const API_BASE = 'http://localhost:3001/api/work-reports';

export const workReportApi = {
  getAll: async (query?: QueryWorkReportDto): Promise<WorkReport[]> => {
    const params = new URLSearchParams();
    if (query?.year) {
      params.append('year', query.year.toString());
    }
    if (query?.weekNumber) {
      params.append('weekNumber', query.weekNumber.toString());
    }
    const url = params.toString() ? `${API_BASE}?${params}` : API_BASE;
    const res = await axios.get<WorkReport[]>(url);
    return res.data;
  },

  getById: async (id: number): Promise<WorkReport> => {
    const res = await axios.get<WorkReport>(`${API_BASE}/${id}`);
    return res.data;
  },

  create: async (dto: CreateWorkReportDto): Promise<WorkReport> => {
    const res = await axios.post<WorkReport>(API_BASE, dto);
    return res.data;
  },

  update: async (id: number, dto: UpdateWorkReportDto): Promise<WorkReport> => {
    const res = await axios.put<WorkReport>(`${API_BASE}/${id}`, dto);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE}/${id}`);
  },
};
