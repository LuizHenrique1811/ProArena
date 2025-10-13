-- Métricas financeiras agregadas
CREATE TABLE IF NOT EXISTS metrics_financial (
  date DATE PRIMARY KEY,
  mrr DECIMAL(10, 2) DEFAULT 0,
  inadimplencia_pct DECIMAL(5, 2) DEFAULT 0,
  conversao_boletos_pct DECIMAL(5, 2) DEFAULT 0,
  dso_days INT DEFAULT 0,
  receita_total DECIMAL(10, 2) DEFAULT 0,
  boletos_emitidos INT DEFAULT 0,
  boletos_pagos INT DEFAULT 0,
  boletos_atrasados INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_metrics_financial_date_desc ON metrics_financial(date DESC);

-- Métricas de presença por turma
CREATE TABLE IF NOT EXISTS metrics_attendance (
  date DATE NOT NULL,
  turma_id BIGINT NOT NULL,
  turma_nome TEXT,
  frequencia_media DECIMAL(5, 2) DEFAULT 0,
  aderencia_checkin_pct DECIMAL(5, 2) DEFAULT 0,
  total_presencas INT DEFAULT 0,
  total_aulas INT DEFAULT 0,
  alunos_frequentes INT DEFAULT 0,
  alunos_baixa_freq INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (date, turma_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_metrics_attendance_date ON metrics_attendance(date DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_attendance_turma ON metrics_attendance(turma_id);

-- Métricas operacionais
CREATE TABLE IF NOT EXISTS metrics_operational (
  date DATE PRIMARY KEY,
  dau INT DEFAULT 0,
  mau INT DEFAULT 0,
  ocupacao_quadras_pct DECIMAL(5, 2) DEFAULT 0,
  alunos_ativos INT DEFAULT 0,
  alunos_novos INT DEFAULT 0,
  alunos_inativos INT DEFAULT 0,
  professores_ativos INT DEFAULT 0,
  turmas_ativas INT DEFAULT 0,
  aulas_realizadas INT DEFAULT 0,
  avisos_enviados INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_metrics_operational_date_desc ON metrics_operational(date DESC);

-- Log de qualidade de dados
CREATE TABLE IF NOT EXISTS data_quality_log (
  id BIGSERIAL PRIMARY KEY,
  checked_at TIMESTAMPTZ DEFAULT now(),
  table_name TEXT NOT NULL,
  integrity_score DECIMAL(5, 2) DEFAULT 0,
  completeness_score DECIMAL(5, 2) DEFAULT 0,
  consistency_score DECIMAL(5, 2) DEFAULT 0,
  accuracy_score DECIMAL(5, 2) DEFAULT 0,
  overall_score DECIMAL(5, 2) DEFAULT 0,
  total_records INT DEFAULT 0,
  anomalies JSONB DEFAULT '[]'::jsonb,
  details JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_data_quality_checked_at ON data_quality_log(checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_quality_table ON data_quality_log(table_name);

-- Tabela de eventos processados (para evitar duplicatas)
CREATE TABLE IF NOT EXISTS processed_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT now(),
  payload JSONB
);

CREATE INDEX IF NOT EXISTS idx_processed_events_type ON processed_events(event_type);
CREATE INDEX IF NOT EXISTS idx_processed_events_processed_at ON processed_events(processed_at DESC);

-- Materialized view para dashboards (atualização rápida)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_dashboard_geral AS
SELECT 
  (SELECT alunos_ativos FROM metrics_operational ORDER BY date DESC LIMIT 1) as alunos_ativos,
  (SELECT mrr FROM metrics_financial ORDER BY date DESC LIMIT 1) as receita_mes,
  (SELECT AVG(frequencia_media) FROM metrics_attendance WHERE date >= CURRENT_DATE - INTERVAL '30 days') as taxa_presenca_media,
  (SELECT inadimplencia_pct FROM metrics_financial ORDER BY date DESC LIMIT 1) as inadimplencia_pct,
  (SELECT date FROM metrics_operational ORDER BY date DESC LIMIT 1) as ultima_atualizacao;

CREATE UNIQUE INDEX IF NOT EXISTS mv_dashboard_geral_idx ON mv_dashboard_geral(ultima_atualizacao);

COMMENT ON TABLE metrics_financial IS 'Métricas financeiras agregadas diariamente';
COMMENT ON TABLE metrics_attendance IS 'Métricas de presença por turma';
COMMENT ON TABLE metrics_operational IS 'Métricas operacionais do sistema';
COMMENT ON TABLE data_quality_log IS 'Histórico de verificações de qualidade de dados';

