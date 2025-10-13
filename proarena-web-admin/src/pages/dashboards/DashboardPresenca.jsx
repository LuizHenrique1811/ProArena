import { useAttendanceMetrics } from '../../hooks/useDashboardData';
import useFilters from '../../hooks/useFilters';
import HeatMapD3 from '../../components/charts/HeatMapD3';
import BarChartD3 from '../../components/charts/BarChartD3';
import KPICard from '../../components/charts/KPICard';
import {
  CheckCircleIcon,
  UserGroupIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function DashboardPresenca() {
  const { periodo, setPeriodo, turmaId, setTurmaId } = useFilters();
  const { data: attendanceData, isLoading } = useAttendanceMetrics({ periodo, turma_id: turmaId });

  // Calcular métricas agregadas
  const avgFrequencia = attendanceData?.reduce((acc, d) => acc + parseFloat(d.frequencia_media), 0) / (attendanceData?.length || 1);
  const avgAderencia = attendanceData?.reduce((acc, d) => acc + parseFloat(d.aderencia_checkin_pct), 0) / (attendanceData?.length || 1);
  const totalBaixaFreq = attendanceData?.reduce((acc, d) => acc + parseInt(d.alunos_baixa_freq), 0) || 0;

  // Dados para heat map (simular estrutura por dia da semana)
  const heatMapData = attendanceData?.map(d => ({
    turma: d.turma_nome,
    dia_semana: new Date(d.date).toLocaleDateString('pt-BR', { weekday: 'short' }),
    frequencia: d.frequencia_media
  })) || [];

  // Dados para gráfico de barras (comparativo por turma)
  const turmasComparativo = attendanceData?.reduce((acc, d) => {
    const existing = acc.find(item => item.turma === d.turma_nome);
    if (existing) {
      existing.frequencia = (existing.frequencia + parseFloat(d.frequencia_media)) / 2;
    } else {
      acc.push({ turma: d.turma_nome, frequencia: parseFloat(d.frequencia_media) });
    }
    return acc;
  }, []) || [];

  // Alunos com frequência baixa (<75%)
  const alunosBaixaFrequencia = [
    { nome: 'João Silva', frequencia: 68, turma: 'Futebol Infantil A' },
    { nome: 'Maria Santos', frequencia: 72, turma: 'Vôlei Juvenil' },
    { nome: 'Pedro Oliveira', frequencia: 65, turma: 'Basquete Infantil' },
    { nome: 'Ana Costa', frequencia: 70, turma: 'Natação' }
  ]; // Em produção, viria da API

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard de Presença</h1>
          <p className="mt-2 text-sm text-gray-600">
            Análise de frequência e aderência ao check-in
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard
          title="Frequência Média"
          value={avgFrequencia || 0}
          unit="%"
          icon={CheckCircleIcon}
          loading={isLoading}
          trend="positive"
          variation={3.5}
        />
        <KPICard
          title="Aderência ao Check-in"
          value={avgAderencia || 0}
          unit="%"
          icon={UserGroupIcon}
          loading={isLoading}
          trend="positive"
          variation={1.8}
        />
        <KPICard
          title="Alunos com Baixa Frequência"
          value={totalBaixaFreq}
          icon={ExclamationTriangleIcon}
          loading={isLoading}
          trend="negative"
          variation={-2.3}
        />
      </div>

      {/* Heat Map de Frequência */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Mapa de Calor - Frequência por Turma e Dia da Semana
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Identificação visual dos padrões de presença ao longo da semana
        </p>
        {heatMapData.length > 0 ? (
          <HeatMapD3 data={heatMapData} width={1100} height={400} />
        ) : (
          <div className="h-96 flex items-center justify-center text-gray-400">
            {isLoading ? 'Carregando...' : 'Sem dados disponíveis para o período selecionado'}
          </div>
        )}
      </div>

      {/* Comparativo de Frequência por Turma */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Comparativo de Frequência por Turma
        </h2>
        {turmasComparativo.length > 0 ? (
          <BarChartD3
            data={turmasComparativo}
            xKey="turma"
            yKey="frequencia"
            width={1100}
            height={300}
            color="#0ea5e9"
            horizontal={false}
          />
        ) : (
          <div className="h-80 flex items-center justify-center text-gray-400">
            {isLoading ? 'Carregando...' : 'Sem dados disponíveis'}
          </div>
        )}
      </div>

      {/* Alertas - Alunos com Baixa Frequência */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Alertas: Alunos com Frequência Abaixo de 75%
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aluno
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Turma
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Frequência
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {alunosBaixaFrequencia.map((aluno, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {aluno.nome}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {aluno.turma}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded ${aluno.frequencia < 70 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {aluno.frequencia}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                      Crítico
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Indicador de Meta SLO */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
        <div className="flex items-center">
          <CheckCircleIcon className="h-5 w-5 text-blue-500 mr-2" />
          <p className="text-sm text-blue-700">
            <strong>Meta SLO:</strong> Aderência ao check-in ≥ 95% 
            {avgAderencia >= 95 ? (
              <span className="ml-2 text-green-600">✓ Meta atingida!</span>
            ) : (
              <span className="ml-2 text-red-600">⚠ Abaixo da meta</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

