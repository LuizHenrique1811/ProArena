import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export default function LineChartD3({ data, xKey, yKey, width = 600, height = 300, color = '#0ea5e9' }) {
  const svgRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Limpar SVG anterior
    d3.select(svgRef.current).selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Criar SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Escalas
    const x = d3.scaleTime()
      .domain(d3.extent(data, d => new Date(d[xKey])))
      .range([0, innerWidth]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => +d[yKey]) * 1.1])
      .nice()
      .range([innerHeight, 0]);

    // Eixos
    const xAxis = d3.axisBottom(x)
      .ticks(6)
      .tickFormat(d3.timeFormat('%d/%m'));

    const yAxis = d3.axisLeft(y)
      .ticks(5);

    svg.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)');

    svg.append('g')
      .call(yAxis);

    // Linha
    const line = d3.line()
      .x(d => x(new Date(d[xKey])))
      .y(d => y(+d[yKey]))
      .curve(d3.curveMonotoneX);

    // Área sob a linha
    const area = d3.area()
      .x(d => x(new Date(d[xKey])))
      .y0(innerHeight)
      .y1(d => y(+d[yKey]))
      .curve(d3.curveMonotoneX);

    // Adicionar área (gradiente)
    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', 'line-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', color)
      .attr('stop-opacity', 0.3);

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', color)
      .attr('stop-opacity', 0);

    svg.append('path')
      .datum(data)
      .attr('fill', 'url(#line-gradient)')
      .attr('d', area);

    // Adicionar linha
    const path = svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 2)
      .attr('d', line);

    // Animação da linha
    const totalLength = path.node().getTotalLength();
    path
      .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(1000)
      .ease(d3.easeLinear)
      .attr('stroke-dashoffset', 0);

    // Tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'absolute bg-gray-900 text-white px-3 py-2 rounded text-sm pointer-events-none opacity-0 transition-opacity z-50')
      .style('position', 'absolute');

    // Pontos interativos
    svg.selectAll('circle')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', d => x(new Date(d[xKey])))
      .attr('cy', d => y(+d[yKey]))
      .attr('r', 0)
      .attr('fill', color)
      .transition()
      .delay((d, i) => i * 50)
      .duration(300)
      .attr('r', 4);

    svg.selectAll('circle')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 6);
        
        tooltip
          .style('opacity', 1)
          .html(`<strong>${new Date(d[xKey]).toLocaleDateString('pt-BR')}</strong><br/>${yKey}: ${(+d[yKey]).toLocaleString('pt-BR')}`);
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
          .attr('r', 4);
        
        tooltip.style('opacity', 0);
      });

    // Cleanup
    return () => {
      tooltip.remove();
    };
  }, [data, xKey, yKey, width, height, color]);

  return <svg ref={svgRef} className="w-full"></svg>;
}

