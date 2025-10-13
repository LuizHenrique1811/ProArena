import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardGeral from './pages/dashboards/DashboardGeral';
import DashboardFinanceiro from './pages/dashboards/DashboardFinanceiro';
import DashboardPresenca from './pages/dashboards/DashboardPresenca';
import DashboardOperacional from './pages/dashboards/DashboardOperacional';
import RelatorioQualidade from './pages/quality/RelatorioQualidade';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <h1 className="text-2xl font-bold text-primary-600">ProArena</h1>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <a href="/dashboards/geral" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    Geral
                  </a>
                  <a href="/dashboards/financeiro" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    Financeiro
                  </a>
                  <a href="/dashboards/presenca" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    Presença
                  </a>
                  <a href="/dashboards/operacional" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    Operacional
                  </a>
                  <a href="/qualidade" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    Qualidade
                  </a>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboards/geral" replace />} />
            <Route path="/dashboards/geral" element={<DashboardGeral />} />
            <Route path="/dashboards/financeiro" element={<DashboardFinanceiro />} />
            <Route path="/dashboards/presenca" element={<DashboardPresenca />} />
            <Route path="/dashboards/operacional" element={<DashboardOperacional />} />
            <Route path="/qualidade" element={<RelatorioQualidade />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;

