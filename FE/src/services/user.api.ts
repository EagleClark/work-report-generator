import api from './api';
import type { User, CreateUserDto, UpdateUserDto } from '../types/user';

export const userApi = {
  getAll: async (): Promise<User[]> => {
    const res = await api.get<User[]>('/users');
    return res.data;
  },

  getById: async (id: number): Promise<User> => {
    const res = await api.get<User>(`/users/${id}`);
    return res.data;
  },

  create: async (dto: CreateUserDto): Promise<User> => {
    const res = await api.post<User>('/users', dto);
    return res.data;
  },

  update: async (id: number, dto: UpdateUserDto): Promise<User> => {
    const res = await api.put<User>(`/users/${id}`, dto);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};