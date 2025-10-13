import express from 'express';
import MetricsController from '../controllers/MetricsController.js';
import DataQualityController from '../controllers/DataQualityController.js';

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'reports-bi', timestamp: new Date().toISOString() });
});

// Métricas
router.get('/metrics/financeiro', MetricsController.getFinancialMetrics);
router.get('/metrics/presenca', MetricsController.getAttendanceMetrics);
router.get('/metrics/operacional', MetricsController.getOperationalMetrics);
router.get('/metrics/dashboard-geral', MetricsController.getDashboardGeral);

// Qualidade de dados
router.get('/data-quality/report', DataQualityController.getReport);
router.get('/data-quality/history', DataQualityController.getHistory);
router.post('/data-quality/run-check', DataQualityController.runCheck);
router.get('/data-quality/check/:table', DataQualityController.checkTable);

export default router;

