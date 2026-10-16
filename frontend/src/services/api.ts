/**
 * ONCOGENIX AI - API Client
 * Axios wrapper connecting React frontend to Django Backend and FastAPI inference services.
 */

import axios from 'axios';
import { AnalysisDetail, AnalysisSummary, ModelInfo, PatientComparison, User } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach auth token if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('oncogenix_token');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

// Handle auth expiration
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if invalid
      localStorage.removeItem('oncogenix_token');
      localStorage.removeItem('oncogenix_user');
    }
    return Promise.reject(error);
  }
);

export const api = {
  // Auth
  login: async (credentials: any) => {
    const res = await apiClient.post('/auth/login/', credentials);
    if (res.data.token) {
      localStorage.setItem('oncogenix_token', res.data.token);
      localStorage.setItem('oncogenix_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  register: async (userData: any) => {
    const res = await apiClient.post('/auth/register/', userData);
    if (res.data.token) {
      localStorage.setItem('oncogenix_token', res.data.token);
      localStorage.setItem('oncogenix_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout/');
    } finally {
      localStorage.removeItem('oncogenix_token');
      localStorage.removeItem('oncogenix_user');
    }
  },

  getMe: async (): Promise<User> => {
    const res = await apiClient.get('/auth/me/');
    return res.data;
  },

  // Dashboard & Analyses
  getDashboard: async () => {
    const res = await apiClient.get('/dashboard/');
    return res.data;
  },

  getAnalyses: async (): Promise<AnalysisSummary[]> => {
    const res = await apiClient.get('/analyses/');
    return res.data;
  },

  getAnalysis: async (id: string): Promise<AnalysisDetail> => {
    const res = await apiClient.get(`/analyses/${id}/`);
    return res.data;
  },

  createAnalysis: async (formData: FormData): Promise<AnalysisDetail> => {
    const res = await apiClient.post('/analyses/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  deleteAnalysis: async (id: string) => {
    const res = await apiClient.delete(`/analyses/${id}/`);
    return res.data;
  },

  downloadReportUrl: (id: string) => `${API_BASE_URL}/analyses/${id}/report/`,

  compareProfiles: async (payload: any): Promise<PatientComparison> => {
    const res = await apiClient.post('/analyses/compare/', payload);
    return res.data;
  },

  // Metadata
  getModelInfo: async (): Promise<ModelInfo> => {
    const res = await apiClient.get('/models/');
    return res.data;
  },

  getDatasetManifest: async () => {
    const res = await apiClient.get('/datasets/');
    return res.data;
  },

  getHealth: async () => {
    const res = await apiClient.get('/health/');
    return res.data;
  },
};
