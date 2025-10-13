import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export default function PieChartD3({ data, labelKey, valueKey, width = 300, height = 300, colors = d3.schemeTableau10 }) {
  const svgRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Limpar SVG anterior
    d3.select(svgRef.current).selectAll('*').remove();

    const radius = Math.min(width, height) / 2;

    // Criar SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    // Cor
    const color = d3.scaleOrdinal()
      .domain(data.map(d => d[labelKey]))
      .range(colors);

    // Pie generator
    const pie = d3.pie()
      .value(d => +d[valueKey])
      .sort(null);

    // Arc generator
    const arc = d3.arc()
      .innerRadius(0)
      .outerRadius(radius - 10);

    const arcHover = d3.arc()
      .innerRadius(0)
      .outerRadius(radius);

    // Tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'absolute bg-gray-900 text-white px-3 py-2 rounded text-sm pointer-events-none opacity-0 transition-opacity z-50')
      .style('position', 'absolute');

    // Desenhar arcos
    const arcs = svg.selectAll('arc')
      .data(pie(data))
      .enter()
      .append('g')
      .attr('class', 'arc');

    arcs.append('path')
      .attr('d', arc)
      .attr('fill', d => color(d.data[labelKey]))
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .style('opacity', 0)
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', arcHover)
          .style('opacity', 1);
        
        tooltip
          .style('opacity', 1)
          .html(`<strong>${d.data[labelKey]}</strong><br/>${(+d.data[valueKey]).toLocaleString('pt-BR')} (${((d.data[valueKey] / d3.sum(data, item => +item[valueKey])) * 100).toFixed(1)}%)`);
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
          .attr('d', arc)
          .style('opacity', 0.9);
        
        tooltip.style('opacity', 0);
      })
      .transition()
      .duration(800)
      .attrTween('d', function(d) {
        const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return function(t) {
          return arc(interpolate(t));
        };
      })
      .style('opacity', 0.9);

    // Labels
    arcs.append('text')
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', 'white')
      .style('opacity', 0)
      .text(d => {
        const percent = (d.data[valueKey] / d3.sum(data, item => +item[valueKey])) * 100;
        return percent > 5 ? `${percent.toFixed(0)}%` : '';
      })
      .transition()
      .delay(800)
      .duration(300)
      .style('opacity', 1);

    // Legenda
    const legend = svg.selectAll('.legend')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'legend')
      .attr('transform', (d, i) => `translate(${radius + 20},${-radius + i * 25})`);

    legend.append('rect')
      .attr('width', 18)
      .attr('height', 18)
      .attr('fill', d => color(d[labelKey]))
      .style('opacity', 0)
      .transition()
      .delay(800)
      .duration(300)
      .style('opacity', 1);

    legend.append('text')
      .attr('x', 24)
      .attr('y', 9)
      .attr('dy', '.35em')
      .attr('font-size', '12px')
      .text(d => d[labelKey])
      .style('opacity', 0)
      .transition()
      .delay(800)
      .duration(300)
      .style('opacity', 1);

    // Cleanup
    return () => {
      tooltip.remove();
    };
  }, [data, labelKey, valueKey, width, height, colors]);

  return <svg ref={svgRef} className="w-full"></svg>;
}

