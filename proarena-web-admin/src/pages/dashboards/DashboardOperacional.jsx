import { useOperationalMetrics } from '../../hooks/useDashboardData';
import useFilters from '../../hooks/useFilters';
import LineChartD3 from '../../components/charts/LineChartD3';
import BarChartD3 from '../../components/charts/BarChartD3';
import KPICard from '../../components/charts/KPICard';
import {
  UsersIcon,
  UserPlusIcon,
  AcademicCapIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

export default function DashboardOperacional() {
  const { periodo, setPeriodo } = useFilters();
  const { data: operationalData, isLoading } = useOperationalMetrics(periodo);

  // Dados mais recentes
  const latestData = operationalData?.[operationalData.length - 1];
  
  // Calcular DAU/MAU ratio
  const dauMauRatio = latestData ? ((latestData.dau / latestData.mau) * 100).toFixed(1) : 0;

  // Dados de distribuição de alunos por modalidade (mockado - em produção viria da API)
  const distribuicaoModalidades = [
    { modalidade: 'Futebol', alunos: 18 },
    { modalidade: 'Vôlei', alunos: 12 },
    { modalidade: 'Basquete', alunos: 10 },
    { modalidade: 'Natação', alunos: 8 },
    { modalidade: 'Judô', alunos: 2 }
  ];

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Operacional</h1>
          <p className="mt-2 text-sm text-gray-600">
            Métricas de engajamento e gestão operacional
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPeriodo('semanal')}
            className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded"
          >
            Semanal
          </button>
          <button
            onClick={() => setPeriodo('mensal')}
            className="px-3 py-2 text-sm bg-primary-500 text-white rounded"
          >
            Mensal
          </button>
          <button
            onClick={() => setPeriodo('trimestral')}
            className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded"
          >
            Trimestral
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="DAU (Usuários Ativos/Dia)"
          value={latestData?.dau || 0}
          icon={UsersIcon}
          loading={isLoading}
          trend="positive"
          variation={4.2}
        />
        <KPICard
          title="MAU (Usuários Ativos/Mês)"
          value={latestData?.mau || 0}
          icon={UserPlusIcon}
          loading={isLoading}
          trend="positive"
          variation={6.8}
        />
        <KPICard
          title="DAU/MAU Ratio"
          value={dauMauRatio}
          unit="%"
          icon={ChartBarIcon}
          loading={isLoading}
          trend="positive"
          variation={1.5}
        />
        <KPICard
          title="Ocupação de Quadras"
          value={latestData?.ocupacao_quadras_pct || 0}
          unit="%"
          icon={AcademicCapIcon}
          loading={isLoading}
          trend="positive"
          variation={3.1}
        />
      </div>

      {/* Gráficos de Linha - DAU/MAU */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Usuários Ativos Diários (DAU)
          </h2>
          {operationalData && operationalData.length > 0 ? (
            <LineChartD3
              data={operationalData}
              xKey="date"
              yKey="dau"
              width={500}
              height={250}
              color="#0ea5e9"
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              {isLoading ? 'Carregando...' : 'Sem dados disponíveis'}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Usuários Ativos Mensais (MAU)
          </h2>
          {operationalData && operationalData.length > 0 ? (
            <LineChartD3
              data={operationalData}
              xKey="date"
              yKey="mau"
              width={500}
              height={250}
              color="#10b981"
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              {isLoading ? 'Carregando...' : 'Sem dados disponíveis'}
            </div>
          )}
        </div>
      </div>

      {/* Distribuição de Alunos por Modalidade */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Distribuição de Alunos por Modalidade
        </h2>
        <BarChartD3
          data={distribuicaoModalidades}
          xKey="modalidade"
          yKey="alunos"
          width={1100}
          height={300}
          color="#8b5cf6"
          horizontal={false}
        />
      </div>

      {/* Ocupação de Quadras */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Taxa de Ocupação de Quadras
        </h2>
        {operationalData && operationalData.length > 0 ? (
          <LineChartD3
            data={operationalData}
            xKey="date"
            yKey="ocupacao_quadras_pct"
            width={1100}
            height={250}
            color="#f59e0b"
          />
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-400">
            {isLoading ? 'Carregando...' : 'Sem dados disponíveis'}
          </div>
        )}
      </div>

      {/* Resumo de Recursos */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Resumo de Recursos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-900">
                  {latestData?.alunos_ativos || 0}
                </p>
                <p className="text-sm text-blue-600">Alunos Ativos</p>
              </div>
              <UsersIcon className="h-10 w-10 text-blue-400" />
            </div>
            {latestData?.alunos_novos > 0 && (
              <p className="mt-2 text-xs text-blue-600">
                +{latestData.alunos_novos} novos este mês
              </p>
            )}
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-900">
                  {latestData?.professores_ativos || 0}
                </p>
                <p className="text-sm text-green-600">Professores Ativos</p>
              </div>
              <AcademicCapIcon className="h-10 w-10 text-green-400" />
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-purple-900">
                  {latestData?.turmas_ativas || 0}
                </p>
                <p className="text-sm text-purple-600">Turmas Ativas</p>
              </div>
              <ChartBarIcon className="h-10 w-10 text-purple-400" />
            </div>
            {latestData?.aulas_realizadas > 0 && (
              <p className="mt-2 text-xs text-purple-600">
                {latestData.aulas_realizadas} aulas realizadas
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

