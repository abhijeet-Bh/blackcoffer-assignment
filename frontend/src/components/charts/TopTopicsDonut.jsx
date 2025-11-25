import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { getCountByCountry } from "../../api/api"; // keep for reference if needed

// helper fetch (uses Vite env and token)
async function fetchTopTopics(limit = 5) {
  const base = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
  const url = `${base}/agg/top-topics/?limit=${limit}`;
  const headers = {};
  const token = localStorage.getItem("access_token");
  if (token && typeof token === "string" && !token.trim().startsWith("{")) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error("Failed to load top topics");
  return res.json();
}

/**
 * TopTopicsDonut
 * Props:
 *  - initial = 5  (initial top-N)
 *  - width (pixel) default 420
 *  - height default 360
 */
export default function TopTopicsDonut({
  initial = 5,
  width = 420,
  height = 360,
}) {
  const svgRef = useRef(null);
  const [limit, setLimit] = useState(initial);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tooltip, setTooltip] = useState({
    show: false,
    x: 0,
    y: 0,
    content: "",
  });

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchTopTopics(limit)
      .then((d) => {
        if (!mounted) return;
        // expected: [{topic, count}, ...]
        setData((d || []).filter((it) => it.topic && it.count));
      })
      .catch((e) => {
        console.error(e);
        setData([]);
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [limit]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    if (!data || data.length === 0) return;

    const radius = Math.min(width, height) / 2;
    const innerRadius = radius * 0.58; // donut hole
    const outerRadius = radius * 0.92;

    const g = svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    // color scale (nice categorical)
    const color = d3.scaleOrdinal(d3.schemeTableau10);

    const pie = d3
      .pie()
      .value((d) => d.count)
      .sort(null);

    const arc = d3
      .arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .cornerRadius(6);

    const arcHover = d3
      .arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius + 8)
      .cornerRadius(8);

    const arcs = g
      .selectAll(".arc")
      .data(pie(data))
      .enter()
      .append("g")
      .attr("class", "arc");

    // animated entrance: arcs grow from 0 -> final
    arcs
      .append("path")
      .attr("fill", (d, i) => color(i))
      .attr("d", (d) => {
        const start = { startAngle: d.startAngle, endAngle: d.startAngle };
        return arc(start);
      })
      .attr("opacity", 0.95)
      .on("mousemove", (event, d) => {
        setTooltip({
          show: true,
          x: event.clientX,
          y: event.clientY,
          content: `${d.data.topic} — ${d.data.count}`,
        });
        d3.select(event.currentTarget)
          .transition()
          .duration(180)
          .attr("d", arcHover(d));
      })
      .on("mouseleave", (event, d) => {
        setTooltip((t) => ({ ...t, show: false }));
        d3.select(event.currentTarget)
          .transition()
          .duration(180)
          .attr("d", arc(d));
      })
      .transition()
      .duration(900)
      .attrTween("d", function (d) {
        const i = d3.interpolate(
          { startAngle: d.startAngle, endAngle: d.startAngle },
          d
        );
        return function (t) {
          return arc(i(t));
        };
      });

    // inner white ring for a crisp donut center
    g.append("circle")
      .attr("r", innerRadius - 6)
      .attr("fill", "white")
      .attr("opacity", 1);

    // labels: small percent or count badges (placed outside arcs)
    const total = d3.sum(data, (d) => d.count);
    arcs
      .append("text")
      .attr("transform", (d) => `translate(${arc.centroid(d)})`)
      .attr("dy", "0.35em")
      .attr("fill", "#fff")
      .attr("font-size", 11)
      .attr("text-anchor", "middle")
      .style("pointer-events", "none")
      .text((d) => {
        const pct = Math.round((d.data.count / total) * 100);
        return pct >= 6 ? `${pct}%` : ""; // only label sizable slices
      });

    // legend (right side)
    const legend = svg
      .append("g")
      .attr("transform", `translate(${width - 70}, ${height / 3})`);

    const legendItem = legend
      .selectAll(".legend-item")
      .data(data)
      .enter()
      .append("g")
      .attr("class", "legend-item")
      .attr("transform", (d, i) => `translate(0, ${i * 28})`);

    legendItem
      .append("rect")
      .attr("width", 14)
      .attr("height", 14)
      .attr("rx", 3)
      .attr("ry", 3)
      .attr("fill", (d, i) => color(i));

    legendItem
      .append("text")
      .attr("x", 20)
      .attr("y", 10)
      .attr("fill", "#0f172a")
      .attr("font-size", 13)
      .text((d) => `${d.topic}`);

    // subtle center label
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "-0.05em")
      .attr("font-size", 14)
      .attr("fill", "#0f172a")
      .attr("font-weight", 700)
      .text(`Top ${data.length + 1}`);

    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "1.1em")
      .attr("font-size", 11)
      .attr("fill", "#64748b")
      .text("topics");

    // cleanup
    return () => svg.selectAll("*").remove();
  }, [data, width, height]);

  return (
    <div className="bg-white p-4 rounded shadow">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-lg">Top {limit} topics</h3>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Show:</label>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="border rounded px-2 py-1 text-sm"
          >
            {[5, 6, 7, 8, 9, 10].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && <div className="text-sm text-gray-500">Loading...</div>}

      <div className="flex items-start gap-6">
        <div style={{ flex: "0 0 auto" }}>
          <svg ref={svgRef} width="420" height="360" />
        </div>

        {/* legend for very small screens (mobile fallback) */}
        <div className="hidden sm:block" style={{ minWidth: 140 }}>
          {/* legend drawn inside svg; keep for layout spacing */}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip.show && (
        <div
          style={{
            position: "fixed",
            left: tooltip.x + 12,
            top: tooltip.y + 12,
            pointerEvents: "none",
            background: "linear-gradient(90deg,#06b6d4,#3b82f6)",
            color: "white",
            padding: "6px 10px",
            borderRadius: 8,
            boxShadow: "0 10px 30px rgba(15,23,42,0.18)",
            fontSize: 13,
            zIndex: 9999,
            whiteSpace: "nowrap",
          }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
}
