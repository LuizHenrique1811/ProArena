import { useFinancialMetrics } from '../../hooks/useDashboardData';
import useFilters from '../../hooks/useFilters';
import { useExport } from '../../hooks/useExport';
import LineChartD3 from '../../components/charts/LineChartD3';
import PieChartD3 from '../../components/charts/PieChartD3';
import KPICard from '../../components/charts/KPICard';
import {
  CurrencyDollarIcon,
  ExclamationCircleIcon,
  ClockIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

export default function DashboardFinanceiro() {
  const { startDate, endDate, setPeriodo } = useFilters();
  const { data: financialData, isLoading } = useFinancialMetrics(startDate, endDate);
  const { exportCSV, exportPDF } = useExport();

  const handleExportCSV = () => {
    if (!financialData) return;
    exportCSV(financialData, `financeiro_${startDate}_${endDate}.csv`);
  };

  const handleExportPDF = () => {
    exportPDF('dashboard-financeiro', `dashboard-financeiro_${startDate}_${endDate}.pdf`);
  };

  // Calcular totais
  const latestData = financialData?.[financialData.length - 1];
  const avgMRR = financialData?.reduce((acc, d) => acc + parseFloat(d.mrr), 0) / (financialData?.length || 1);

  // Dados para gráfico de pizza (status de boletos)
  const boletoStatusData = latestData ? [
    { status: 'Pagos', valor: latestData.boletos_pagos },
    { status: 'Pendentes', valor: latestData.boletos_emitidos - latestData.boletos_pagos - latestData.boletos_atrasados },
    { status: 'Atrasados', valor: latestData.boletos_atrasados }
  ] : [];

  return (
    <div className="space-y-6" id="dashboard-financeiro">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Financeiro</h1>
          <p className="mt-2 text-sm text-gray-600">
            Análise detalhada das métricas financeiras e recebimentos
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
          title="MRR Atual"
          value={latestData?.mrr || 0}
          unit="R$"
          icon={CurrencyDollarIcon}
          loading={isLoading}
          trend="positive"
          variation={5.2}
        />
        <KPICard
          title="Inadimplência"
          value={latestData?.inadimplencia_pct || 0}
          unit="%"
          icon={ExclamationCircleIcon}
          loading={isLoading}
          trend="negative"
          variation={-1.5}
        />
        <KPICard
          title="DSO (Dias p/ Receber)"
          value={latestData?.dso_days || 0}
          unit="dias"
          icon={ClockIcon}
          loading={isLoading}
          trend="positive"
          variation={-3.2}
        />
        <KPICard
          title="Taxa de Conversão"
          value={latestData?.conversao_boletos_pct || 0}
          unit="%"
          icon={CurrencyDollarIcon}
          loading={isLoading}
          trend="positive"
          variation={2.8}
        />
      </div>

      {/* Gráficos Principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolução MRR */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Evolução do MRR
          </h2>
          {financialData && financialData.length > 0 ? (
            <LineChartD3
              data={financialData}
              xKey="date"
              yKey="mrr"
              width={500}
              height={300}
              color="#10b981"
            />
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-400">
              {isLoading ? 'Carregando...' : 'Sem dados disponíveis'}
            </div>
          )}
        </div>

        {/* Status dos Boletos */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Status dos Boletos
          </h2>
          {boletoStatusData.length > 0 ? (
            <PieChartD3
              data={boletoStatusData}
              labelKey="status"
              valueKey="valor"
              width={500}
              height={300}
              colors={['#10b981', '#f59e0b', '#ef4444']}
            />
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-400">
              {isLoading ? 'Carregando...' : 'Sem dados disponíveis'}
            </div>
          )}
        </div>
      </div>

      {/* Gráfico de Inadimplência */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Taxa de Inadimplência
        </h2>
        {financialData && financialData.length > 0 ? (
          <LineChartD3
            data={financialData}
            xKey="date"
            yKey="inadimplencia_pct"
            width={1100}
            height={250}
            color="#ef4444"
          />
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-400">
            {isLoading ? 'Carregando...' : 'Sem dados disponíveis'}
          </div>
        )}
      </div>

      {/* Tabela Resumo */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Resumo Financeiro
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              disabled={!financialData}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Exportar CSV
            </button>
            <button
              onClick={handleExportPDF}
              disabled={!financialData}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Exportar PDF
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  MRR
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Boletos Emitidos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Boletos Pagos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Inadimplência
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DSO
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {financialData && financialData.length > 0 ? (
                financialData.slice(-10).reverse().map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(row.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      R$ {parseFloat(row.mrr).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row.boletos_emitidos}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                      {row.boletos_pagos}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      {parseFloat(row.inadimplencia_pct).toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row.dso_days} dias
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    {isLoading ? 'Carregando...' : 'Nenhum dado disponível'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

