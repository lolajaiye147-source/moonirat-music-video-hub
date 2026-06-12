import api from './api';

export interface AuthUser {
  id: string;
  email: string;
  role: 'VIEWER' | 'ARTIST';
  createdAt: string;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}

export const authService = {
  async register(email: string, password: string, role: 'VIEWER' | 'ARTIST'): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/register', { email, password, role });
    return data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
    return data;
  },

  async getMe(): Promise<AuthUser> {
    const { data } = await api.get<AuthUser>('/users/me');
    return data;
  },

  saveSession(token: string, user: AuthUser) {
    localStorage.setItem('moonirat_token', token);
    localStorage.setItem('moonirat_user', JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem('moonirat_token');
    localStorage.removeItem('moonirat_user');
  },

  getStoredUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem('moonirat_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  getToken(): string | null {
    return localStorage.getItem('moonirat_token');
  },
};
