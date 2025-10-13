# ProArena Reports-BI

Serviço de Business Intelligence e Relatórios do ProArena.

## 🚀 Configuração Inicial

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

```bash
# Copiar o arquivo de exemplo
cp .env.example .env

# Editar o arquivo .env com suas credenciais
nano .env
```

**Variáveis Obrigatórias:**

- `DATABASE_URL`: URL de conexão do PostgreSQL/Supabase (porta 6543 - Connection Pooler)
- `PORT`: Porta do serviço (padrão: 3001)

**Variáveis Opcionais:**

- `REDIS_URL`: URL do Redis para cache
- `RABBITMQ_URL`: URL do RabbitMQ para eventos
- `SENTRY_DSN`: Sentry para monitoramento de erros

### 3. Obter a URL do Supabase

1. Acesse o [Supabase Dashboard](https://app.supabase.com/)
2. Vá em **Settings** → **Database**
3. Na seção **Connection Pooling**, copie a **Connection string**
4. **IMPORTANTE**: Use a porta **6543** (Pooler) para compatibilidade IPv4
5. Cole no `.env` como valor de `DATABASE_URL`

Exemplo:

```
DATABASE_URL=postgresql://postgres.abc123:senha@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require
```

### 4. Executar Migrations

```bash
npm run migrate
```

**Output esperado:**

```
🚀 Iniciando migrations...
📝 Executando: 001_create_metrics_tables.sql
✅ 001_create_metrics_tables.sql executado com sucesso
✅ Todas as migrations foram executadas!
```

### 5. Popular com Dados de Teste

```bash
node src/seeders/seedTestData.js
```

**Output esperado:**

```
🌱 Iniciando seed de dados de teste...
✅ Seed completo!
📊 Resumo:
  - 30 responsáveis
  - 5 professores
  - 10 turmas
  - 50 alunos
  - [XXX] aulas (6 meses)
  - 100 transações financeiras

🔑 Credenciais de teste:
  Admin: admin@test.com / Test@2025
  Analista: analista@test.com / Test@2025
  Professor: prof1@test.com / Test@2025
  Responsável: pai1@test.com / Test@2025
```

### 6. Iniciar o Serviço

**Desenvolvimento:**

```bash
npm run dev
```

**Produção:**

```bash
npm start
```

**Output esperado:**

```
✅ PostgreSQL conectado com sucesso
✅ Redis conectado
🚀 Serviço reports-bi rodando na porta 3001
📊 Ambiente: development
```

## 📡 Endpoints Disponíveis

### Health Check

```
GET /api/health
```

### Métricas Financeiras

```
GET /api/metrics/financeiro?start=2025-01-01&end=2025-12-31
```

### Métricas de Presença

```
GET /api/metrics/presenca?turma_id=1&periodo=mensal
```

### Métricas Operacionais

```
GET /api/metrics/operacional?periodo=mensal
```

### Dashboard Geral

```
GET /api/metrics/dashboard-geral
```

### Relatório de Qualidade

```
GET /api/data-quality/report
```

### Histórico de Qualidade

```
GET /api/data-quality/history?table=students&days=30
```

### Executar Verificação de Qualidade

```
POST /api/data-quality/run-check
```

### Verificar Tabela Específica

```
GET /api/data-quality/check/:table
```

## 🗂️ Estrutura do Projeto

```
proarena-reports-bi/
├── src/
│   ├── config/              # Configurações (DB, Redis)
│   │   ├── database.js
│   │   └── redis.js
│   ├── controllers/         # Controladores REST
│   │   ├── MetricsController.js
│   │   └── DataQualityController.js
│   ├── services/            # Lógica de negócio
│   │   ├── DataQualityService.js
│   │   └── DataAggregatorService.js
│   ├── routes/              # Rotas da API
│   │   └── index.js
│   ├── database/
│   │   └── migrations/      # Scripts SQL
│   │       └── 001_create_metrics_tables.sql
│   ├── seeders/             # Scripts de seed
│   │   └── seedTestData.js
│   └── index.js             # Entry point
├── .env.example             # Template de variáveis
├── .gitignore
├── package.json
└── README.md
```

## 🧪 Testes

```bash
# Executar testes unitários
npm test

# Executar testes com coverage
npm run test:coverage
```

## 📊 Monitoramento

O serviço expõe logs estruturados em JSON:

```json
{
  "timestamp": "2025-10-13T10:30:00Z",
  "level": "info",
  "service": "reports-bi",
  "message": "Métricas agregadas com sucesso"
}
```

## 🔒 Segurança

- ✅ SSL/TLS habilitado em produção
- ✅ Variáveis sensíveis em `.env` (não commitadas)
- ✅ Rate limiting configurado (100 req/15min por IP)
- ✅ Helmet.js para headers de segurança
- ✅ CORS configurado

## 🚨 Troubleshooting

### Erro: "Connection timeout"

- Verifique se está usando a porta **6543** (Pooler) do Supabase
- Confirme que `sslmode=require` está na URL

### Erro: "Redis connection failed"

- Se não estiver usando Redis, comente as linhas de Redis no código
- Ou instale Redis localmente: `brew install redis` (Mac) ou `sudo apt install redis` (Linux)

### Erro: "Table does not exist"

- Execute as migrations: `npm run migrate`
- Verifique se o banco está acessível

## 📚 Documentação Adicional

- [Plano Completo](../dashboards-e-qualidade-proarena.plan.md)
- [Relatório Final](../relatorio-dashboards-qualidade.md)
- [Roteiros de Teste](../testing/test-scenarios.md)

## 🤝 Suporte

Para problemas ou dúvidas, consulte a documentação ou abra uma issue no repositório.
