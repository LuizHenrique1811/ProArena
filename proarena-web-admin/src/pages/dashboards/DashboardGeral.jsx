import { useDashboardGeral, useFinancialMetrics } from '../../hooks/useDashboardData';
import useFilters from '../../hooks/useFilters';
import KPICard from '../../components/charts/KPICard';
import LineChartD3 from '../../components/charts/LineChartD3';
import {
  UsersIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function DashboardGeral() {
  const { data: dashboardData, isLoading: isDashboardLoading } = useDashboardGeral();
  const { startDate, endDate } = useFilters();
  const { data: financialData } = useFinancialMetrics(startDate, endDate);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Geral</h1>
        <p className="mt-2 text-sm text-gray-600">
          Visão geral dos principais indicadores do ProArena
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Alunos Ativos"
          value={dashboardData?.alunos_ativos || 0}
          icon={UsersIcon}
          loading={isDashboardLoading}
          trend="positive"
          variation={5.2}
        />
        <KPICard
          title="Receita do Mês"
          value={dashboardData?.receita_mes || 0}
          unit="R$"
          icon={CurrencyDollarIcon}
          loading={isDashboardLoading}
          trend="positive"
          variation={8.7}
        />
        <KPICard
          title="Taxa de Presença"
          value={dashboardData?.taxa_presenca_media || 0}
          unit="%"
          icon={CheckCircleIcon}
          loading={isDashboardLoading}
          trend="positive"
          variation={2.1}
        />
        <KPICard
          title="Inadimplência"
          value={dashboardData?.inadimplencia_pct || 0}
          unit="%"
          icon={ExclamationTriangleIcon}
          loading={isDashboardLoading}
          trend="negative"
          variation={-1.3}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolução MRR */}
        <div className="bg-white rounded-lg shadow p-6" id="chart-mrr">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Evolução da Receita Recorrente (MRR)
          </h2>
          {financialData && financialData.length > 0 ? (
            <LineChartD3
              data={financialData}
              xKey="date"
              yKey="mrr"
              width={500}
              height={250}
              color="#10b981"
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              Carregando dados...
            </div>
          )}
        </div>

        {/* Conversão de Boletos */}
        <div className="bg-white rounded-lg shadow p-6" id="chart-conversao">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Taxa de Conversão de Boletos
          </h2>
          {financialData && financialData.length > 0 ? (
            <LineChartD3
              data={financialData}
              xKey="date"
              yKey="conversao_boletos_pct"
              width={500}
              height={250}
              color="#0ea5e9"
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              Carregando dados...
            </div>
          )}
        </div>
      </div>

      {/* Resumo de Atividades */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Resumo de Atividades Recentes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border-l-4 border-green-500 pl-4">
            <p className="text-2xl font-bold text-gray-900">12</p>
            <p className="text-sm text-gray-600">Turmas ativas</p>
          </div>
          <div className="border-l-4 border-blue-500 pl-4">
            <p className="text-2xl font-bold text-gray-900">156</p>
            <p className="text-sm text-gray-600">Aulas realizadas este mês</p>
          </div>
          <div className="border-l-4 border-purple-500 pl-4">
            <p className="text-2xl font-bold text-gray-900">5</p>
            <p className="text-sm text-gray-600">Professores ativos</p>
          </div>
        </div>
      </div>

      {/* Última atualização */}
      <div className="text-sm text-gray-500 text-center">
        Última atualização: {dashboardData?.ultima_atualizacao 
          ? new Date(dashboardData.ultima_atualizacao).toLocaleString('pt-BR')
          : 'N/A'}
      </div>
    </div>
  );
}

