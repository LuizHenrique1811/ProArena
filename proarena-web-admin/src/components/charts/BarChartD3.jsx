import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export default function BarChartD3({ data, xKey, yKey, width = 600, height = 300, color = '#0ea5e9', horizontal = false }) {
  const svgRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Limpar SVG anterior
    d3.select(svgRef.current).selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 60, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Criar SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    if (horizontal) {
      // Barras horizontais
      const x = d3.scaleLinear()
        .domain([0, d3.max(data, d => +d[yKey]) * 1.1])
        .nice()
        .range([0, innerWidth]);

      const y = d3.scaleBand()
        .domain(data.map(d => d[xKey]))
        .range([0, innerHeight])
        .padding(0.2);

      // Eixos
      svg.append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(d3.axisBottom(x));

      svg.append('g')
        .call(d3.axisLeft(y))
        .selectAll('text')
        .attr('font-size', '11px');

      // Tooltip
      const tooltip = d3.select('body').append('div')
        .attr('class', 'absolute bg-gray-900 text-white px-3 py-2 rounded text-sm pointer-events-none opacity-0 transition-opacity z-50')
        .style('position', 'absolute');

      // Barras
      svg.selectAll('rect')
        .data(data)
        .enter()
        .append('rect')
        .attr('x', 0)
        .attr('y', d => y(d[xKey]))
        .attr('width', 0)
        .attr('height', y.bandwidth())
        .attr('fill', color)
        .on('mouseover', function(event, d) {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('opacity', 0.7);
          
          tooltip
            .style('opacity', 1)
            .html(`<strong>${d[xKey]}</strong><br/>${yKey}: ${(+d[yKey]).toLocaleString('pt-BR')}`);
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
            .attr('opacity', 1);
          
          tooltip.style('opacity', 0);
        })
        .transition()
        .duration(800)
        .delay((d, i) => i * 50)
        .attr('width', d => x(+d[yKey]));

      // Labels
      svg.selectAll('text.label')
        .data(data)
        .enter()
        .append('text')
        .attr('class', 'label')
        .attr('x', d => x(+d[yKey]) + 5)
        .attr('y', d => y(d[xKey]) + y.bandwidth() / 2)
        .attr('dy', '.35em')
        .attr('font-size', '11px')
        .style('opacity', 0)
        .text(d => (+d[yKey]).toLocaleString('pt-BR'))
        .transition()
        .delay(800)
        .duration(300)
        .style('opacity', 1);

      return () => {
        tooltip.remove();
      };
    } else {
      // Barras verticais
      const x = d3.scaleBand()
        .domain(data.map(d => d[xKey]))
        .range([0, innerWidth])
        .padding(0.2);

      const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => +d[yKey]) * 1.1])
        .nice()
        .range([innerHeight, 0]);

      // Eixos
      svg.append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(d3.axisBottom(x))
        .selectAll('text')
        .style('text-anchor', 'end')
        .attr('dx', '-.8em')
        .attr('dy', '.15em')
        .attr('transform', 'rotate(-45)')
        .attr('font-size', '11px');

      svg.append('g')
        .call(d3.axisLeft(y));

      // Tooltip
      const tooltip = d3.select('body').append('div')
        .attr('class', 'absolute bg-gray-900 text-white px-3 py-2 rounded text-sm pointer-events-none opacity-0 transition-opacity z-50')
        .style('position', 'absolute');

      // Barras
      svg.selectAll('rect')
        .data(data)
        .enter()
        .append('rect')
        .attr('x', d => x(d[xKey]))
        .attr('y', innerHeight)
        .attr('width', x.bandwidth())
        .attr('height', 0)
        .attr('fill', color)
        .on('mouseover', function(event, d) {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('opacity', 0.7);
          
          tooltip
            .style('opacity', 1)
            .html(`<strong>${d[xKey]}</strong><br/>${yKey}: ${(+d[yKey]).toLocaleString('pt-BR')}`);
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
            .attr('opacity', 1);
          
          tooltip.style('opacity', 0);
        })
        .transition()
        .duration(800)
        .delay((d, i) => i * 50)
        .attr('y', d => y(+d[yKey]))
        .attr('height', d => innerHeight - y(+d[yKey]));

      // Labels
      svg.selectAll('text.label')
        .data(data)
        .enter()
        .append('text')
        .attr('class', 'label')
        .attr('x', d => x(d[xKey]) + x.bandwidth() / 2)
        .attr('y', d => y(+d[yKey]) - 5)
        .attr('text-anchor', 'middle')
        .attr('font-size', '11px')
        .style('opacity', 0)
        .text(d => (+d[yKey]).toLocaleString('pt-BR'))
        .transition()
        .delay(800)
        .duration(300)
        .style('opacity', 1);

      return () => {
        tooltip.remove();
      };
    }
  }, [data, xKey, yKey, width, height, color, horizontal]);

  return <svg ref={svgRef} className="w-full"></svg>;
}

