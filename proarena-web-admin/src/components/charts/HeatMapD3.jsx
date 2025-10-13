import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export default function HeatMapD3({ data, width = 700, height = 400 }) {
  const svgRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Limpar SVG anterior
    d3.select(svgRef.current).selectAll('*').remove();

    const margin = { top: 50, right: 30, bottom: 70, left: 100 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Criar SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Extrair eixos únicos
    const xValues = [...new Set(data.map(d => d.dia_semana))];
    const yValues = [...new Set(data.map(d => d.turma))];

    // Escalas
    const x = d3.scaleBand()
      .domain(xValues)
      .range([0, innerWidth])
      .padding(0.05);

    const y = d3.scaleBand()
      .domain(yValues)
      .range([0, innerHeight])
      .padding(0.05);

    // Escala de cor
    const colorScale = d3.scaleSequential()
      .domain([0, d3.max(data, d => +d.frequencia)])
      .interpolator(d3.interpolateBlues);

    // Eixos
    svg.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .style('text-anchor', 'middle')
      .attr('font-size', '12px');

    svg.append('g')
      .call(d3.axisLeft(y))
      .selectAll('text')
      .attr('font-size', '11px');

    // Tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'absolute bg-gray-900 text-white px-3 py-2 rounded text-sm pointer-events-none opacity-0 transition-opacity z-50')
      .style('position', 'absolute');

    // Células do heat map
    svg.selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', d => x(d.dia_semana))
      .attr('y', d => y(d.turma))
      .attr('width', x.bandwidth())
      .attr('height', y.bandwidth())
      .attr('fill', d => colorScale(+d.frequencia))
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .style('opacity', 0)
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .style('opacity', 1)
          .attr('stroke-width', 3);
        
        tooltip
          .style('opacity', 1)
          .html(`<strong>${d.turma}</strong><br/>${d.dia_semana}<br/>Frequência: ${(+d.frequencia).toFixed(1)}%`);
      })
      .on('mousemove', function(event) {
        tooltip
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 10}px`);
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .style('opacity', 0.8)
          .attr('stroke-width', 2);
        
        tooltip.style('opacity', 0);
      })
      .transition()
      .duration(800)
      .delay((d, i) => i * 10)
      .style('opacity', 0.8);

    // Texto dentro das células
    svg.selectAll('text.cell-text')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'cell-text')
      .attr('x', d => x(d.dia_semana) + x.bandwidth() / 2)
      .attr('y', d => y(d.turma) + y.bandwidth() / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .attr('fill', d => +d.frequencia > 50 ? 'white' : '#1f2937')
      .style('opacity', 0)
      .text(d => `${(+d.frequencia).toFixed(0)}%`)
      .transition()
      .delay(800)
      .duration(300)
      .style('opacity', 1);

    // Legenda de cores
    const legendWidth = 200;
    const legendHeight = 10;

    const legendScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => +d.frequencia)])
      .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale)
      .ticks(5)
      .tickFormat(d => `${d}%`);

    const legend = svg.append('g')
      .attr('transform', `translate(${innerWidth - legendWidth}, ${innerHeight + 40})`);

    // Gradiente
    const defs = svg.append('defs');
    const linearGradient = defs.append('linearGradient')
      .attr('id', 'legend-gradient');

    linearGradient.selectAll('stop')
      .data(d3.range(0, 1.1, 0.1))
      .enter()
      .append('stop')
      .attr('offset', d => `${d * 100}%`)
      .attr('stop-color', d => colorScale(d * d3.max(data, item => +item.frequencia)));

    legend.append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .style('fill', 'url(#legend-gradient)');

    legend.append('g')
      .attr('transform', `translate(0,${legendHeight})`)
      .call(legendAxis)
      .select('.domain')
      .remove();

    // Cleanup
    return () => {
      tooltip.remove();
    };
  }, [data, width, height]);

  return <svg ref={svgRef} className="w-full"></svg>;
}

