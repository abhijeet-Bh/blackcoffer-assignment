// src/components/charts/RadarChartD3.jsx
import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

/**
 * RadarChart
 * - data: [{ sector, intensity, likelihood, relevance, count }, ... ]
 * - maxItems: show top N sectors by count
 */
export default function RadarChart({ data = [], maxItems = 6, size = 340 }) {
  const ref = useRef();

  useEffect(() => {
    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();
    if (!data || data.length === 0) {
      svg
        .append("text")
        .attr("x", size / 2)
        .attr("y", size / 2)
        .attr("text-anchor", "middle")
        .text("No data");
      return;
    }

    // Top N sectors by count
    const items = data
      .slice()
      .sort((a, b) => (b.count || 0) - (a.count || 0))
      .slice(0, maxItems);

    // metrics (axes)
    const metrics = ["intensity", "likelihood", "relevance"];
    const margin = 18;
    const w = size;
    const h = size;
    const radius = Math.min(w, h) / 2 - margin;

    const g = svg
      .attr("viewBox", `0 0 ${w} ${h}`)
      .append("g")
      .attr("transform", `translate(${w / 2},${h / 2})`);

    // scale for values (0..max)
    const maxVal = Math.max(
      1,
      d3.max(items.flatMap((d) => metrics.map((m) => Math.abs(d[m] || 0))))
    );

    const angleSlice = (Math.PI * 2) / metrics.length;

    // radial scale
    const rScale = d3.scaleLinear().range([0, radius]).domain([0, maxVal]);

    // circular grid
    const levels = 4;
    for (let lvl = 1; lvl <= levels; lvl++) {
      g.append("circle")
        .attr("r", radius * (lvl / levels))
        .attr("fill", "none")
        .attr("stroke", "#e6eef9")
        .attr("stroke-dasharray", "2,2")
        .attr("stroke-width", 1);
    }

    // axis lines and labels
    const axis = g
      .selectAll(".axis")
      .data(metrics)
      .enter()
      .append("g")
      .attr("class", "axis");

    axis
      .append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr(
        "x2",
        (d, i) => rScale(maxVal * 1.05) * Math.cos(angleSlice * i - Math.PI / 2)
      )
      .attr(
        "y2",
        (d, i) => rScale(maxVal * 1.05) * Math.sin(angleSlice * i - Math.PI / 2)
      )
      .attr("stroke", "#cfe7ff")
      .attr("stroke-width", 1);

    axis
      .append("text")
      .attr(
        "x",
        (d, i) => rScale(maxVal * 1.12) * Math.cos(angleSlice * i - Math.PI / 2)
      )
      .attr(
        "y",
        (d, i) => rScale(maxVal * 1.12) * Math.sin(angleSlice * i - Math.PI / 2)
      )
      .attr("dy", "0.35em")
      .attr("font-size", 11)
      .attr("text-anchor", "middle")
      .attr("fill", "#0f172a")
      .text((d) => d);

    // color scale
    const color = d3.scaleOrdinal(d3.schemeTableau10);

    // radar line generator
    const radarLine = d3
      .lineRadial()
      .radius((d) => rScale(d.value))
      .angle((d, i) => i * angleSlice)
      .curve(d3.curveCardinalClosed);

    // for each sector add polygon
    const group = g
      .selectAll(".sector")
      .data(items)
      .enter()
      .append("g")
      .attr("class", "sector");

    group
      .append("path")
      .attr("d", (d) =>
        radarLine(metrics.map((m) => ({ axis: m, value: d[m] || 0 })))
      )
      .attr("fill", (d, i) => color(i))
      .attr("fill-opacity", 0.12)
      .attr("stroke", (d, i) => color(i))
      .attr("stroke-width", 2)
      .attr("transform", "rotate(0)")
      .attr("opacity", 0)
      .transition()
      .duration(700)
      .attr("opacity", 1);

    // circles on vertices and tooltips
    group
      .selectAll(".dot")
      .data((d) =>
        metrics.map((m) => ({ sector: d.sector, metric: m, value: d[m] || 0 }))
      )
      .enter()
      .append("circle")
      .attr(
        "cx",
        (d, i) => rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2)
      )
      .attr(
        "cy",
        (d, i) => rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2)
      )
      .attr("r", 3)
      .attr("fill", (d, i, j) => color(j))
      .attr("opacity", 0.9)
      .on("mouseenter", function (event, d) {
        const node = d3.select(this);
        node.transition().attr("r", 5);
        // tooltip using title attribute
        const tip = `${d.sector} — ${d.metric}: ${d.value}`;
        tooltipDiv.style.display = "block";
        tooltipDiv.innerText = tip;
      })
      .on("mouseleave", function () {
        d3.select(this).transition().attr("r", 3);
        tooltipDiv.style.display = "none";
      });

    // legend
    const legend = svg
      .append("g")
      .attr("transform", `translate(${w - 8 - 110},${12})`);
    items.forEach((it, i) => {
      const gL = legend
        .append("g")
        .attr("transform", `translate(0, ${i * 18})`);
      gL.append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", color(i))
        .attr("rx", 2);
      gL.append("text")
        .attr("x", 18)
        .attr("y", 10)
        .attr("font-size", 12)
        .attr("fill", "#0f172a")
        .text(it.sector);
    });

    // tooltip div (DOM)
    let tooltipDiv = d3.select(ref.current.parentNode).select(".radar-tooltip");
    if (tooltipDiv.empty()) {
      tooltipDiv = d3
        .select(ref.current.parentNode)
        .append("div")
        .attr("class", "radar-tooltip")
        .style("position", "absolute")
        .style("pointer-events", "none")
        .style("background", "rgba(15,23,42,0.9)")
        .style("color", "white")
        .style("padding", "6px 8px")
        .style("border-radius", "6px")
        .style("font-size", "12px")
        .style("display", "none");
    }

    // cleanup
    return () => {
      svg.selectAll("*").remove();
      d3.select(ref.current.parentNode).select(".radar-tooltip").remove();
    };
  }, [data, maxItems, size]);

  return <svg ref={ref} style={{ width: "100%", height: size }} />;
}
