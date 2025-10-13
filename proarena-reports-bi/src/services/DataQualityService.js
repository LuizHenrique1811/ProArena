import pool from '../config/database.js';

class DataQualityService {
  /**
   * Valida integridade referencial (FKs órfãs, registros sem referência)
   */
  async checkIntegrity(tableName) {
    const checks = [];
    let totalIssues = 0;

    try {
      switch (tableName) {
        case 'students':
          // Verifica alunos sem responsável
          const orphanStudents = await pool.query(`
            SELECT COUNT(*) as count 
            FROM students s 
            WHERE NOT EXISTS (
              SELECT 1 FROM responsaveis r 
              WHERE r.id = s.responsavel_id
            )
          `);
          totalIssues += parseInt(orphanStudents.rows[0].count);
          checks.push({
            check: 'alunos_sem_responsavel',
            issues: orphanStudents.rows[0].count
          });
          break;

        case 'attendance':
          // Verifica presenças sem aula agendada
          const invalidAttendance = await pool.query(`
            SELECT COUNT(*) as count 
            FROM presencas p 
            WHERE NOT EXISTS (
              SELECT 1 FROM aulas a 
              WHERE a.id = p.aula_id
            )
          `);
          totalIssues += parseInt(invalidAttendance.rows[0].count);
          checks.push({
            check: 'presencas_sem_aula',
            issues: invalidAttendance.rows[0].count
          });
          break;

        case 'billing':
          // Verifica boletos sem aluno
          const invalidBillings = await pool.query(`
            SELECT COUNT(*) as count 
            FROM boletos b 
            WHERE NOT EXISTS (
              SELECT 1 FROM students s 
              WHERE s.id = b.aluno_id
            )
          `);
          totalIssues += parseInt(invalidBillings.rows[0].count);
          checks.push({
            check: 'boletos_sem_aluno',
            issues: invalidBillings.rows[0].count
          });
          break;

        case 'classes':
          // Verifica turmas sem professor
          const classesWithoutTeacher = await pool.query(`
            SELECT COUNT(*) as count 
            FROM turmas t 
            WHERE NOT EXISTS (
              SELECT 1 FROM professores p 
              WHERE p.id = t.professor_id
            )
          `);
          totalIssues += parseInt(classesWithoutTeacher.rows[0].count);
          checks.push({
            check: 'turmas_sem_professor',
            issues: classesWithoutTeacher.rows[0].count
          });
          break;
      }

      const totalRecords = await this.getTotalRecords(tableName);
      const score = totalRecords > 0 ? Math.max(0, 100 - (totalIssues / totalRecords * 100)) : 100;

      return {
        score: parseFloat(score.toFixed(2)),
        issues: checks,
        totalIssues
      };
    } catch (error) {
      console.error(`Erro ao verificar integridade de ${tableName}:`, error);
      return { score: 0, issues: [], totalIssues: 0, error: error.message };
    }
  }

  /**
   * Verifica completude dos dados (% de campos obrigatórios preenchidos)
   */
  async checkCompleteness(tableName) {
    try {
      let missingFields = {};
      let totalRecords = 0;

      switch (tableName) {
        case 'students':
          const studentCompleteness = await pool.query(`
            SELECT 
              COUNT(*) as total,
              COUNT(*) FILTER (WHERE nome IS NULL OR nome = '') as nome_missing,
              COUNT(*) FILTER (WHERE cpf IS NULL OR cpf = '') as cpf_missing,
              COUNT(*) FILTER (WHERE data_nascimento IS NULL) as data_nasc_missing,
              COUNT(*) FILTER (WHERE responsavel_id IS NULL) as responsavel_missing
            FROM students
          `);
          const row = studentCompleteness.rows[0];
          totalRecords = parseInt(row.total);
          missingFields = {
            nome: parseInt(row.nome_missing),
            cpf: parseInt(row.cpf_missing),
            data_nascimento: parseInt(row.data_nasc_missing),
            responsavel_id: parseInt(row.responsavel_missing)
          };
          break;

        case 'billing':
          const billingCompleteness = await pool.query(`
            SELECT 
              COUNT(*) as total,
              COUNT(*) FILTER (WHERE valor IS NULL OR valor <= 0) as valor_missing,
              COUNT(*) FILTER (WHERE vencimento IS NULL) as vencimento_missing,
              COUNT(*) FILTER (WHERE aluno_id IS NULL) as aluno_missing
            FROM boletos
          `);
          const billingRow = billingCompleteness.rows[0];
          totalRecords = parseInt(billingRow.total);
          missingFields = {
            valor: parseInt(billingRow.valor_missing),
            vencimento: parseInt(billingRow.vencimento_missing),
            aluno_id: parseInt(billingRow.aluno_missing)
          };
          break;
      }

      const totalMissing = Object.values(missingFields).reduce((a, b) => a + b, 0);
      const totalFields = Object.keys(missingFields).length * totalRecords;
      const score = totalFields > 0 ? ((totalFields - totalMissing) / totalFields * 100) : 100;

      return {
        score: parseFloat(score.toFixed(2)),
        missing_fields: missingFields,
        totalRecords
      };
    } catch (error) {
      console.error(`Erro ao verificar completude de ${tableName}:`, error);
      return { score: 0, missing_fields: {}, totalRecords: 0, error: error.message };
    }
  }

  /**
   * Valida consistência (regras de negócio)
   */
  async checkConsistency(tableName) {
    const violations = [];
    let totalViolations = 0;

    try {
      switch (tableName) {
        case 'students':
          // Data de nascimento não pode ser futura
          const futureBirthdate = await pool.query(`
            SELECT COUNT(*) as count 
            FROM students 
            WHERE data_nascimento > CURRENT_DATE
          `);
          totalViolations += parseInt(futureBirthdate.rows[0].count);
          violations.push({
            rule: 'data_nascimento_futura',
            violations: futureBirthdate.rows[0].count
          });

          // Alunos devem ter entre 4 e 100 anos
          const invalidAge = await pool.query(`
            SELECT COUNT(*) as count 
            FROM students 
            WHERE data_nascimento < CURRENT_DATE - INTERVAL '100 years'
               OR data_nascimento > CURRENT_DATE - INTERVAL '4 years'
          `);
          totalViolations += parseInt(invalidAge.rows[0].count);
          violations.push({
            rule: 'idade_invalida',
            violations: invalidAge.rows[0].count
          });
          break;

        case 'billing':
          // Vencimento não pode ser muito antigo (>2 anos)
          const oldBilling = await pool.query(`
            SELECT COUNT(*) as count 
            FROM boletos 
            WHERE vencimento < CURRENT_DATE - INTERVAL '2 years'
          `);
          totalViolations += parseInt(oldBilling.rows[0].count);
          violations.push({
            rule: 'vencimento_muito_antigo',
            violations: oldBilling.rows[0].count
          });

          // Valor deve ser positivo
          const negativeValue = await pool.query(`
            SELECT COUNT(*) as count 
            FROM boletos 
            WHERE valor <= 0
          `);
          totalViolations += parseInt(negativeValue.rows[0].count);
          violations.push({
            rule: 'valor_invalido',
            violations: negativeValue.rows[0].count
          });
          break;

        case 'attendance':
          // Presença duplicada (mesmo aluno, mesma aula)
          const duplicateAttendance = await pool.query(`
            SELECT COUNT(*) as count FROM (
              SELECT aluno_id, aula_id, COUNT(*) 
              FROM presencas 
              GROUP BY aluno_id, aula_id 
              HAVING COUNT(*) > 1
            ) sub
          `);
          totalViolations += parseInt(duplicateAttendance.rows[0].count);
          violations.push({
            rule: 'presenca_duplicada',
            violations: duplicateAttendance.rows[0].count
          });
          break;
      }

      const totalRecords = await this.getTotalRecords(tableName);
      const score = totalRecords > 0 ? Math.max(0, 100 - (totalViolations / totalRecords * 100)) : 100;

      return {
        score: parseFloat(score.toFixed(2)),
        violations,
        totalViolations
      };
    } catch (error) {
      console.error(`Erro ao verificar consistência de ${tableName}:`, error);
      return { score: 0, violations: [], totalViolations: 0, error: error.message };
    }
  }

  /**
   * Valida acurácia (formatos válidos: CPF, email, telefone)
   */
  async checkAccuracy(tableName) {
    const invalidRecords = [];
    let totalInvalid = 0;

    try {
      switch (tableName) {
        case 'students':
        case 'responsaveis':
          // CPF inválido (formato básico: 11 dígitos)
          const invalidCPF = await pool.query(`
            SELECT COUNT(*) as count 
            FROM ${tableName}
            WHERE cpf IS NOT NULL 
              AND (LENGTH(REGEXP_REPLACE(cpf, '[^0-9]', '', 'g')) != 11
                   OR cpf ~ '^(0{11}|1{11}|2{11}|3{11}|4{11}|5{11}|6{11}|7{11}|8{11}|9{11})$')
          `);
          totalInvalid += parseInt(invalidCPF.rows[0].count);
          invalidRecords.push({
            field: 'cpf',
            invalid_count: invalidCPF.rows[0].count
          });

          // Email inválido (formato básico)
          const invalidEmail = await pool.query(`
            SELECT COUNT(*) as count 
            FROM ${tableName}
            WHERE email IS NOT NULL 
              AND email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'
          `);
          totalInvalid += parseInt(invalidEmail.rows[0].count);
          invalidRecords.push({
            field: 'email',
            invalid_count: invalidEmail.rows[0].count
          });

          // Telefone inválido (formato básico: 10 ou 11 dígitos)
          const invalidPhone = await pool.query(`
            SELECT COUNT(*) as count 
            FROM ${tableName}
            WHERE telefone IS NOT NULL 
              AND LENGTH(REGEXP_REPLACE(telefone, '[^0-9]', '', 'g')) NOT BETWEEN 10 AND 11
          `);
          totalInvalid += parseInt(invalidPhone.rows[0].count);
          invalidRecords.push({
            field: 'telefone',
            invalid_count: invalidPhone.rows[0].count
          });
          break;
      }

      const totalRecords = await this.getTotalRecords(tableName);
      const score = totalRecords > 0 ? Math.max(0, 100 - (totalInvalid / totalRecords * 100)) : 100;

      return {
        score: parseFloat(score.toFixed(2)),
        invalid_records: invalidRecords,
        totalInvalid
      };
    } catch (error) {
      console.error(`Erro ao verificar acurácia de ${tableName}:`, error);
      return { score: 0, invalid_records: [], totalInvalid: 0, error: error.message };
    }
  }

  /**
   * Executa verificação completa de qualidade
   */
  async runFullCheck() {
    const tables = ['students', 'responsaveis', 'billing', 'attendance', 'classes'];
    const results = [];

    for (const table of tables) {
      try {
        console.log(`🔍 Verificando qualidade da tabela: ${table}`);

        const integrity = await this.checkIntegrity(table);
        const completeness = await this.checkCompleteness(table);
        const consistency = await this.checkConsistency(table);
        const accuracy = await this.checkAccuracy(table);

        const overallScore = (
          integrity.score + 
          completeness.score + 
          consistency.score + 
          accuracy.score
        ) / 4;

        const anomalies = [
          ...(integrity.issues || []),
          ...Object.entries(completeness.missing_fields || {}).map(([field, count]) => ({
            type: 'completeness',
            field,
            count
          })),
          ...(consistency.violations || []),
          ...(accuracy.invalid_records || [])
        ];

        // Salvar no log
        await pool.query(`
          INSERT INTO data_quality_log (
            table_name, 
            integrity_score, 
            completeness_score, 
            consistency_score, 
            accuracy_score,
            overall_score,
            total_records,
            anomalies,
            details
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          table,
          integrity.score,
          completeness.score,
          consistency.score,
          accuracy.score,
          overallScore.toFixed(2),
          await this.getTotalRecords(table),
          JSON.stringify(anomalies),
          JSON.stringify({ integrity, completeness, consistency, accuracy })
        ]);

        results.push({
          table,
          integrity_score: integrity.score,
          completeness_score: completeness.score,
          consistency_score: consistency.score,
          accuracy_score: accuracy.score,
          overall_score: parseFloat(overallScore.toFixed(2)),
          anomalies: anomalies.length
        });

        console.log(`✅ ${table}: Score geral = ${overallScore.toFixed(2)}`);
      } catch (error) {
        console.error(`❌ Erro ao verificar ${table}:`, error);
        results.push({
          table,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Obtém total de registros de uma tabela
   */
  async getTotalRecords(tableName) {
    try {
      const result = await pool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error(`Erro ao contar registros de ${tableName}:`, error);
      return 0;
    }
  }

  /**
   * Obtém histórico de qualidade de uma tabela
   */
  async getHistory(tableName, days = 30) {
    try {
      const result = await pool.query(`
        SELECT 
          checked_at,
          integrity_score,
          completeness_score,
          consistency_score,
          accuracy_score,
          overall_score,
          total_records
        FROM data_quality_log
        WHERE table_name = $1
          AND checked_at >= CURRENT_DATE - INTERVAL '${days} days'
        ORDER BY checked_at DESC
      `, [tableName]);

      return result.rows;
    } catch (error) {
      console.error(`Erro ao buscar histórico de ${tableName}:`, error);
      return [];
    }
  }

  /**
   * Obtém relatório consolidado de qualidade
   */
  async getReport() {
    try {
      const result = await pool.query(`
        SELECT DISTINCT ON (table_name)
          table_name,
          checked_at,
          integrity_score,
          completeness_score,
          consistency_score,
          accuracy_score,
          overall_score,
          total_records,
          anomalies
        FROM data_quality_log
        ORDER BY table_name, checked_at DESC
      `);

      return result.rows;
    } catch (error) {
      console.error('Erro ao gerar relatório de qualidade:', error);
      return [];
    }
  }
}

export default new DataQualityService();

