import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

export default function KPICard({ title, value, unit = '', variation, trend = 'neutral', icon: Icon, loading = false }) {
  const formatValue = (val) => {
    if (typeof val === 'number') {
      return val.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
    }
    return val;
  };

  const getTrendColor = () => {
    if (trend === 'positive') return 'text-green-600';
    if (trend === 'negative') return 'text-red-600';
    return 'text-gray-600';
  };

  const getTrendBgColor = () => {
    if (trend === 'positive') return 'bg-green-100';
    if (trend === 'negative') return 'bg-red-100';
    return 'bg-gray-100';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
        </div>
        <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        {Icon && (
          <div className="p-2 bg-primary-100 rounded-full">
            <Icon className="h-6 w-6 text-primary-600" />
          </div>
        )}
      </div>
      
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-gray-900">
          {formatValue(value)}
        </span>
        {unit && (
          <span className="text-sm text-gray-500">{unit}</span>
        )}
      </div>

      {variation !== undefined && variation !== null && (
        <div className="flex items-center gap-1 mt-2">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getTrendBgColor()} ${getTrendColor()}`}>
            {trend === 'positive' && <ArrowUpIcon className="h-3 w-3" />}
            {trend === 'negative' && <ArrowDownIcon className="h-3 w-3" />}
            {Math.abs(variation).toFixed(1)}%
          </span>
          <span className="text-xs text-gray-500">vs período anterior</span>
        </div>
      )}
    </div>
  );
}

