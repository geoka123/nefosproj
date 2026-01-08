import axios, { AxiosError } from 'axios';
import type { AxiosInstance } from 'axios';

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const TEAM_API_BASE_URL = import.meta.env.VITE_TEAM_API_URL || 'http://localhost:8001';
export const TASK_API_BASE_URL = import.meta.env.VITE_TASK_API_URL || 'http://localhost:8002';

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  role_display: string;
  date_joined: string;
  is_active: boolean;
}

export interface AuthResponse {
  user: User;
  tokens: {
    access: string;
    refresh: string;
  };
  message?: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

// Token management
export const tokenStorage = {
  getAccessToken: (): string | null => {
    return localStorage.getItem('access_token');
  },
  getRefreshToken: (): string | null => {
    return localStorage.getItem('refresh_token');
  },
  setTokens: (access: string, refresh: string): void => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
  },
  clearTokens: (): void => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },
  setUser: (user: User): void => {
    localStorage.setItem('user', JSON.stringify(user));
  },
  getUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
};

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config: any) => {
    const token = tokenStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: any) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = tokenStorage.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post<{ access: string }>(
          `${API_BASE_URL}/api/auth/token/refresh/`,
          { refresh: refreshToken }
        );

        const { access } = response.data;
        const currentRefresh = tokenStorage.getRefreshToken();
        if (currentRefresh) {
          tokenStorage.setTokens(access, currentRefresh);
        }

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        tokenStorage.clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    const errorMessage =
      (error.response?.data as any)?.detail ||
      (error.response?.data as any)?.message ||
      error.message ||
      'An error occurred';

    return Promise.reject(new Error(errorMessage));
  }
);

// Auth API functions
export const authAPI = {
  signup: async (
    email: string,
    password: string,
    password2: string,
    firstName?: string,
    lastName?: string
  ): Promise<AuthResponse> => {
    const payload: Record<string, string> = {
      email,
      password,
      password2,
    };
    
    // Only include first_name and last_name if they have values
    if (firstName && firstName.trim()) {
      payload.first_name = firstName.trim();
    }
    if (lastName && lastName.trim()) {
      payload.last_name = lastName.trim();
    }
    
    const response = await apiClient.post<AuthResponse>('/api/auth/signup/', payload);

    // Store tokens and user
    if (response.data.tokens) {
      tokenStorage.setTokens(
        response.data.tokens.access,
        response.data.tokens.refresh
      );
      tokenStorage.setUser(response.data.user);
    }

    return response.data;
  },

  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/api/auth/login/', {
      email,
      password,
    });

    // Store tokens and user
    tokenStorage.setTokens(response.data.access, response.data.refresh);
    tokenStorage.setUser(response.data.user);

    return response.data;
  },

  logout: (): void => {
    tokenStorage.clearTokens();
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>('/api/auth/me/');
    return response.data;
  },

  refreshToken: async (): Promise<{ access: string }> => {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post<{ access: string }>(
      '/api/auth/token/refresh/',
      { refresh: refreshToken }
    );

    // Update access token
    const currentRefresh = tokenStorage.getRefreshToken();
    if (currentRefresh) {
      tokenStorage.setTokens(response.data.access, currentRefresh);
    }

    return response.data;
  },

  getAllUsers: async (): Promise<User[]> => {
    const response = await apiClient.get<User[]>('/api/auth/users/');
    return response.data;
  },

  getUsersByIds: async (userIds: number[]): Promise<User[]> => {
    const response = await apiClient.post<User[]>('/api/auth/users/by-ids/', {
      user_ids: userIds,
    });
    return response.data;
  },

  updateUserRole: async (userId: number, role: string): Promise<{ role: string }> => {
    const response = await apiClient.put<{ role: string }>(
      `/api/auth/users/${userId}/role/`,
      { role }
    );
    return response.data;
  },

  activateDeactivateUser: async (userId: number): Promise<{ is_active: boolean }> => {
    const response = await apiClient.put<{ is_active: boolean }>(
      `/api/auth/users/${userId}/activate/`
    );
    return response.data;
  },

  deleteUser: async (userId: number): Promise<void> => {
    await apiClient.delete(`/api/auth/users/${userId}/delete/`);
  },
};

// Team API interface
export interface Team {
  id: number;
  name: string;
  number_of_members: number;
  leader_full_name: string | null;
}

// Team Details API interface
export interface TeamMember {
  user_id: number;
  user_full_name: string;
  role: string;
}

export interface TeamDetails {
  id: number;
  name: string;
  description: string;
  members: TeamMember[];
}

// Create a separate axios instance for teamservice
const teamApiClient: AxiosInstance = axios.create({
  baseURL: TEAM_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token for teamservice
teamApiClient.interceptors.request.use(
  (config: any) => {
    const token = tokenStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling (same as apiClient)
teamApiClient.interceptors.response.use(
  (response: any) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = tokenStorage.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post<{ access: string }>(
          `${API_BASE_URL}/api/auth/token/refresh/`,
          { refresh: refreshToken }
        );

        const { access } = response.data;
        const currentRefresh = tokenStorage.getRefreshToken();
        if (currentRefresh) {
          tokenStorage.setTokens(access, currentRefresh);
        }

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return teamApiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        tokenStorage.clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    const errorMessage =
      (error.response?.data as any)?.detail ||
      (error.response?.data as any)?.message ||
      error.message ||
      'An error occurred';

    return Promise.reject(new Error(errorMessage));
  }
);

// Teams API functions
export const teamsAPI = {
  listTeams: async (): Promise<Team[]> => {
    const response = await teamApiClient.get<Team[]>('/api/teams/');
    return response.data;
  },

  createTeam: async (name: string, description: string, fullName: string, leaderId: number): Promise<void> => {
    await teamApiClient.post('/api/teams/create', {
      name,
      description,
      full_name: fullName,
      leader_id: leaderId,
    });
  },

  getTeamDetails: async (teamId: number): Promise<TeamDetails> => {
    const response = await teamApiClient.get<TeamDetails>(`/api/teams/${teamId}/`);
    return response.data;
  },

  updateTeam: async (teamId: number, name: string, description: string, fullName?: string, leaderId?: number): Promise<void> => {
    const payload: { name: string; description: string; full_name?: string; leader_id?: number } = {
      name,
      description,
    };
    
    if (leaderId !== undefined && fullName) {
      payload.full_name = fullName;
      payload.leader_id = leaderId;
    }
    
    await teamApiClient.put(`/api/teams/update/${teamId}`, payload);
  },

  addMember: async (teamId: number, memberId: number, memberFullName: string): Promise<void> => {
    await teamApiClient.put(`/api/teams/add-member/${teamId}`, {
      member_id: memberId,
      member_full_name: memberFullName,
    });
  },

  removeMember: async (teamId: number, memberId: number): Promise<void> => {
    await teamApiClient.put(`/api/teams/remove-member/${teamId}`, {
      member_id: memberId,
    });
  },

  deleteTeam: async (teamId: number): Promise<void> => {
    await teamApiClient.delete(`/api/teams/delete/${teamId}`);
  },
};

// Task API interfaces
export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  due_date: string;
  created_by_user_id: number;
  assigned_to_user_id: number;
  team_id: number;
  created_at: string;
}

export interface TaskComment {
  id: string;
  text: string;
  task_id: string;
  created_by_user_id: number;
  created_at: string;
}

export interface TaskFile {
  id: string;
  file: string;
  task_id: string;
  uploaded_by_user_id: number;
  uploaded_at: string;
}

export interface CommentFile {
  id: string;
  file: string;
  comment_id: string;
  uploaded_by_user_id: number;
  uploaded_at: string;
}

export interface TaskComment {
  id: string;
  text: string;
  task_id: string;
  created_by_user_id: number;
  created_at: string;
  files?: CommentFile[];
}

export interface TaskDetails extends Task {
  comments: TaskComment[];
  files: TaskFile[];
}

// Create a separate axios instance for taskservice
const taskApiClient: AxiosInstance = axios.create({
  baseURL: TASK_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token for taskservice
taskApiClient.interceptors.request.use(
  (config: any) => {
    const token = tokenStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling (same as apiClient)
taskApiClient.interceptors.response.use(
  (response: any) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = tokenStorage.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post<{ access: string }>(
          `${API_BASE_URL}/api/auth/token/refresh/`,
          { refresh: refreshToken }
        );

        const { access } = response.data;
        const currentRefresh = tokenStorage.getRefreshToken();
        if (currentRefresh) {
          tokenStorage.setTokens(access, currentRefresh);
        }

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return taskApiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        tokenStorage.clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    const errorMessage =
      (error.response?.data as any)?.detail ||
      (error.response?.data as any)?.message ||
      error.message ||
      'An error occurred';

    return Promise.reject(new Error(errorMessage));
  }
);

// Tasks API functions
export const tasksAPI = {
  listTasks: async (params?: {
    team_id?: number;
    assigned_to_user_id?: number;
    status?: string;
    due_date_from?: string;
    due_date_to?: string;
  }): Promise<Task[]> => {
    const response = await taskApiClient.get<Task[]>('/api/tasks/tasks/', { params });
    return response.data;
  },

  createTask: async (taskData: {
    title: string;
    description: string;
    assigned_to_user_id: number;
    team_id: number;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    due_date: string;
    status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
  }): Promise<Task> => {
    const response = await taskApiClient.post<Task>('/api/tasks/tasks/create/', taskData);
    return response.data;
  },

  createTaskWithFiles: async (taskData: {
    title: string;
    description: string;
    assigned_to_user_id: number;
    team_id: number;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    due_date: string;
    status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
  }, files: File[]): Promise<Task> => {
    const formData = new FormData();
    
    // Add task fields to FormData
    formData.append('title', taskData.title);
    formData.append('description', taskData.description);
    formData.append('assigned_to_user_id', taskData.assigned_to_user_id.toString());
    formData.append('team_id', taskData.team_id.toString());
    formData.append('priority', taskData.priority || 'MEDIUM');
    formData.append('due_date', taskData.due_date);
    formData.append('status', taskData.status || 'TODO');
    
    // Add files to FormData
    files.forEach((file) => {
      formData.append('files', file);
    });
    
    const response = await taskApiClient.post<Task>('/api/tasks/tasks/create/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getTaskDetails: async (taskId: string): Promise<TaskDetails> => {
    const response = await taskApiClient.get<TaskDetails>(`/api/tasks/tasks/${taskId}/`);
    return response.data;
  },

  updateTask: async (taskId: string, taskData: {
    title?: string;
    description?: string;
    assigned_to_user_id?: number;
    status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    due_date?: string;
  }): Promise<Task> => {
    const response = await taskApiClient.put<Task>(`/api/tasks/tasks/${taskId}/update/`, taskData);
    return response.data;
  },

  deleteTask: async (taskId: string): Promise<void> => {
    await taskApiClient.delete(`/api/tasks/tasks/${taskId}/delete/`);
  },

  updateTaskStatus: async (taskId: string, status: 'TODO' | 'IN_PROGRESS' | 'DONE'): Promise<Task> => {
    const response = await taskApiClient.patch<Task>(`/api/tasks/tasks/${taskId}/status/`, { status });
    return response.data;
  },

  addComment: async (taskId: string, text: string, files?: File[]): Promise<TaskComment> => {
    if (files && files.length > 0) {
      const formData = new FormData();
      formData.append('text', text);
      files.forEach((file) => {
        formData.append('files', file);
      });
      const response = await taskApiClient.post<TaskComment>(`/api/tasks/tasks/${taskId}/comments/add/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } else {
      const response = await taskApiClient.post<TaskComment>(`/api/tasks/tasks/${taskId}/comments/add/`, { text });
      return response.data;
    }
  },

  listComments: async (taskId: string): Promise<TaskComment[]> => {
    const response = await taskApiClient.get<TaskComment[]>(`/api/tasks/tasks/${taskId}/comments/`);
    return response.data;
  },

  attachFile: async (taskId: string, file: string): Promise<TaskFile> => {
    const response = await taskApiClient.post<TaskFile>(`/api/tasks/tasks/${taskId}/files/attach/`, { file });
    return response.data;
  },

  attachFiles: async (taskId: string, files: File[]): Promise<TaskFile[]> => {
    const formData = new FormData();
    
    // Add files to FormData
    files.forEach((file) => {
      formData.append('files', file);
    });
    
    const response = await taskApiClient.post<TaskFile[]>(`/api/tasks/tasks/${taskId}/files/attach/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  listFiles: async (taskId: string): Promise<TaskFile[]> => {
    const response = await taskApiClient.get<TaskFile[]>(`/api/tasks/tasks/${taskId}/files/`);
    return response.data;
  },

  getFileUrl: (taskId: string, fileId: string, download: boolean = false): string => {
    const downloadParam = download ? '?download=true' : '';
    return `/api/tasks/tasks/${taskId}/files/${fileId}/${downloadParam}`;
  },

  downloadFile: async (taskId: string, fileId: string, download: boolean = false): Promise<Blob> => {
    const downloadParam = download ? '?download=true' : '';
    const response = await taskApiClient.get(
      `/api/tasks/tasks/${taskId}/files/${fileId}/${downloadParam}`,
      { responseType: 'blob' }
    );
    return response.data;
  },

  deleteFile: async (taskId: string, fileId: string): Promise<void> => {
    await taskApiClient.delete(`/api/tasks/tasks/${taskId}/files/${fileId}/delete/`);
  },

  // Comment Files
  attachCommentFiles: async (taskId: string, commentId: string, files: File[]): Promise<CommentFile[]> => {
    const formData = new FormData();
    
    // Add files to FormData
    files.forEach((file) => {
      formData.append('files', file);
    });
    
    const response = await taskApiClient.post<CommentFile[]>(`/api/tasks/tasks/${taskId}/comments/${commentId}/files/attach/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  downloadCommentFile: async (taskId: string, commentId: string, fileId: string, download: boolean = false): Promise<Blob> => {
    const downloadParam = download ? '?download=true' : '';
    const response = await taskApiClient.get(
      `/api/tasks/tasks/${taskId}/comments/${commentId}/files/${fileId}/${downloadParam}`,
      { responseType: 'blob' }
    );
    return response.data;
  },

  getCommentFileUrl: (taskId: string, commentId: string, fileId: string, download: boolean = false): string => {
    const downloadParam = download ? '?download=true' : '';
    return `/api/tasks/tasks/${taskId}/comments/${commentId}/files/${fileId}/${downloadParam}`;
  },

  deleteComment: async (taskId: string, commentId: string): Promise<void> => {
    await taskApiClient.delete(`/api/tasks/tasks/${taskId}/comments/${commentId}/delete/`);
  },

  deleteCommentFile: async (taskId: string, commentId: string, fileId: string): Promise<void> => {
    await taskApiClient.delete(`/api/tasks/tasks/${taskId}/comments/${commentId}/files/${fileId}/delete/`);
  },
};
