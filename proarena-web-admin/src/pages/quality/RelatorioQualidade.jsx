import { useState } from 'react';
import { useDataQualityReport, useDataQualityHistory } from '../../hooks/useDashboardData';
import { reportsApi } from '../../services/reportsApi';
import LineChartD3 from '../../components/charts/LineChartD3';
import {
  ShieldCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

function QualityScoreGauge({ title, score, loading = false }) {
  const getColor = () => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getBgColor = () => {
    if (score >= 90) return 'bg-green-100';
    if (score >= 70) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-24 bg-gray-200 rounded-full w-24 mx-auto mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-sm font-medium text-gray-600 mb-4">{title}</h3>
      <div className={`relative w-24 h-24 rounded-full ${getBgColor()} flex items-center justify-center mx-auto`}>
        <span className={`text-3xl font-bold ${getColor()}`}>
          {score.toFixed(0)}
        </span>
      </div>
      <p className="text-center mt-2 text-xs text-gray-500">
        {score >= 90 ? 'Excelente' : score >= 70 ? 'Bom' : 'Atenção necessária'}
      </p>
    </div>
  );
}

export default function RelatorioQualidade() {
  const { data: qualityReport, isLoading, refetch } = useDataQualityReport();
  const [selectedTable, setSelectedTable] = useState('students');
  const { data: historyData } = useDataQualityHistory(selectedTable, 30);
  const [checking, setChecking] = useState(false);

  const handleRunCheck = async () => {
    setChecking(true);
    try {
      await reportsApi.runDataQualityCheck();
      await refetch();
      alert('Verificação de qualidade executada com sucesso!');
    } catch (error) {
      console.error('Erro ao executar verificação:', error);
      alert('Erro ao executar verificação. Tente novamente.');
    } finally {
      setChecking(false);
    }
  };

  // Calcular score geral
  const overallScore = qualityReport?.reduce((acc, table) => acc + parseFloat(table.overall_score), 0) / (qualityReport?.length || 1);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatório de Qualidade de Dados</h1>
          <p className="mt-2 text-sm text-gray-600">
            Análise de integridade, completude, consistência e acurácia dos dados
          </p>
        </div>
        <button
          onClick={handleRunCheck}
          disabled={checking || isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {checking ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Verificando...
            </>
          ) : (
            <>
              <ClockIcon className="h-4 w-4" />
              Executar Verificação
            </>
          )}
        </button>
      </div>

      {/* Score Geral */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-700 rounded-lg shadow p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Score Geral de Qualidade</h2>
            <p className="mt-2 text-primary-100">
              Média geral de todas as dimensões e tabelas
            </p>
          </div>
          <div className="text-6xl font-bold">
            {overallScore?.toFixed(1) || '--'}
          </div>
        </div>
      </div>

      {/* Gauges por Dimensão */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Dimensões de Qualidade</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <QualityScoreGauge
            title="Integridade"
            score={qualityReport?.[0]?.integrity_score || 0}
            loading={isLoading}
          />
          <QualityScoreGauge
            title="Completude"
            score={qualityReport?.[0]?.completeness_score || 0}
            loading={isLoading}
          />
          <QualityScoreGauge
            title="Consistência"
            score={qualityReport?.[0]?.consistency_score || 0}
            loading={isLoading}
          />
          <QualityScoreGauge
            title="Acurácia"
            score={qualityReport?.[0]?.accuracy_score || 0}
            loading={isLoading}
          />
        </div>
      </div>

      {/* Tabela de Scores por Tabela */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Scores por Tabela do Banco de Dados
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tabela
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Integridade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completude
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Consistência
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acurácia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score Geral
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Anomalias
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {qualityReport && qualityReport.length > 0 ? (
                qualityReport.map((table, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedTable(table.table_name)}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {table.table_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded ${parseFloat(table.integrity_score) >= 90 ? 'bg-green-100 text-green-800' : parseFloat(table.integrity_score) >= 70 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                        {parseFloat(table.integrity_score).toFixed(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded ${parseFloat(table.completeness_score) >= 90 ? 'bg-green-100 text-green-800' : parseFloat(table.completeness_score) >= 70 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                        {parseFloat(table.completeness_score).toFixed(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded ${parseFloat(table.consistency_score) >= 90 ? 'bg-green-100 text-green-800' : parseFloat(table.consistency_score) >= 70 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                        {parseFloat(table.consistency_score).toFixed(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded ${parseFloat(table.accuracy_score) >= 90 ? 'bg-green-100 text-green-800' : parseFloat(table.accuracy_score) >= 70 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                        {parseFloat(table.accuracy_score).toFixed(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                      {parseFloat(table.overall_score).toFixed(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {table.anomalies?.length || 0}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                    {isLoading ? 'Carregando...' : 'Execute uma verificação para ver os resultados'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Evolução Temporal */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Evolução Temporal do Score - {selectedTable}
          </h2>
          <select
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded"
          >
            <option value="students">students</option>
            <option value="responsaveis">responsaveis</option>
            <option value="billing">billing</option>
            <option value="attendance">attendance</option>
            <option value="classes">classes</option>
          </select>
        </div>
        {historyData && historyData.length > 0 ? (
          <LineChartD3
            data={historyData}
            xKey="checked_at"
            yKey="overall_score"
            width={1100}
            height={250}
            color="#8b5cf6"
          />
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-400">
            Sem histórico disponível para esta tabela
          </div>
        )}
      </div>

      {/* Anomalias Detectadas */}
      {qualityReport && qualityReport[0]?.anomalies?.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Anomalias Detectadas
            </h2>
          </div>
          <div className="space-y-3">
            {qualityReport[0].anomalies.slice(0, 5).map((anomaly, idx) => (
              <div key={idx} className="border-l-4 border-yellow-500 pl-4 py-2 bg-yellow-50">
                <p className="text-sm font-medium text-gray-900">
                  {anomaly.type || anomaly.check || 'Anomalia'}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {anomaly.field && `Campo: ${anomaly.field} | `}
                  {anomaly.count || anomaly.issues || anomaly.violations || 0} ocorrências
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer com última verificação */}
      <div className="text-sm text-gray-500 text-center">
        Última verificação: {qualityReport?.[0]?.checked_at 
          ? new Date(qualityReport[0].checked_at).toLocaleString('pt-BR')
          : 'Nunca'}
      </div>
    </div>
  );
}

