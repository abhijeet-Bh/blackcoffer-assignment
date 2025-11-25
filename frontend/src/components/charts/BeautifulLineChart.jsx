import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";

/**
 * BeautifulLineChart
 * Props:
 *  - data: [{ year: 2017, avgIntensity: 4.5, count: 10 }, ...]
 *  - xKey: "year"
 *  - yKey: "avgIntensity"
 *  - height: pixel height (default 320)
 *
 * Usage:
 *  <BeautifulLineChart data={ts} xKey="year" yKey="avgIntensity" />
 */

export default function BeautifulLineChart({
  data = [],
  xKey = "year",
  yKey = "avgIntensity",
  height = 320,
}) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height });

  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    content: null,
  });

  // Resize observer for responsiveness
  useEffect(() => {
    const obs = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const cr = entry.contentRect;
        setDimensions((d) => ({
          ...d,
          width: Math.max(300, Math.floor(cr.width)),
        }));
      }
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // draw chart on data/dim change
  useEffect(() => {
    if (!data || data.length === 0) {
      d3.select(svgRef.current).selectAll("*").remove();
      return;
    }

    // parse & sort data
    const parsed = data
      .map((d) => ({
        ...d,
        _x: +d[xKey],
        _y: d[yKey] === null || d[yKey] === undefined ? 0 : +d[yKey],
      }))
      .filter((d) => !Number.isNaN(d._x))
      .sort((a, b) => a._x - b._x);

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // clear

    const margin = { top: 18, right: 22, bottom: 36, left: 56 };
    const w = dimensions.width - margin.left - margin.right;
    const h = dimensions.height - margin.top - margin.bottom;

    // defs: gradient for stroke and area
    const defs = svg.append("defs");

    // stroke gradient
    const grad = defs
      .append("linearGradient")
      .attr("id", "stroke-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");
    grad.append("stop").attr("offset", "0%").attr("stop-color", "#4f1787");
    grad.append("stop").attr("offset", "50%").attr("stop-color", "#4f1787");
    grad.append("stop").attr("offset", "100%").attr("stop-color", "#4f1787");

    // area gradient (vertical fade)
    const areaGrad = defs
      .append("linearGradient")
      .attr("id", "area-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");
    areaGrad
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#4f1787")
      .attr("stop-opacity", 0.18);
    areaGrad
      .append("stop")
      .attr("offset", "60%")
      .attr("stop-color", "#4f1787")
      .attr("stop-opacity", 0.05);
    areaGrad
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#4f1787")
      .attr("stop-opacity", 0);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // scales
    const xDomain = d3.extent(parsed, (d) => d._x);
    // handle single point
    if (xDomain[0] === xDomain[1])
      (xDomain[0] = xDomain[0] - 1), (xDomain[1] = xDomain[1] + 1);
    const x = d3.scaleLinear().domain(xDomain).range([0, w]).nice();

    const yMax = d3.max(parsed, (d) => d._y) || 1;
    const y = d3
      .scaleLinear()
      .domain([0, yMax * 1.12])
      .range([h, 0])
      .nice();

    // axes
    const xAxis = d3
      .axisBottom(x)
      .ticks(Math.min(parsed.length, 10))
      .tickFormat(d3.format("d"));
    const yAxis = d3.axisLeft(y).ticks(5);

    g.append("g")
      .attr("transform", `translate(0,${h})`)
      .call(xAxis)
      .call((g) => g.selectAll(".domain").attr("stroke", "#4f1787"))
      .call((g) =>
        g.selectAll("text").attr("fill", "#4f1787").attr("font-size", 12)
      );

    g.append("g")
      .call(yAxis)
      .call((g) => g.selectAll(".domain").remove())
      .call((g) => g.selectAll("line").attr("stroke", "#4f1787"))
      .call((g) =>
        g.selectAll("text").attr("fill", "#4f1787").attr("font-size", 12)
      );

    // area generator (smooth)
    const area = d3
      .area()
      .x((d) => x(d._x))
      .y0(h)
      .y1((d) => y(d._y))
      .curve(d3.curveMonotoneX);

    // line generator (smooth)
    const line = d3
      .line()
      .x((d) => x(d._x))
      .y((d) => y(d._y))
      .curve(d3.curveMonotoneX);

    // area path
    g.append("path")
      .datum(parsed)
      .attr("fill", "url(#area-gradient)")
      .attr("d", area)
      .attr("opacity", 0)
      .transition()
      .duration(600)
      .attr("opacity", 1);

    // line path with gradient stroke
    const linePath = g
      .append("path")
      .datum(parsed)
      .attr("fill", "none")
      .attr("stroke", "url(#stroke-gradient)")
      .attr("stroke-width", 3.2)
      .attr("stroke-linecap", "round")
      .attr("d", line)
      .attr("stroke-dasharray", function () {
        return this.getTotalLength();
      })
      .attr("stroke-dashoffset", function () {
        return this.getTotalLength();
      })
      .transition()
      .duration(900)
      .attr("stroke-dashoffset", 0);

    // subtle glow using duplicated thicker translucent stroke
    g.append("path")
      .datum(parsed)
      .attr("fill", "none")
      .attr("stroke", "#93c5fd")
      .attr("stroke-width", 8)
      .attr("stroke-opacity", 0.04)
      .attr("d", line);

    // hover overlay for interactions
    const overlay = g
      .append("rect")
      .attr("width", w)
      .attr("height", h)
      .attr("fill", "transparent")
      .style("cursor", "crosshair");

    // marker circle
    const marker = g
      .append("circle")
      .attr("r", 5.5)
      .attr("fill", "#fff")
      .attr("stroke", "#3b82f6")
      .attr("stroke-width", 2)
      .attr("opacity", 0);

    // mousemove handler
    overlay
      .on("mousemove", (event) => {
        const [mx] = d3.pointer(event);
        const xVal = x.invert(mx);
        // find nearest point
        const bis = d3.bisector((d) => d._x).left;
        const i = bis(parsed, xVal);
        const p0 = parsed[i - 1];
        const p1 = parsed[i];
        const nearest = !p0 || (p1 && xVal - p0._x > p1._x - xVal) ? p1 : p0;
        if (!nearest) return;
        const cx = x(nearest._x);
        const cy = y(nearest._y);

        // marker
        marker.attr("cx", cx).attr("cy", cy).attr("opacity", 1);

        // tooltip state (position relative to container)
        const containerRect = containerRef.current.getBoundingClientRect();
        setTooltip({
          visible: true,
          x: containerRect.left + margin.left + cx + 8,
          y: containerRect.top + margin.top + cy - 8,
          content: {
            label: nearest._x,
            value: nearest._y,
            count: nearest.count,
            raw: nearest,
          },
        });
      })
      .on("mouseleave", () => {
        marker.attr("opacity", 0);
        setTooltip((t) => ({ ...t, visible: false }));
      });

    // Small circles for each point (for hover affordance, low opacity)
    g.selectAll(".dot")
      .data(parsed)
      .join("circle")
      .attr("class", "dot")
      .attr("cx", (d) => x(d._x))
      .attr("cy", (d) => y(d._y))
      .attr("r", 3.2)
      .attr("fill", "#3b82f6")
      .attr("opacity", 0.0) // hide until hover - keeps DOM small and interaction smooth
      .on("mouseover", function (event, d) {
        d3.select(this).attr("opacity", 1);
      })
      .on("mouseout", function () {
        d3.select(this).attr("opacity", 0);
      });

    // axes labels
    svg
      .append("text")
      .attr("x", margin.left + w / 2)
      .attr("y", margin.top + h + 34)
      .attr("text-anchor", "middle")
      .attr("fill", "#64748b")
      .attr("font-size", 12)
      .text(xKey);

    svg
      .append("text")
      .attr("transform", `translate(${14}, ${margin.top + h / 2}) rotate(-90)`)
      .attr("text-anchor", "middle")
      .attr("fill", "#64748b")
      .attr("font-size", 12)
      .text(yKey);
  }, [data, dimensions.width, dimensions.height, xKey, yKey]);

  return (
    <div ref={containerRef} className="w-full" style={{ position: "relative" }}>
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} />
      {tooltip.visible && tooltip.content && (
        <div
          style={{
            position: "fixed",
            left: tooltip.x,
            top: tooltip.y,
            transform: "translate(-8px,-100%)",
            pointerEvents: "none",
            background: "linear-gradient(180deg, #0ea5b0, #3b82f6)",
            color: "white",
            padding: "8px 10px",
            borderRadius: 8,
            boxShadow: "0 6px 18px rgba(15,23,42,0.18)",
            fontSize: 12,
            minWidth: 120,
            zIndex: 9999,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600 }}>
            {tooltip.content.label}
          </div>
          <div style={{ opacity: 0.95 }}>
            Avg intensity: <strong>{tooltip.content.value}</strong>
          </div>
          {tooltip.content.count !== undefined && (
            <div style={{ opacity: 0.9, fontSize: 12 }}>
              Count: {tooltip.content.count}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
