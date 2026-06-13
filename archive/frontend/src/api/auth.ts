import { api } from './client';
import { AuthResponse } from '../types';

export const authApi = {
  register: (email: string, password: string, role: 'VIEWER' | 'ARTIST' = 'VIEWER') =>
    api.post<AuthResponse>('/auth/register', { email, password, role }).then((r) => r.data),

  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }).then((r) => r.data),
};
