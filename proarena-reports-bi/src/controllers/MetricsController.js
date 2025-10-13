import pool from '../config/database.js';
import redisClient from '../config/redis.js';
import Joi from 'joi';

class MetricsController {
  /**
   * GET /api/metrics/financeiro
   */
  async getFinancialMetrics(req, res) {
    try {
      const schema = Joi.object({
        start: Joi.date().iso().required(),
        end: Joi.date().iso().min(Joi.ref('start')).required()
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const { start, end } = value;

      // Tentar cache para dados do dia corrente
      const cacheKey = `metrics:financial:${start}:${end}`;
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return res.json({ source: 'cache', data: JSON.parse(cached) });
      }

      const result = await pool.query(`
        SELECT 
          date,
          mrr,
          inadimplencia_pct,
          conversao_boletos_pct,
          dso_days,
          receita_total,
          boletos_emitidos,
          boletos_pagos,
          boletos_atrasados
        FROM metrics_financial
        WHERE date BETWEEN $1 AND $2
        ORDER BY date ASC
      `, [start, end]);

      // Cache por 5 minutos
      await redisClient.setEx(cacheKey, 300, JSON.stringify(result.rows));

      res.json({ source: 'database', data: result.rows });
    } catch (error) {
      console.error('Erro ao buscar métricas financeiras:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * GET /api/metrics/presenca
   */
  async getAttendanceMetrics(req, res) {
    try {
      const schema = Joi.object({
        turma_id: Joi.number().integer().optional(),
        periodo: Joi.string().valid('semanal', 'mensal', 'trimestral').default('mensal')
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const { turma_id, periodo } = value;

      const periodMap = {
        semanal: 7,
        mensal: 30,
        trimestral: 90
      };

      const days = periodMap[periodo];

      let query = `
        SELECT 
          date,
          turma_id,
          turma_nome,
          frequencia_media,
          aderencia_checkin_pct,
          total_presencas,
          total_aulas,
          alunos_baixa_freq
        FROM metrics_attendance
        WHERE date >= CURRENT_DATE - INTERVAL '${days} days'
      `;

      const params = [];
      if (turma_id) {
        query += ' AND turma_id = $1';
        params.push(turma_id);
      }

      query += ' ORDER BY date DESC, turma_nome ASC';

      const result = await pool.query(query, params);

      res.json({ data: result.rows });
    } catch (error) {
      console.error('Erro ao buscar métricas de presença:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * GET /api/metrics/operacional
   */
  async getOperationalMetrics(req, res) {
    try {
      const schema = Joi.object({
        periodo: Joi.string().valid('semanal', 'mensal', 'trimestral').default('mensal')
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const { periodo } = value;

      const periodMap = {
        semanal: 7,
        mensal: 30,
        trimestral: 90
      };

      const days = periodMap[periodo];

      const result = await pool.query(`
        SELECT 
          date,
          dau,
          mau,
          ocupacao_quadras_pct,
          alunos_ativos,
          alunos_novos,
          professores_ativos,
          turmas_ativas,
          aulas_realizadas
        FROM metrics_operational
        WHERE date >= CURRENT_DATE - INTERVAL '${days} days'
        ORDER BY date DESC
      `);

      res.json({ data: result.rows });
    } catch (error) {
      console.error('Erro ao buscar métricas operacionais:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * GET /api/metrics/dashboard-geral
   */
  async getDashboardGeral(req, res) {
    try {
      // Buscar da materialized view
      const result = await pool.query('SELECT * FROM mv_dashboard_geral');
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Dados não disponíveis' });
      }

      res.json({ data: result.rows[0] });
    } catch (error) {
      console.error('Erro ao buscar dashboard geral:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}

export default new MetricsController();

