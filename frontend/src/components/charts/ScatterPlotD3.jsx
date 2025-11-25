import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import { apiFetch } from "../../api/api"; // not exported earlier - we'll use direct fetch

export default function ScatterPlotD3({
  apiPath = "/agg/scatter-intensity-likelihood/?limit=500",
  width = 800,
  height = 400,
}) {
  const ref = useRef();
  const [data, setData] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("access_token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(
          (import.meta.env.VITE_API_URL || "http://localhost:8000/api") +
            apiPath,
          { headers }
        );
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [apiPath]);

  useEffect(() => {
    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();
    if (!data || data.length === 0) return;

    const margin = { top: 10, right: 20, bottom: 30, left: 40 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleLinear()
      .domain(d3.extent(data, (d) => d.intensity || 0))
      .nice()
      .range([0, w]);
    const y = d3
      .scaleLinear()
      .domain(d3.extent(data, (d) => d.likelihood || 0))
      .nice()
      .range([h, 0]);
    const r = d3
      .scaleSqrt()
      .domain(d3.extent(data, (d) => d.relevance || 0))
      .range([2, 10]);

    g.append("g").attr("transform", `translate(0,${h})`).call(d3.axisBottom(x));
    g.append("g").call(d3.axisLeft(y));

    g.selectAll("circle")
      .data(data)
      .join("circle")
      .attr("cx", (d) => x(d.intensity || 0))
      .attr("cy", (d) => y(d.likelihood || 0))
      .attr("r", (d) => r(d.relevance || 1))
      .attr("fill", "#f875aa")
      .attr("stroke", "white")
      .on("mouseover", function (e, d) {
        const html = `${d.title || ""} <br/> ${d.country || ""} (${
          d.year || ""
        })`;
        // show your tooltip (left as exercise)
      });
  }, [data]);

  return (
    <svg
      ref={ref}
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
    ></svg>
  );
}
