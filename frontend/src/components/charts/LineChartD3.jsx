import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

export default function LineChartD3({
  data = [],
  xKey = "year",
  yKey = "avgIntensity",
  width = 600,
  height = 300,
}) {
  const ref = useRef();

  useEffect(() => {
    if (!data || data.length === 0) {
      d3.select(ref.current).selectAll("*").remove();
      return;
    }
    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const margin = { top: 10, right: 20, bottom: 30, left: 40 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleLinear()
      .domain(d3.extent(data, (d) => +d[xKey]))
      .nice()
      .range([0, w]);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => +d[yKey] || 0)])
      .nice()
      .range([h, 0]);

    const line = d3
      .line()
      .x((d) => x(+d[xKey]))
      .y((d) => y(+d[yKey]));

    g.append("g")
      .attr("transform", `translate(0,${h})`)
      .call(d3.axisBottom(x).tickFormat(d3.format("d")));
    g.append("g").call(d3.axisLeft(y));

    g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 2)
      .attr("d", line);
  }, [data, xKey, yKey, width, height]);

  return <svg ref={ref} width={width} height={height}></svg>;
}
