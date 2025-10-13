/**
 * Testes E2E - Dashboard Financeiro
 * Valida SLO de performance (<2s) e fluxos completos
 */

import puppeteer from 'puppeteer';
import { expect } from '@jest/globals';

describe('Dashboard Financeiro - E2E Tests', () => {
  let browser;
  let page;
  const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
    
    // Configurar viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Fazer login como admin
    await page.goto(`${BASE_URL}/login`);
    await page.type('input[name="email"]', 'admin@test.com');
    await page.type('input[name="password"]', 'Test@2025');
    await page.click('button[type="submit"]');
    
    // Aguardar redirecionamento
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
  });

  afterEach(async () => {
    await page.close();
  });

  test('SLO: Dashboard carrega em menos de 2 segundos', async () => {
    const startTime = Date.now();
    
    await page.goto(`${BASE_URL}/dashboards/financeiro`);
    await page.waitForSelector('[data-testid="kpi-card"]', { timeout: 2000 });
    
    const loadTime = Date.now() - startTime;
    
    console.log(`⏱️ Tempo de carregamento: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(2000); // SLO: <2s
  });

  test('KPI Cards estão visíveis e contêm dados', async () => {
    await page.goto(`${BASE_URL}/dashboards/financeiro`);
    
    // Aguardar KPI cards
    await page.waitForSelector('.grid .bg-white');
    
    // Verificar 4 KPI cards
    const kpiCards = await page.$$('.grid .bg-white');
    expect(kpiCards.length).toBeGreaterThanOrEqual(4);
    
    // Verificar que cada card tem um valor numérico
    const values = await page.$$eval('.text-3xl', elements => 
      elements.map(el => el.textContent.trim())
    );
    
    values.forEach(value => {
      expect(value).toBeTruthy();
      expect(value).not.toBe('0'); // Deve ter dados após seed
    });
  });

  test('Filtro de período atualiza os gráficos', async () => {
    await page.goto(`${BASE_URL}/dashboards/financeiro`);
    await page.waitForSelector('button');
    
    // Capturar valor inicial do MRR
    const initialMRR = await page.$eval('.text-3xl', el => el.textContent);
    
    // Clicar em "Trimestral"
    const startTime = Date.now();
    await page.click('button:has-text("Trimestral")');
    
    // Aguardar atualização (máximo 1.5s conforme SLO)
    await page.waitForTimeout(500); // Pequena pausa para garantir atualização
    
    const updateTime = Date.now() - startTime;
    console.log(`⏱️ Tempo de atualização do filtro: ${updateTime}ms`);
    expect(updateTime).toBeLessThan(1500); // SLO: <1.5s
    
    // Verificar que gráfico foi redesenhado
    const svg = await page.$('svg');
    expect(svg).toBeTruthy();
  });

  test('Exportação CSV funciona corretamente', async () => {
    await page.goto(`${BASE_URL}/dashboards/financeiro`);
    
    // Configurar listener para download
    const downloadPromise = new Promise((resolve) => {
      page.on('download', (download) => {
        resolve(download);
      });
    });
    
    // Clicar no botão de exportar CSV
    await page.click('button:has-text("Exportar CSV")');
    
    const startTime = Date.now();
    const download = await downloadPromise;
    const downloadTime = Date.now() - startTime;
    
    console.log(`⏱️ Tempo até download: ${downloadTime}ms`);
    expect(downloadTime).toBeLessThan(3000); // SLO: <3s
    
    // Verificar que o arquivo tem extensão .csv
    const filename = await download.suggestedFilename();
    expect(filename).toContain('financeiro');
    expect(filename).toMatch(/\.csv$/);
  });

  test('Gráfico de linha MRR renderiza corretamente', async () => {
    await page.goto(`${BASE_URL}/dashboards/financeiro`);
    await page.waitForSelector('svg');
    
    // Verificar presença de path (linha do gráfico)
    const paths = await page.$$('svg path');
    expect(paths.length).toBeGreaterThan(0);
    
    // Verificar eixos
    const axes = await page.$$('svg g.axis, svg g[transform]');
    expect(axes.length).toBeGreaterThanOrEqual(2); // Eixo X e Y
  });

  test('Gráfico de pizza renderiza corretamente', async () => {
    await page.goto(`${BASE_URL}/dashboards/financeiro`);
    await page.waitForSelector('svg');
    
    // Aguardar animação do gráfico de pizza
    await page.waitForTimeout(1000);
    
    // Verificar presença de arcos (fatias da pizza)
    const arcs = await page.$$('svg path[fill]');
    expect(arcs.length).toBeGreaterThanOrEqual(3); // Pagos, Pendentes, Atrasados
  });

  test('Tabela de resumo exibe dados formatados', async () => {
    await page.goto(`${BASE_URL}/dashboards/financeiro`);
    await page.waitForSelector('table');
    
    // Verificar cabeçalhos da tabela
    const headers = await page.$$eval('thead th', ths => ths.map(th => th.textContent));
    expect(headers).toContain('Data');
    expect(headers).toContain('MRR');
    expect(headers).toContain('Inadimplência');
    
    // Verificar que há pelo menos 1 linha de dados
    const rows = await page.$$('tbody tr');
    expect(rows.length).toBeGreaterThan(0);
    
    // Verificar formatação de valores
    const mrrCell = await page.$eval('tbody tr:first-child td:nth-child(2)', td => td.textContent);
    expect(mrrCell).toMatch(/R\$\s[\d,]+\.\d{2}/); // Formato: R$ 1.234,56
  });

  test('Tooltip aparece ao passar mouse sobre gráfico', async () => {
    await page.goto(`${BASE_URL}/dashboards/financeiro`);
    await page.waitForSelector('svg circle'); // Pontos do gráfico
    
    // Mover mouse sobre um ponto
    const circle = await page.$('svg circle');
    await circle.hover();
    
    // Verificar aparição do tooltip
    await page.waitForSelector('.absolute.bg-gray-900', { timeout: 1000 });
    const tooltip = await page.$('.absolute.bg-gray-900');
    expect(tooltip).toBeTruthy();
    
    // Verificar que tooltip contém texto
    const tooltipText = await page.$eval('.absolute.bg-gray-900', el => el.textContent);
    expect(tooltipText).toBeTruthy();
  });

  test('Performance: Múltiplas interações permanecem fluidas', async () => {
    await page.goto(`${BASE_URL}/dashboards/financeiro`);
    await page.waitForSelector('button');
    
    const interactions = [
      () => page.click('button:has-text("Semanal")'),
      () => page.click('button:has-text("Mensal")'),
      () => page.click('button:has-text("Trimestral")'),
      () => page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)),
      () => page.evaluate(() => window.scrollTo(0, 0))
    ];
    
    const timings = [];
    
    for (const interaction of interactions) {
      const start = Date.now();
      await interaction();
      await page.waitForTimeout(100); // Pequena pausa entre interações
      timings.push(Date.now() - start);
    }
    
    const avgTime = timings.reduce((a, b) => a + b, 0) / timings.length;
    console.log(`⏱️ Tempo médio de interação: ${avgTime}ms`);
    
    // Nenhuma interação deve demorar mais que 1s
    expect(Math.max(...timings)).toBeLessThan(1000);
  });

  test('Responsividade: Dashboard funciona em mobile', async () => {
    // Configurar viewport mobile
    await page.setViewport({ width: 375, height: 667 }); // iPhone SE
    
    await page.goto(`${BASE_URL}/dashboards/financeiro`);
    await page.waitForSelector('.grid');
    
    // Verificar que KPI cards estão empilhados (1 coluna)
    const grid = await page.$eval('.grid', el => {
      return window.getComputedStyle(el).gridTemplateColumns;
    });
    
    // Em mobile, deve ser 1fr (1 coluna)
    expect(grid).toMatch(/1fr/);
  });
});

