import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../services/reportsApi';

export function useDashboardGeral() {
  return useQuery({
    queryKey: ['dashboard-geral'],
    queryFn: () => reportsApi.getDashboardGeral().then(res => res.data.data),
    refetchInterval: 5 * 60 * 1000, // Atualiza a cada 5 minutos
    staleTime: 2 * 60 * 1000 // Considera stale após 2 minutos
  });
}

export function useFinancialMetrics(start, end) {
  return useQuery({
    queryKey: ['financial-metrics', start, end],
    queryFn: () => reportsApi.getFinancialMetrics({ start, end }).then(res => res.data.data),
    enabled: !!(start && end),
    staleTime: 2 * 60 * 1000
  });
}

export function useAttendanceMetrics(filters) {
  return useQuery({
    queryKey: ['attendance-metrics', filters],
    queryFn: () => reportsApi.getAttendanceMetrics(filters).then(res => res.data.data),
    staleTime: 2 * 60 * 1000
  });
}

export function useOperationalMetrics(periodo) {
  return useQuery({
    queryKey: ['operational-metrics', periodo],
    queryFn: () => reportsApi.getOperationalMetrics({ periodo }).then(res => res.data.data),
    staleTime: 2 * 60 * 1000
  });
}

export function useDataQualityReport() {
  return useQuery({
    queryKey: ['data-quality-report'],
    queryFn: () => reportsApi.getDataQualityReport().then(res => res.data.data),
    staleTime: 10 * 60 * 1000 // Atualiza menos frequentemente
  });
}

export function useDataQualityHistory(table, days = 30) {
  return useQuery({
    queryKey: ['data-quality-history', table, days],
    queryFn: () => reportsApi.getDataQualityHistory({ table, days }).then(res => res.data.data),
    enabled: !!table,
    staleTime: 10 * 60 * 1000
  });
}

