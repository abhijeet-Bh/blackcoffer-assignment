import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import { getCountByCountry } from "../../api/api";

/**
 * CountryHistogram
 * Props:
 *  - limit (number) default 10
 *  - height (px) default 300
 */
export default function CountryHistogram({ limit = 10, height = 320 }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [data, setData] = useState([]);
  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    content: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await getCountByCountry();
        const cleaned = (res || [])
          .filter(
            (d) => d && d.country && d.country !== "" && d.country !== null
          )
          .sort((a, b) => b.count - a.count)
          .slice(0, limit);
        setData(cleaned);
      } catch (e) {
        console.error("Failed to load country counts", e);
      }
    })();
  }, [limit]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    if (!data || data.length === 0) return;

    const margin = { top: 20, right: 12, bottom: 60, left: 90 };
    const width = containerRef.current ? containerRef.current.clientWidth : 700;
    const w = Math.max(320, width - margin.left - margin.right);
    const h = height - margin.top - margin.bottom;

    // scales
    const x = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.count)])
      .range([0, w])
      .nice();
    const y = d3
      .scaleBand()
      .domain(
        data.map((d) =>
          d.country.length > 15 ? `${d.country.slice(0, 12)}...` : d.country
        )
      )
      .range([0, h])
      .padding(0.2);

    // color scale: from teal -> blue -> purple
    const maxCount = d3.max(data, (d) => d.count);
    const color = d3
      .scaleLinear()
      .domain([0, maxCount * 0.6, maxCount])
      .range(["#B13BFF", "#3b82f6", "#7c3aed"]);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // x axis (top)
    g.append("g")
      .attr("transform", `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format("~s")))
      .call((g) =>
        g.selectAll("text").attr("fill", "#475569").attr("font-size", 12)
      );

    // y axis (countries)
    g.append("g")
      .call(d3.axisLeft(y).tickSize(0))
      .call((g) =>
        g
          .selectAll("text")
          .attr("fill", "#0f172a")
          .attr("font-weight", 600)
          .attr("font-size", 12)
      );

    // bars group
    const bars = g
      .selectAll(".bar")
      .data(data, (d) => d.country)
      .join("g")
      .attr("class", "bar")
      .attr("transform", (d) => `translate(0,${y(d.country)})`);

    // animated rects starting from width 0 -> x(d.count)
    bars
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("height", y.bandwidth())
      .attr("width", 0) // start collapsed
      .attr("fill", (d) => color(d.count))
      .attr("rx", 0)
      .attr("ry", 6)
      .on("mousemove", (event, d) => {
        setTooltip({
          visible: true,
          x: event.clientX,
          y: event.clientY,
          content: `${d.country} — ${d.count}`,
        });
        // subtle highlight
        d3.select(event.currentTarget).attr(
          "fill",
          d3.color(color(d.count)).darker(0.6)
        );
      })
      .on("mouseleave", (event, d) => {
        setTooltip((t) => ({ ...t, visible: false }));
        d3.select(event.currentTarget).attr("fill", color(d.count));
      })
      .transition()
      .duration(900)
      .delay((d, i) => i * 80) // stagger
      .attr("width", (d) => x(d.count));

    // numeric labels at the end of bars
    bars
      .append("text")
      .attr("x", 6)
      .attr("y", y.bandwidth() / 2)
      .attr("dy", "0.35em")
      .attr("fill", "transparent")
      .transition()
      .duration(800)
      .delay((d, i) => i * 80)
      .attr("fill", "#0f172a");

    // count labels to the right end
    bars
      .append("text")
      .attr("class", "val")
      .attr("x", (d) => 0)
      .attr("y", y.bandwidth() / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "start")
      .attr("font-weight", 700)
      .attr("fill", "#0f172a")
      .text((d) => d.count)
      .transition()
      .duration(900)
      .delay((d, i) => i * 80)
      .attr("x", (d) => x(d.count) + 12);

    // subtle entrance for whole group
    g.attr("opacity", 0).transition().duration(500).attr("opacity", 1);

    // cleanup on resize / rerender
    return () => {
      svg.selectAll("*").remove();
    };
  }, [data, height, limit]);

  return (
    <div ref={containerRef} className="w-full">
      <svg ref={svgRef} width="100%" height={height} />
      {tooltip.visible && (
        <div
          style={{
            position: "fixed",
            left: tooltip.x + 12,
            top: tooltip.y + 12,
            pointerEvents: "none",
            background: "linear-gradient(90deg,#0ea5b0,#3b82f6)",
            color: "white",
            padding: "6px 10px",
            borderRadius: 8,
            boxShadow: "0 6px 18px rgba(2,6,23,0.16)",
            fontSize: 13,
            zIndex: 9999,
            transform: "translateZ(0)",
            whiteSpace: "nowrap",
          }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
}
