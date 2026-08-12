import type { ApiResponse, User } from '@qit/shared';
import api from '@/lib/axios';

export interface PublicUser {
  id: number;
  username: string;
  role: 'supervisor' | 'admin';
  createdAt: string;
}

export const userService = {
  async listAll(): Promise<PublicUser[]> {
    const res = await api.get<ApiResponse<PublicUser[]>>('/users');
    if (!res.data.success || !res.data.data) throw new Error(res.data.error ?? 'Failed to load users');
    return res.data.data;
  },

  async updateUsername(username: string): Promise<User> {
    const res = await api.put<ApiResponse<User>>('/users/me', { username });
    if (!res.data.success || !res.data.data) throw new Error(res.data.error ?? 'Failed to update username');
    return res.data.data;
  },

  async updateRole(userId: number, role: 'supervisor' | 'admin'): Promise<User> {
    const res = await api.put<ApiResponse<User>>(`/users/${userId}/role`, { role });
    if (!res.data.success || !res.data.data) throw new Error(res.data.error ?? 'Failed to update role');
    return res.data.data;
  },
};
