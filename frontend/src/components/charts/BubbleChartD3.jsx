// src/components/charts/BubbleChartD3.jsx
import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";

/**
 * BubbleChart
 * data: [{ intensity, likelihood, relevance, region, sector, topic, year, title }, ...]
 */
export default function BubbleChart({ data = [], width = 420, height = 320 }) {
  const ref = useRef();
  const containerRef = useRef();
  const [pinned, setPinned] = useState(null); // pinned bubble on click

  useEffect(() => {
    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    // remove any existing tooltips from previous mounts
    d3.select("body").selectAll(".bubble-tip-fixed").remove();

    if (!data || data.length === 0) {
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .text("No data");
      return;
    }

    const margin = { top: 12, right: 12, bottom: 36, left: 48 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;
    const g = svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // filter valid points
    const pts = data.filter((d) => d.intensity != null && d.likelihood != null);
    if (pts.length === 0) {
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .text("No valid intensity/likelihood points");
      return;
    }

    const x = d3
      .scaleLinear()
      .domain(d3.extent(pts, (d) => +d.intensity))
      .nice()
      .range([0, w]);

    const y = d3
      .scaleLinear()
      .domain(d3.extent(pts, (d) => +d.likelihood))
      .nice()
      .range([h, 0]);

    const r = d3
      .scaleSqrt()
      .domain(d3.extent(pts, (d) => +d.relevance || 1))
      .range([3, 18]);

    // color by region
    const regions = Array.from(new Set(pts.map((d) => d.region || "Unknown")));
    const color = d3.scaleOrdinal().domain(regions).range(d3.schemeTableau10);

    // axes
    const xAxis = g
      .append("g")
      .attr("transform", `translate(0,${h})`)
      .call(d3.axisBottom(x));
    const yAxis = g.append("g").call(d3.axisLeft(y));

    // crosshair lines (hidden by default)
    const crosshair = g
      .append("g")
      .attr("class", "crosshair")
      .style("opacity", 0);
    const vLine = crosshair
      .append("line")
      .attr("stroke", "#94a3b8")
      .attr("stroke-dasharray", "3,3")
      .attr("stroke-width", 1);
    const hLine = crosshair
      .append("line")
      .attr("stroke", "#94a3b8")
      .attr("stroke-dasharray", "3,3")
      .attr("stroke-width", 1);

    // tooltip (fixed to body to avoid overflow)
    const body = d3.select("body");
    const tip = body
      .append("div")
      .attr("class", "bubble-tip-fixed")
      .style("position", "fixed")
      .style("pointer-events", "none")
      .style("display", "none")
      .style("background", "rgba(2,6,23,0.9)")
      .style("color", "white")
      .style("padding", "8px 10px")
      .style("border-radius", "8px")
      .style("font-size", "12px")
      .style("box-shadow", "0 10px 30px rgba(2,6,23,0.25)")
      .style("z-index", 9999);

    // helper to position tooltip and keep it inside viewport
    function positionTooltip(clientX, clientY) {
      tip.style("display", "block");
      const node = tip.node();
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const marginPx = 12;
      let left = clientX + marginPx;
      let top = clientY + marginPx;

      const maxRight = window.innerWidth - rect.width - marginPx;
      if (left > maxRight)
        left = Math.max(marginPx, clientX - rect.width - marginPx);

      const maxBottom = window.innerHeight - rect.height - marginPx;
      if (top > maxBottom)
        top = Math.max(marginPx, clientY - rect.height - marginPx);

      tip.style("left", left + "px").style("top", top + "px");
    }

    // create legend area (HTML legend for better control)
    const legendWidth = 140;
    const legendX = width - legendWidth;
    const legendGroup = svg
      .append("g")
      .attr("class", "legend-group")
      .attr("transform", `translate(${legendX}, 10)`);

    const legendItems = legendGroup
      .selectAll(".legend-item")
      .data(regions.slice(0, 8)) // show up to 8
      .enter()
      .append("g")
      .attr("class", "legend-item")
      .attr("transform", (d, i) => `translate(0, ${i * 18})`)
      .style("cursor", "pointer")
      .on("mouseenter", (event, reg) => {
        // highlight bubbles of this region
        g.selectAll("circle").attr("fill-opacity", (d) =>
          d.region === reg ? 0.95 : 0.15
        );
        d3.select(event.currentTarget)
          .select("rect")
          .attr("stroke", "#000")
          .attr("stroke-width", 1.4);
      })
      .on("mouseleave", (event) => {
        g.selectAll("circle").attr("fill-opacity", 0.85);
        d3.select(event.currentTarget).select("rect").attr("stroke", "none");
      })
      .on("click", (event, reg) => {
        // clicking a legend toggles filtering: we will pin only that region
        const currentlyPinned = pinned === reg;
        setPinned(currentlyPinned ? null : reg);
      });

    legendItems
      .append("rect")
      .attr("width", 12)
      .attr("height", 12)
      .attr("rx", 2)
      .attr("fill", (d) => color(d));
    legendItems
      .append("text")
      .attr("x", 16)
      .attr("y", 10)
      .attr("font-size", 12)
      .attr("fill", "#0f172a")
      .text((d) => d);

    // scatter nodes
    const nodes = g
      .selectAll("circle")
      .data(pts)
      .enter()
      .append("circle")
      .attr("cx", (d) => x(d.intensity))
      .attr("cy", (d) => y(d.likelihood))
      .attr("r", 0)
      .attr("fill", (d) => color(d.region || "Unknown"))
      .attr("fill-opacity", 0.85)
      .attr("stroke", "white")
      .attr("stroke-width", 1)
      .style("cursor", "pointer");

    // entrance animation
    nodes
      .transition()
      .duration(800)
      .delay((d, i) => i * 5)
      .attr("r", (d) => r(d.relevance || 1));

    // hover / interaction handlers
    let lastHovered = null;
    nodes
      .on("mousemove", function (event, d) {
        // if pinned and not the pinned element, do nothing
        if (pinned && pinned !== d.region) return;

        // enlarge and stroke current bubble
        d3.select(this)
          .raise()
          .transition()
          .duration(120)
          .attr("r", (d.relevance ? r(d.relevance) : r(1)) * 1.28)
          .attr("stroke-width", 2.4);

        // reduce others slightly
        g.selectAll("circle")
          .filter((o) => o !== d)
          .transition()
          .duration(120)
          .attr("fill-opacity", 0.18);

        // show crosshair lines (map point to container g coords)
        const [mx, my] = d3.pointer(event, g.node());
        vLine.attr("x1", mx).attr("x2", mx).attr("y1", 0).attr("y2", h);
        hLine.attr("y1", my).attr("y2", my).attr("x1", 0).attr("x2", w);
        crosshair.style("opacity", 1);

        // tooltip content
        const title = d.title ? d.title.slice(0, 120) : d.topic || "item";
        const html = `<div style="font-weight:700;margin-bottom:6px">${title}</div>
                      <div style="font-size:12px;color:#cbd5e1">Region: <strong>${
                        d.region || "Unknown"
                      }</strong></div>
                      <div style="font-size:12px;color:#cbd5e1">Country: ${
                        d.country || ""
                      }</div>
                      <div style="font-size:12px;color:#94a3b8;margin-top:6px">Intensity: <strong>${
                        d.intensity
                      }</strong> • Likelihood: <strong>${
          d.likelihood
        }</strong></div>
                      <div style="font-size:12px;color:#94a3b8">Relevance: <strong>${
                        d.relevance
                      }</strong></div>`;
        tip.html(html);
        positionTooltip(event.clientX, event.clientY);

        // highlight legend for this region (rect stroke)
        legendGroup
          .selectAll(".legend-item")
          .select("rect")
          .attr("stroke", (reg) => (reg === d.region ? "#000" : "none"))
          .attr("stroke-width", (reg) => (reg === d.region ? 1.4 : 0));

        lastHovered = this;
      })
      .on("mouseleave", function (event, d) {
        if (pinned && pinned !== d.region) return;
        // restore sizes and opacities
        d3.select(this)
          .transition()
          .duration(120)
          .attr("r", d.relevance ? r(d.relevance) : r(1))
          .attr("stroke-width", 1);
        g.selectAll("circle")
          .transition()
          .duration(120)
          .attr("fill-opacity", 0.85);
        crosshair.style("opacity", 0);
        tip.style("display", "none");
        legendGroup
          .selectAll(".legend-item")
          .select("rect")
          .attr("stroke", "none");
        lastHovered = null;
      })
      .on("click", function (event, d) {
        // clicking pins the tooltip / selection for this region
        if (pinned === d.region) {
          setPinned(null);
          // unpin: restore all
          g.selectAll("circle")
            .transition()
            .duration(120)
            .attr("fill-opacity", 0.85);
          legendGroup
            .selectAll(".legend-item")
            .select("rect")
            .attr("stroke", "none");
          tip.style("display", "none");
        } else {
          setPinned(d.region);
          // visually focus on pinned region
          g.selectAll("circle")
            .transition()
            .duration(120)
            .attr("fill-opacity", (o) => (o.region === d.region ? 0.95 : 0.12));
          legendGroup
            .selectAll(".legend-item")
            .select("rect")
            .attr("stroke", (reg) => (reg === d.region ? "#000" : "none"));
          // keep tooltip visible and pinned near the clicked bubble
          const title = d.title ? d.title.slice(0, 120) : d.topic || "item";
          const html = `<div style="font-weight:700;margin-bottom:6px">${title}</div>
                        <div style="font-size:12px;color:#cbd5e1">Region: <strong>${
                          d.region || "Unknown"
                        }</strong></div>
                        <div style="font-size:12px;color:#cbd5e1">Country: ${
                          d.country || ""
                        }</div>
                        <div style="font-size:12px;color:#94a3b8;margin-top:6px">Intensity: <strong>${
                          d.intensity
                        }</strong> • Likelihood: <strong>${
            d.likelihood
          }</strong></div>
                        <div style="font-size:12px;color:#94a3b8">Relevance: <strong>${
                          d.relevance
                        }</strong></div>`;
          tip.html(html);
          positionTooltip(event.clientX, event.clientY);
        }
      });

    // clicking the background (svg container) clears pinned selection
    svg.on("click", (event) => {
      // if click landed on a node, it'll have been handled; background click clears pin
      if (event.target.tagName === "svg" || event.target.tagName === "g") {
        setPinned(null);
        g.selectAll("circle")
          .transition()
          .duration(120)
          .attr("fill-opacity", 0.85);
        legendGroup
          .selectAll(".legend-item")
          .select("rect")
          .attr("stroke", "none");
        tip.style("display", "none");
      }
    });

    // responsive: when pinned is toggled externally via state, we should update visuals
    // but React state pinned is local; watch for changes via effect
    // cleanup
    return () => {
      tip.remove();
      svg.selectAll("*").remove();
    };
  }, [data, width, height, pinned]);

  // effect to react to pinned state changes (when user toggles legend)
  useEffect(() => {
    // nothing to do here because the D3 render uses pinned from closure.
    // Keep this effect if you want to run additional side effects on pin change.
  }, [pinned]);

  return (
    <div ref={containerRef} className="relative">
      <svg ref={ref} style={{ width: "100%", height }} />
      {/* small hint */}
      <div className="absolute right-3 bottom-3 text-xs text-gray-500 bg-white/60 px-2 py-1 rounded">
        Hover / click bubbles
      </div>
    </div>
  );
}
