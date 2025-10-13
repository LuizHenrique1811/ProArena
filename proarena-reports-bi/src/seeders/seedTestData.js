import { faker } from '@faker-js/faker';
import pool from '../config/database.js';

// Configurar locale para PT-BR
faker.locale = 'pt_BR';

/**
 * Gera CPF válido
 */
function gerarCPFValido() {
  const n1 = Math.floor(Math.random() * 9);
  const n2 = Math.floor(Math.random() * 9);
  const n3 = Math.floor(Math.random() * 9);
  const n4 = Math.floor(Math.random() * 9);
  const n5 = Math.floor(Math.random() * 9);
  const n6 = Math.floor(Math.random() * 9);
  const n7 = Math.floor(Math.random() * 9);
  const n8 = Math.floor(Math.random() * 9);
  const n9 = Math.floor(Math.random() * 9);
  
  let d1 = n9 * 2 + n8 * 3 + n7 * 4 + n6 * 5 + n5 * 6 + n4 * 7 + n3 * 8 + n2 * 9 + n1 * 10;
  d1 = 11 - (d1 % 11);
  if (d1 >= 10) d1 = 0;
  
  let d2 = d1 * 2 + n9 * 3 + n8 * 4 + n7 * 5 + n6 * 6 + n5 * 7 + n4 * 8 + n3 * 9 + n2 * 10 + n1 * 11;
  d2 = 11 - (d2 % 11);
  if (d2 >= 10) d2 = 0;
  
  return `${n1}${n2}${n3}${n4}${n5}${n6}${n7}${n8}${n9}${d1}${d2}`;
}

/**
 * Cria tabelas base se não existirem
 */
async function createBaseTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS responsaveis (
      id BIGSERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      cpf TEXT UNIQUE,
      email TEXT,
      telefone TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS students (
      id BIGSERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      cpf TEXT UNIQUE,
      data_nascimento DATE,
      responsavel_id BIGINT REFERENCES responsaveis(id),
      modalidade TEXT,
      ativo BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS professores (
      id BIGSERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      cpf TEXT UNIQUE,
      email TEXT,
      especialidade TEXT,
      ativo BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS turmas (
      id BIGSERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      modalidade TEXT,
      professor_id BIGINT REFERENCES professores(id),
      capacidade INT DEFAULT 20,
      ativa BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS matriculas (
      id BIGSERIAL PRIMARY KEY,
      aluno_id BIGINT REFERENCES students(id),
      turma_id BIGINT REFERENCES turmas(id),
      data_matricula DATE DEFAULT CURRENT_DATE,
      ativa BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS aulas (
      id BIGSERIAL PRIMARY KEY,
      turma_id BIGINT REFERENCES turmas(id),
      data_hora TIMESTAMPTZ NOT NULL,
      duracao_minutos INT DEFAULT 60,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS presencas (
      id BIGSERIAL PRIMARY KEY,
      aluno_id BIGINT REFERENCES students(id),
      aula_id BIGINT REFERENCES aulas(id),
      presente BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE(aluno_id, aula_id)
    );

    CREATE TABLE IF NOT EXISTS boletos (
      id BIGSERIAL PRIMARY KEY,
      aluno_id BIGINT REFERENCES students(id),
      valor DECIMAL(10, 2) NOT NULL,
      vencimento DATE NOT NULL,
      status TEXT DEFAULT 'pendente',
      data_pagamento DATE,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS agendamentos (
      id BIGSERIAL PRIMARY KEY,
      data_hora TIMESTAMPTZ NOT NULL,
      status TEXT DEFAULT 'disponivel',
      created_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT,
      action TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      ativo BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);
}

/**
 * Seed principal
 */
async function seed() {
  try {
    console.log('🌱 Iniciando seed de dados de teste...');

    await createBaseTables();

    // Limpar dados existentes
    console.log('🗑️ Limpando dados antigos...');
    await pool.query('TRUNCATE TABLE presencas, boletos, aulas, matriculas, students, turmas, professores, responsaveis, agendamentos, audit_logs, users RESTART IDENTITY CASCADE');

    // 1. Criar usuários de teste
    console.log('👤 Criando usuários de teste...');
    const users = [
      { email: 'admin@test.com', role: 'admin' },
      { email: 'analista@test.com', role: 'analista' },
      { email: 'prof1@test.com', role: 'professor' },
      { email: 'pai1@test.com', role: 'responsavel' }
    ];

    for (const user of users) {
      await pool.query(
        'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)',
        [user.email, '$2b$10$abcdefghijklmnopqrstuvwxyz123456', user.role]
      );
    }

    // 2. Criar 30 responsáveis
    console.log('👨‍👩‍👧‍👦 Criando 30 responsáveis...');
    const responsaveis = [];
    for (let i = 0; i < 30; i++) {
      const result = await pool.query(`
        INSERT INTO responsaveis (nome, cpf, email, telefone)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [
        faker.name.fullName(),
        gerarCPFValido(),
        faker.internet.email(),
        faker.phone.number('(##) #####-####')
      ]);
      responsaveis.push(result.rows[0].id);
    }

    // 3. Criar 5 professores
    console.log('👨‍🏫 Criando 5 professores...');
    const modalidades = ['Futebol', 'Vôlei', 'Basquete', 'Natação', 'Judô'];
    const professores = [];
    for (let i = 0; i < 5; i++) {
      const result = await pool.query(`
        INSERT INTO professores (nome, cpf, email, especialidade)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [
        faker.name.fullName(),
        gerarCPFValido(),
        faker.internet.email(),
        modalidades[i]
      ]);
      professores.push(result.rows[0].id);
    }

    // 4. Criar 10 turmas (2 por modalidade)
    console.log('📚 Criando 10 turmas...');
    const turmas = [];
    for (let i = 0; i < 10; i++) {
      const modalidade = modalidades[Math.floor(i / 2)];
      const professorId = professores[Math.floor(i / 2)];
      
      const result = await pool.query(`
        INSERT INTO turmas (nome, modalidade, professor_id, capacidade)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [
        `${modalidade} ${i % 2 === 0 ? 'Infantil' : 'Juvenil'} ${String.fromCharCode(65 + Math.floor(i / 2))}`,
        modalidade,
        professorId,
        faker.number.int({ min: 15, max: 25 })
      ]);
      turmas.push({ id: result.rows[0].id, modalidade });
    }

    // 5. Criar 50 alunos
    console.log('👶 Criando 50 alunos...');
    const alunos = [];
    for (let i = 0; i < 50; i++) {
      // 70% têm 1 filho, 30% têm 2+ filhos
      const responsavelId = i < 35 
        ? responsaveis[i % 30] 
        : responsaveis[Math.floor(Math.random() * 15)];
      
      const modalidade = faker.helpers.arrayElement(modalidades);
      
      const result = await pool.query(`
        INSERT INTO students (nome, cpf, data_nascimento, responsavel_id, modalidade)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, [
        faker.name.fullName(),
        gerarCPFValido(),
        faker.date.birthdate({ min: 5, max: 17, mode: 'age' }),
        responsavelId,
        modalidade
      ]);
      alunos.push({ id: result.rows[0].id, modalidade });
    }

    // 6. Criar matrículas (cada aluno em 1-2 turmas da sua modalidade)
    console.log('📝 Criando matrículas...');
    for (const aluno of alunos) {
      const turmasDaModalidade = turmas.filter(t => t.modalidade === aluno.modalidade);
      const numTurmas = Math.random() > 0.7 ? 2 : 1;
      
      for (let i = 0; i < numTurmas && i < turmasDaModalidade.length; i++) {
        await pool.query(`
          INSERT INTO matriculas (aluno_id, turma_id, data_matricula)
          VALUES ($1, $2, $3)
        `, [
          aluno.id,
          turmasDaModalidade[i].id,
          faker.date.past({ years: 0.5 })
        ]);
      }
    }

    // 7. Criar aulas dos últimos 6 meses (3x por semana por turma)
    console.log('📅 Criando aulas dos últimos 6 meses...');
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const aulas = [];
    for (const turma of turmas) {
      let currentDate = new Date(sixMonthsAgo);
      
      while (currentDate < new Date()) {
        // Aulas às segundas, quartas e sextas
        const dayOfWeek = currentDate.getDay();
        if ([1, 3, 5].includes(dayOfWeek)) {
          const result = await pool.query(`
            INSERT INTO aulas (turma_id, data_hora, duracao_minutos)
            VALUES ($1, $2, $3)
            RETURNING id
          `, [
            turma.id,
            new Date(currentDate.setHours(18, 0, 0, 0)),
            60
          ]);
          aulas.push({ id: result.rows[0].id, turma_id: turma.id });
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    console.log(`✅ Criadas ${aulas.length} aulas`);

    // 8. Criar presenças (70-100% de frequência por aluno)
    console.log('✅ Criando presenças...');
    for (const aluno of alunos) {
      // Buscar turmas do aluno
      const matriculasResult = await pool.query(
        'SELECT turma_id FROM matriculas WHERE aluno_id = $1',
        [aluno.id]
      );
      
      for (const matricula of matriculasResult.rows) {
        const aulasturma = aulas.filter(a => a.turma_id === matricula.turma_id);
        const taxaPresenca = faker.number.float({ min: 0.70, max: 1.0, precision: 0.01 });
        
        for (const aula of aulasturma) {
          if (Math.random() < taxaPresenca) {
            await pool.query(`
              INSERT INTO presencas (aluno_id, aula_id, presente)
              VALUES ($1, $2, true)
              ON CONFLICT (aluno_id, aula_id) DO NOTHING
            `, [aluno.id, aula.id]);
          }
        }
      }
    }

    // 9. Criar boletos (100 transações)
    console.log('💰 Criando 100 transações financeiras...');
    for (let i = 0; i < 100; i++) {
      const aluno = faker.helpers.arrayElement(alunos);
      const vencimento = faker.date.between({ 
        from: sixMonthsAgo, 
        to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
      });
      
      const rand = Math.random();
      let status, dataPagamento;
      
      if (rand < 0.70) { // 70% pagos
        status = 'pago';
        dataPagamento = faker.date.between({ 
          from: vencimento, 
          to: new Date(vencimento.getTime() + 10 * 24 * 60 * 60 * 1000) 
        });
      } else if (rand < 0.90) { // 20% pendentes
        status = 'pendente';
        dataPagamento = null;
      } else { // 10% atrasados
        status = 'atrasado';
        dataPagamento = null;
      }
      
      await pool.query(`
        INSERT INTO boletos (aluno_id, valor, vencimento, status, data_pagamento)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        aluno.id,
        faker.number.float({ min: 100, max: 300, precision: 0.01 }),
        vencimento,
        status,
        dataPagamento
      ]);
    }

    // 10. Criar agendamentos de quadras (slots diários)
    console.log('🏟️ Criando agendamentos de quadras...');
    for (let i = 0; i < 90; i++) {
      const date = new Date();
      date.setDate(date.getDate() - 45 + i);
      
      // 10 slots por dia (8h às 22h)
      for (let hour = 8; hour <= 22; hour += 2) {
        const status = Math.random() > 0.4 ? 'ocupado' : 'disponivel';
        await pool.query(`
          INSERT INTO agendamentos (data_hora, status)
          VALUES ($1, $2)
        `, [
          new Date(date.setHours(hour, 0, 0, 0)),
          status
        ]);
      }
    }

    // 11. Criar audit logs (DAU/MAU)
    console.log('📊 Criando audit logs...');
    for (let i = 0; i < 180; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Simular 10-50 usuários ativos por dia
      const numUsers = faker.number.int({ min: 10, max: 50 });
      for (let j = 0; j < numUsers; j++) {
        await pool.query(`
          INSERT INTO audit_logs (user_id, action, created_at)
          VALUES ($1, $2, $3)
        `, [
          faker.number.int({ min: 1, max: 4 }),
          faker.helpers.arrayElement(['login', 'api_call', 'page_view']),
          date
        ]);
      }
    }

    console.log('✅ Seed completo!');
    console.log('📊 Resumo:');
    console.log('  - 30 responsáveis');
    console.log('  - 5 professores');
    console.log('  - 10 turmas');
    console.log('  - 50 alunos');
    console.log(`  - ${aulas.length} aulas (6 meses)`);
    console.log('  - 100 transações financeiras');
    console.log('  - Presenças com variação 70-100%');
    console.log('  - 4 usuários de teste');
    
    console.log('\n🔑 Credenciais de teste:');
    console.log('  Admin: admin@test.com / Test@2025');
    console.log('  Analista: analista@test.com / Test@2025');
    console.log('  Professor: prof1@test.com / Test@2025');
    console.log('  Responsável: pai1@test.com / Test@2025');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro no seed:', error);
    process.exit(1);
  }
}

seed();

