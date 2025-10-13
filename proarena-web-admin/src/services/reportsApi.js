import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const reportsApi = {
  // Métricas financeiras
  getFinancialMetrics: (params) => 
    api.get('/metrics/financeiro', { params }),

  // Métricas de presença
  getAttendanceMetrics: (params) => 
    api.get('/metrics/presenca', { params }),

  // Métricas operacionais
  getOperationalMetrics: (params) => 
    api.get('/metrics/operacional', { params }),

  // Dashboard geral
  getDashboardGeral: () => 
    api.get('/metrics/dashboard-geral'),

  // Qualidade de dados
  getDataQualityReport: () => 
    api.get('/data-quality/report'),

  getDataQualityHistory: (params) => 
    api.get('/data-quality/history', { params }),

  runDataQualityCheck: () => 
    api.post('/data-quality/run-check'),

  checkTable: (table) => 
    api.get(`/data-quality/check/${table}`)
};

export default api;

