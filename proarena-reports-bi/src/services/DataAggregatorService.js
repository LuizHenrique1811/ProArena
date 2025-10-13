import pool from '../config/database.js';
import redisClient from '../config/redis.js';

class DataAggregatorService {
  /**
   * Agrega métricas financeiras diárias
   */
  async aggregateFinancialMetrics(date = new Date()) {
    try {
      const dateStr = date.toISOString().split('T')[0];
      
      // Calcular MRR (Monthly Recurring Revenue)
      const mrrQuery = await pool.query(`
        SELECT COALESCE(SUM(valor), 0) as mrr
        FROM boletos
        WHERE status = 'pago'
          AND DATE_TRUNC('month', data_pagamento) = DATE_TRUNC('month', $1::date)
      `, [dateStr]);

      // Calcular inadimplência
      const inadimplenciaQuery = await pool.query(`
        SELECT 
          COUNT(*) FILTER (WHERE vencimento < CURRENT_DATE AND status != 'pago') as atrasados,
          COUNT(*) as total
        FROM boletos
        WHERE vencimento <= $1::date
      `, [dateStr]);

      const inadimplenciaPct = inadimplenciaQuery.rows[0].total > 0
        ? (inadimplenciaQuery.rows[0].atrasados / inadimplenciaQuery.rows[0].total * 100)
        : 0;

      // Calcular conversão de boletos
      const conversaoQuery = await pool.query(`
        SELECT 
          COUNT(*) FILTER (WHERE status = 'pago') as pagos,
          COUNT(*) as emitidos
        FROM boletos
        WHERE DATE(created_at) = $1::date
      `, [dateStr]);

      const conversaoPct = conversaoQuery.rows[0].emitidos > 0
        ? (conversaoQuery.rows[0].pagos / conversaoQuery.rows[0].emitidos * 100)
        : 0;

      // Calcular DSO (Days Sales Outstanding)
      const dsoQuery = await pool.query(`
        SELECT AVG(EXTRACT(DAY FROM (data_pagamento - created_at))) as dso
        FROM boletos
        WHERE status = 'pago'
          AND data_pagamento >= $1::date - INTERVAL '30 days'
      `, [dateStr]);

      const dso = Math.round(dsoQuery.rows[0].dso || 0);

      // Inserir ou atualizar métricas
      await pool.query(`
        INSERT INTO metrics_financial (
          date, mrr, inadimplencia_pct, conversao_boletos_pct, dso_days,
          boletos_emitidos, boletos_pagos, boletos_atrasados
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (date) DO UPDATE SET
          mrr = EXCLUDED.mrr,
          inadimplencia_pct = EXCLUDED.inadimplencia_pct,
          conversao_boletos_pct = EXCLUDED.conversao_boletos_pct,
          dso_days = EXCLUDED.dso_days,
          boletos_emitidos = EXCLUDED.boletos_emitidos,
          boletos_pagos = EXCLUDED.boletos_pagos,
          boletos_atrasados = EXCLUDED.boletos_atrasados,
          updated_at = now()
      `, [
        dateStr,
        mrrQuery.rows[0].mrr,
        inadimplenciaPct.toFixed(2),
        conversaoPct.toFixed(2),
        dso,
        conversaoQuery.rows[0].emitidos,
        conversaoQuery.rows[0].pagos,
        inadimplenciaQuery.rows[0].atrasados
      ]);

      // Invalidar cache
      await redisClient.del('metrics:financial:latest');

      console.log(`✅ Métricas financeiras agregadas para ${dateStr}`);
      return { success: true, date: dateStr };
    } catch (error) {
      console.error('Erro ao agregar métricas financeiras:', error);
      throw error;
    }
  }

  /**
   * Agrega métricas de presença por turma
   */
  async aggregateAttendanceMetrics(date = new Date()) {
    try {
      const dateStr = date.toISOString().split('T')[0];

      const turmasQuery = await pool.query(`
        SELECT DISTINCT t.id, t.nome
        FROM turmas t
        WHERE t.ativa = true
      `);

      for (const turma of turmasQuery.rows) {
        // Calcular frequência média
        const frequenciaQuery = await pool.query(`
          SELECT 
            COUNT(DISTINCT p.aluno_id) as alunos_presentes,
            COUNT(DISTINCT m.aluno_id) as total_alunos,
            COUNT(DISTINCT a.id) as total_aulas
          FROM aulas a
          LEFT JOIN presencas p ON p.aula_id = a.id AND DATE(p.created_at) = $1::date
          LEFT JOIN matriculas m ON m.turma_id = a.turma_id AND m.ativa = true
          WHERE a.turma_id = $2
            AND DATE(a.data_hora) = $1::date
        `, [dateStr, turma.id]);

        const row = frequenciaQuery.rows[0];
        const frequenciaMedia = row.total_alunos > 0
          ? (row.alunos_presentes / row.total_alunos * 100)
          : 0;

        // Calcular aderência ao check-in (aulas com pelo menos 1 presença marcada)
        const aderenciaQuery = await pool.query(`
          SELECT 
            COUNT(DISTINCT a.id) FILTER (WHERE p.id IS NOT NULL) as aulas_com_presenca,
            COUNT(DISTINCT a.id) as total_aulas
          FROM aulas a
          LEFT JOIN presencas p ON p.aula_id = a.id
          WHERE a.turma_id = $1
            AND DATE(a.data_hora) = $2::date
        `, [turma.id, dateStr]);

        const aderenciaRow = aderenciaQuery.rows[0];
        const aderenciaPct = aderenciaRow.total_aulas > 0
          ? (aderenciaRow.aulas_com_presenca / aderenciaRow.total_aulas * 100)
          : 0;

        // Alunos com baixa frequência (<75%)
        const baixaFreqQuery = await pool.query(`
          SELECT COUNT(DISTINCT aluno_id) as count
          FROM (
            SELECT 
              m.aluno_id,
              COUNT(p.id)::float / COUNT(DISTINCT a.id) as freq
            FROM matriculas m
            JOIN aulas a ON a.turma_id = m.turma_id
            LEFT JOIN presencas p ON p.aluno_id = m.aluno_id AND p.aula_id = a.id
            WHERE m.turma_id = $1
              AND DATE(a.data_hora) >= $2::date - INTERVAL '30 days'
              AND m.ativa = true
            GROUP BY m.aluno_id
            HAVING COUNT(p.id)::float / COUNT(DISTINCT a.id) < 0.75
          ) sub
        `, [turma.id, dateStr]);

        await pool.query(`
          INSERT INTO metrics_attendance (
            date, turma_id, turma_nome, frequencia_media, aderencia_checkin_pct,
            total_presencas, total_aulas, alunos_baixa_freq
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (date, turma_id) DO UPDATE SET
            frequencia_media = EXCLUDED.frequencia_media,
            aderencia_checkin_pct = EXCLUDED.aderencia_checkin_pct,
            total_presencas = EXCLUDED.total_presencas,
            total_aulas = EXCLUDED.total_aulas,
            alunos_baixa_freq = EXCLUDED.alunos_baixa_freq,
            updated_at = now()
        `, [
          dateStr,
          turma.id,
          turma.nome,
          frequenciaMedia.toFixed(2),
          aderenciaPct.toFixed(2),
          row.alunos_presentes,
          row.total_aulas,
          baixaFreqQuery.rows[0].count
        ]);
      }

      // Invalidar cache
      await redisClient.del('metrics:attendance:latest');

      console.log(`✅ Métricas de presença agregadas para ${dateStr}`);
      return { success: true, date: dateStr };
    } catch (error) {
      console.error('Erro ao agregar métricas de presença:', error);
      throw error;
    }
  }

  /**
   * Agrega métricas operacionais
   */
  async aggregateOperationalMetrics(date = new Date()) {
    try {
      const dateStr = date.toISOString().split('T')[0];

      // DAU (Daily Active Users) - usuários que fizeram login no dia
      const dauQuery = await pool.query(`
        SELECT COUNT(DISTINCT user_id) as dau
        FROM audit_logs
        WHERE DATE(created_at) = $1::date
          AND action IN ('login', 'api_call', 'page_view')
      `, [dateStr]);

      // MAU (Monthly Active Users)
      const mauQuery = await pool.query(`
        SELECT COUNT(DISTINCT user_id) as mau
        FROM audit_logs
        WHERE DATE(created_at) >= DATE_TRUNC('month', $1::date)
          AND DATE(created_at) <= $1::date
          AND action IN ('login', 'api_call', 'page_view')
      `, [dateStr]);

      // Alunos ativos
      const alunosQuery = await pool.query(`
        SELECT COUNT(*) as ativos
        FROM students
        WHERE ativo = true
      `);

      // Professores ativos
      const professoresQuery = await pool.query(`
        SELECT COUNT(*) as ativos
        FROM professores
        WHERE ativo = true
      `);

      // Turmas ativas
      const turmasQuery = await pool.query(`
        SELECT COUNT(*) as ativas
        FROM turmas
        WHERE ativa = true
      `);

      // Ocupação de quadras (% de slots ocupados)
      const ocupacaoQuery = await pool.query(`
        SELECT 
          COUNT(*) FILTER (WHERE status = 'ocupado') as ocupados,
          COUNT(*) as total_slots
        FROM agendamentos
        WHERE DATE(data_hora) = $1::date
      `, [dateStr]);

      const ocupacaoPct = ocupacaoQuery.rows[0].total_slots > 0
        ? (ocupacaoQuery.rows[0].ocupados / ocupacaoQuery.rows[0].total_slots * 100)
        : 0;

      await pool.query(`
        INSERT INTO metrics_operational (
          date, dau, mau, ocupacao_quadras_pct, alunos_ativos,
          professores_ativos, turmas_ativas
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (date) DO UPDATE SET
          dau = EXCLUDED.dau,
          mau = EXCLUDED.mau,
          ocupacao_quadras_pct = EXCLUDED.ocupacao_quadras_pct,
          alunos_ativos = EXCLUDED.alunos_ativos,
          professores_ativos = EXCLUDED.professores_ativos,
          turmas_ativas = EXCLUDED.turmas_ativas,
          updated_at = now()
      `, [
        dateStr,
        dauQuery.rows[0].dau,
        mauQuery.rows[0].mau,
        ocupacaoPct.toFixed(2),
        alunosQuery.rows[0].ativos,
        professoresQuery.rows[0].ativos,
        turmasQuery.rows[0].ativas
      ]);

      // Invalidar cache
      await redisClient.del('metrics:operational:latest');

      console.log(`✅ Métricas operacionais agregadas para ${dateStr}`);
      return { success: true, date: dateStr };
    } catch (error) {
      console.error('Erro ao agregar métricas operacionais:', error);
      throw error;
    }
  }

  /**
   * Atualiza materialized view do dashboard geral
   */
  async refreshDashboardView() {
    try {
      await pool.query('REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_geral');
      console.log('✅ Materialized view atualizada');
    } catch (error) {
      console.error('Erro ao atualizar materialized view:', error);
      throw error;
    }
  }

  /**
   * Processa evento recebido do broker
   */
  async processEvent(event) {
    try {
      const { event_id, event_type, payload, timestamp } = event;

      // Verificar se já foi processado
      const exists = await pool.query(
        'SELECT 1 FROM processed_events WHERE event_id = $1',
        [event_id]
      );

      if (exists.rows.length > 0) {
        console.log(`⚠️ Evento ${event_id} já foi processado`);
        return { success: false, reason: 'duplicate' };
      }

      // Processar baseado no tipo de evento
      switch (event_type) {
        case 'Payment.Confirmed':
          await this.aggregateFinancialMetrics(new Date(timestamp));
          break;
        case 'Attendance.Marked':
          await this.aggregateAttendanceMetrics(new Date(timestamp));
          break;
        case 'Student.Enrolled':
        case 'Class.Scheduled':
          await this.aggregateOperationalMetrics(new Date(timestamp));
          break;
      }

      // Marcar como processado
      await pool.query(
        'INSERT INTO processed_events (event_id, event_type, payload) VALUES ($1, $2, $3)',
        [event_id, event_type, JSON.stringify(payload)]
      );

      console.log(`✅ Evento ${event_type} processado: ${event_id}`);
      return { success: true };
    } catch (error) {
      console.error(`Erro ao processar evento:`, error);
      throw error;
    }
  }
}

export default new DataAggregatorService();

