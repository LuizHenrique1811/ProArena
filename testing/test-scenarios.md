# Roteiros de Teste - ProArena Dashboards

## Objetivo

Avaliar a usabilidade, clareza e performance dos dashboards implementados através de cenários práticos com diferentes perfis de usuário.

## Métricas Coletadas

- **Tempo médio por tarefa**: cronômetro desde o início até conclusão
- **Taxa de erro**: tentativas incorretas / total de ações esperadas
- **Clareza visual**: escala Likert 1-5 (1=confuso, 5=muito claro)
- **Performance**: tempo de carregamento dos dashboards (meta SLO: <2s)
- **Satisfação geral**: NPS após cada cenário (0-10)

---

## Cenário 1: Administrador - Análise Financeira Mensal

### Perfil

- **Usuário**: admin@test.com / Test@2025
- **Permissões**: Acesso completo a todos os dashboards
- **Objetivo**: Analisar a saúde financeira do último trimestre e identificar inadimplentes

### Passo a Passo

1. **Login no sistema**

   - Acessar `/login`
   - Inserir credenciais
   - **Esperado**: Redirecionamento para dashboard principal em <2s

2. **Acessar Dashboard Financeiro**

   - Clicar em "Financeiro" no menu lateral
   - **Esperado**: Página carrega com 4 KPI cards visíveis
   - **Métrica**: Tempo de carregamento < 2s

3. **Aplicar filtro de período**

   - Clicar no botão "Trimestral"
   - **Esperado**: Gráficos atualizam automaticamente
   - **Métrica**: Tempo de atualização < 1.5s

4. **Identificar mês com maior inadimplência**

   - Observar gráfico "Taxa de Inadimplência"
   - Identificar o pico visual
   - **Esperado**: Linha do gráfico claramente mostra variações
   - **Métrica**: Clareza visual (1-5)

5. **Exportar lista de inadimplentes**

   - Rolar até tabela de resumo
   - Clicar em "Exportar CSV"
   - **Esperado**: Download automático do arquivo
   - **Métrica**: Tempo até download < 3s

6. **Validar dados exportados**
   - Abrir arquivo CSV em Excel/LibreOffice
   - Verificar presença de colunas: Data, MRR, Inadimplência
   - **Esperado**: Dados consistentes com dashboard

### Métricas Esperadas

- Tempo total do cenário: **< 5 minutos**
- Taxa de erro: **0%** (sem tentativas incorretas)
- Clareza visual: **≥ 4/5**
- Satisfação NPS: **≥ 8/10**

---

## Cenário 2: Analista - Detecção de Baixa Frequência

### Perfil

- **Usuário**: analista@test.com / Test@2025
- **Permissões**: Read-only em dashboards e relatórios
- **Objetivo**: Identificar alunos com frequência crítica (<75%) em uma turma específica

### Passo a Passo

1. **Login e navegação**

   - Login com credenciais de analista
   - Acessar "Dashboard de Presença"
   - **Métrica**: Tempo de carregamento < 2s

2. **Visualizar heat map geral**

   - Observar o mapa de calor de presenças
   - Identificar visualmente dias/turmas com baixa frequência
   - **Esperado**: Cores distintas (azul claro = baixa, azul escuro = alta)
   - **Métrica**: Clareza visual (1-5)

3. **Aplicar filtro por turma**

   - Selecionar "Futebol Infantil A" no dropdown
   - **Esperado**: Gráficos filtram automaticamente
   - **Métrica**: Responsividade < 1s

4. **Identificar alunos com frequência <75%**

   - Rolar até seção "Alertas"
   - Revisar tabela de alunos com baixa frequência
   - **Esperado**: Lista ordenada por frequência ascendente
   - **Métrica**: Facilidade de identificação (1-5)

5. **Verificar consistência dos dados**
   - Comparar números do heat map com a tabela
   - Verificar se indicador "≥95% aderência check-in" está correto
   - **Esperado**: Dados consistentes entre visualizações

### Métricas Esperadas

- Tempo total: **< 4 minutos**
- Taxa de erro: **0%**
- Facilidade de identificação: **≥ 4/5**
- Satisfação NPS: **≥ 8/10**

---

## Cenário 3: Professor - Consulta de Frequência da Turma

### Perfil

- **Usuário**: prof1@test.com / Test@2025
- **Permissões**: Visualiza apenas suas turmas, pode marcar presença
- **Objetivo**: Consultar a frequência mensal de sua turma e identificar alunos ausentes

### Passo a Passo

1. **Login e acesso ao dashboard**

   - Login com credenciais de professor
   - Navegar para "Dashboard de Presença"
   - **Esperado**: Visualização filtrada automaticamente para suas turmas

2. **Selecionar período mensal**

   - Clicar em botão "Mensal"
   - **Esperado**: Dados dos últimos 30 dias carregam
   - **Métrica**: Tempo < 1.5s

3. **Analisar frequência da turma**

   - Observar gráfico comparativo de sua turma
   - Identificar taxa de frequência média
   - **Esperado**: Barra colorida com percentual visível

4. **Identificar alunos ausentes**

   - Verificar lista de alertas
   - Localizar alunos de sua turma com <75% de presença
   - **Esperado**: Filtro automático mostra apenas sua turma

5. **Planejar ação**
   - Anotar nomes dos alunos para contato com responsáveis
   - **Métrica**: Usabilidade do processo (1-5)

### Métricas Esperadas

- Tempo total: **< 3 minutos**
- Taxa de erro: **0%**
- Usabilidade: **≥ 4/5**
- Satisfação NPS: **≥ 7/10**

---

## Cenário 4: Responsável - Acompanhamento do Filho (App Mobile)

### Perfil

- **Usuário**: pai1@test.com / Test@2025
- **Permissões**: Visualiza apenas dados dos seus filhos
- **Objetivo**: Ver presença da última semana e acessar boleto pendente

### Passo a Passo

1. **Login no app mobile**

   - Abrir aplicativo ProArena
   - Fazer login
   - **Esperado**: Home screen com resumo do filho
   - **Métrica**: Tempo < 2s

2. **Visualizar presença da última semana**

   - Acessar seção "Presenças"
   - Ver calendário com marcações
   - **Esperado**: Dias com presença marcados em verde, ausências em vermelho
   - **Métrica**: Clareza visual (1-5)

3. **Acessar boleto pendente**

   - Navegar para "Financeiro"
   - Ver lista de boletos (pendentes, pagos, atrasados)
   - Clicar no boleto pendente
   - **Esperado**: Detalhes do boleto + QR Code PIX/link
   - **Métrica**: Tempo até exibição < 1.5s

4. **Receber notificação push**

   - Simular envio de notificação de evento
   - **Esperado**: Push aparece na tela com título e mensagem
   - Tocar na notificação abre o app na seção correta

5. **Confirmar leitura da notificação**
   - Marcar notificação como lida
   - **Esperado**: Badge de "não lido" desaparece

### Métricas Esperadas

- Tempo total: **< 3 minutos**
- Taxa de erro: **0%**
- Clareza visual: **≥ 4.5/5**
- Satisfação NPS: **≥ 9/10** (perfil crítico para retenção)

---

## Cenário 5: Administrador - Verificação de Qualidade de Dados

### Perfil

- **Usuário**: admin@test.com / Test@2025
- **Objetivo**: Executar verificação de qualidade e analisar anomalias

### Passo a Passo

1. **Acessar Relatório de Qualidade**

   - Navegar para menu "Qualidade"
   - **Esperado**: Página com gauges e tabelas carrega
   - **Métrica**: Tempo < 2s

2. **Executar verificação agora**

   - Clicar em "Executar Verificação"
   - **Esperado**: Loading spinner + mensagem de sucesso
   - **Métrica**: Tempo de processamento < 10s

3. **Analisar scores**

   - Observar 4 gauges (Integridade, Completude, Consistência, Acurácia)
   - Identificar dimensão com score mais baixo
   - **Esperado**: Cores verde (≥90), amarelo (70-89), vermelho (<70)
   - **Métrica**: Clareza visual (1-5)

4. **Revisar anomalias**

   - Rolar até seção "Anomalias Detectadas"
   - Ler descrição das 5 principais anomalias
   - **Esperado**: Texto claro com tipo, campo e contagem

5. **Ver evolução temporal**
   - Selecionar tabela "students" no dropdown
   - Observar gráfico de linha dos últimos 30 dias
   - **Esperado**: Tendência visível (subindo/descendo/estável)

### Métricas Esperadas

- Tempo total: **< 5 minutos**
- Taxa de erro: **0%**
- Clareza visual: **≥ 4/5**
- Satisfação NPS: **≥ 7/10**

---

## Formulário Pós-Teste (user-feedback-form.json)

```json
{
  "cenario_id": "",
  "usuario_perfil": "",
  "data_hora": "",
  "metricas": {
    "tempo_total_segundos": 0,
    "tempo_carregamento_dashboard": 0,
    "numero_tentativas_incorretas": 0,
    "taxa_erro_pct": 0
  },
  "avaliacao_subjetiva": {
    "clareza_visual": 0,
    "facilidade_navegacao": 0,
    "utilidade_informacoes": 0,
    "satisfacao_geral_nps": 0
  },
  "comentarios": "",
  "problemas_encontrados": [],
  "sugestoes_melhoria": []
}
```

---

## Critérios de Aceitação

### Performance (SLO)

- ✅ 95% das requisições em rotas críticas < 2s
- ✅ Tempo de carregamento de dashboards < 2s
- ✅ Atualização de filtros < 1.5s

### Usabilidade

- ✅ Clareza visual média ≥ 4/5
- ✅ Taxa de erro < 5%
- ✅ Satisfação NPS média ≥ 8/10

### Qualidade de Dados

- ✅ Score geral de qualidade ≥ 80/100
- ✅ Nenhum score de dimensão < 70

---

## Próximos Passos

1. Executar cenários com 5 usuários por perfil (20 total)
2. Coletar métricas em planilha `usability-metrics.xlsx`
3. Gravar sessões com Loom/OBS
4. Consolidar feedback e identificar pontos de melhoria
5. Implementar ajustes críticos antes do deploy de produção
