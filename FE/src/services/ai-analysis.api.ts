import api from './api';
import type { AIAnalysis, CreateAnalysisDto, QueryAnalysisDto } from '../types/ai-analysis';

const API_BASE = '/ai-analysis';

export const aiAnalysisApi = {
  getAll: async (query?: QueryAnalysisDto): Promise<AIAnalysis[]> => {
    const params = new URLSearchParams();
    if (query?.year) params.append('year', query.year.toString());
    if (query?.weekNumber) params.append('weekNumber', query.weekNumber.toString());
    const url = params.toString() ? `${API_BASE}?${params}` : API_BASE;
    const res = await api.get<AIAnalysis[]>(url);
    return res.data;
  },

  getCurrent: async (year: number, weekNumber: number): Promise<AIAnalysis | null> => {
    const res = await api.get<AIAnalysis | null>(`${API_BASE}/current?year=${year}&weekNumber=${weekNumber}`);
    return res.data;
  },

  generate: async (dto: CreateAnalysisDto): Promise<AIAnalysis> => {
    const res = await api.post<AIAnalysis>(`${API_BASE}/generate`, dto);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`${API_BASE}/${id}`);
  },
};