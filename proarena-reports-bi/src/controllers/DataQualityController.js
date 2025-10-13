import DataQualityService from '../services/DataQualityService.js';
import Joi from 'joi';

class DataQualityController {
  /**
   * GET /api/data-quality/report
   */
  async getReport(req, res) {
    try {
      const report = await DataQualityService.getReport();
      res.json({ data: report });
    } catch (error) {
      console.error('Erro ao buscar relatório de qualidade:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * GET /api/data-quality/history
   */
  async getHistory(req, res) {
    try {
      const schema = Joi.object({
        table: Joi.string().required(),
        days: Joi.number().integer().min(1).max(90).default(30)
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const { table, days } = value;

      const history = await DataQualityService.getHistory(table, days);
      res.json({ data: history });
    } catch (error) {
      console.error('Erro ao buscar histórico de qualidade:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * POST /api/data-quality/run-check
   */
  async runCheck(req, res) {
    try {
      // Executar verificação completa de forma assíncrona
      const results = await DataQualityService.runFullCheck();
      res.json({ 
        message: 'Verificação executada com sucesso',
        results 
      });
    } catch (error) {
      console.error('Erro ao executar verificação de qualidade:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * GET /api/data-quality/check/:table
   */
  async checkTable(req, res) {
    try {
      const { table } = req.params;

      const integrity = await DataQualityService.checkIntegrity(table);
      const completeness = await DataQualityService.checkCompleteness(table);
      const consistency = await DataQualityService.checkConsistency(table);
      const accuracy = await DataQualityService.checkAccuracy(table);

      const overallScore = (
        integrity.score + 
        completeness.score + 
        consistency.score + 
        accuracy.score
      ) / 4;

      res.json({
        table,
        integrity,
        completeness,
        consistency,
        accuracy,
        overall_score: parseFloat(overallScore.toFixed(2))
      });
    } catch (error) {
      console.error(`Erro ao verificar tabela ${req.params.table}:`, error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}

export default new DataQualityController();

