// src/components/charts/ZoomableSunburstD3.jsx
import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";

/**
 * ZoomableSunburst
 * data: hierarchical JSON { name: "root", children: [...] } as returned by /agg/topics-sunburst/
 *
 * Props:
 *  - data: hierarchy
 *  - width: optional desired width (component is responsive to container)
 *  - height: pixel height
 */
export default function ZoomableSunburst({
  data = null,
  width = 960,
  height = 420,
}) {
  const svgRef = useRef();
  const containerRef = useRef();
  const focusRef = useRef(null); // will hold the latest focus function so button can call it
  const rootRef = useRef(null); // store root for zoom-out
  const [selected, setSelected] = useState(null); // for showing current selection in UI (optional)

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // simple guard
    if (!data || !data.children || data.children.length === 0) {
      svg.append("text").attr("x", 20).attr("y", 20).text("No hierarchy data");
      return;
    }

    // compute dimensions
    const parentWidth = containerRef.current
      ? containerRef.current.clientWidth
      : width;
    const w = parentWidth || width;
    const h = height;
    const radius = Math.min(w, h) / 2;

    // group container centered
    const g = svg
      .attr("viewBox", `0 0 ${w} ${h}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .append("g")
      .attr("transform", `translate(${w / 2},${h / 2})`);

    // build partition
    const root = d3
      .hierarchy(data)
      .sum((d) => d.value || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    rootRef.current = root; // store root for zoom-out

    const partition = d3.partition().size([2 * Math.PI, radius]);
    partition(root);

    // color
    const color = d3.scaleOrdinal(d3.schemeTableau10);

    // arc generator (uses node.x0/x1 and y0/y1 directly)
    const arc = d3
      .arc()
      .startAngle((d) => d.x0)
      .endAngle((d) => d.x1)
      .innerRadius((d) => Math.max(0, d.y0))
      .outerRadius((d) => Math.max(0, d.y1))
      .padAngle(0.005)
      .padRadius(1);

    // nodes (skip root)
    const nodes = g
      .selectAll("path")
      .data(root.descendants().filter((d) => d.depth > 0))
      .enter()
      .append("path")
      .attr("d", arc)
      .attr("fill", (d) => {
        // color by first-level ancestor (depth=1)
        const anc = d
          .ancestors()
          .reverse()
          .find((a) => a.depth === 1);
        return color(anc ? anc.data.name : d.data.name);
      })
      .attr("stroke", "#fff")
      .attr("fill-opacity", 0.9)
      .style("cursor", "pointer");

    // tooltip (single DOM element appended to document body, fixed positioning)
    const body = d3.select("body");
    let tooltip = body.select(".sun-tip-fixed");
    if (tooltip.empty()) {
      tooltip = body
        .append("div")
        .attr("class", "sun-tip-fixed")
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
    }

    // helper: build ancestor path string (excluding root)
    function ancestorPath(d) {
      return d
        .ancestors()
        .reverse()
        .map((n) => n.data.name)
        .slice(1) // drop root
        .join(" → ");
    }

    // show selection in small UI state
    function setSelection(d) {
      if (!d) {
        setSelected(null);
        return;
      }
      setSelected({
        name: d.data.name,
        value: d.value || 0,
        depth: d.depth,
        path: ancestorPath(d),
      });
    }

    // tooltip position helper (keeps tooltip inside viewport)
    function positionTooltipAt(clientX, clientY) {
      // show first so we can measure
      tooltip.style("display", "block");
      const node = tooltip.node();
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const margin = 12;
      let left = clientX + margin;
      let top = clientY + margin;

      // adjust horizontally
      const maxRight = window.innerWidth - rect.width - margin;
      if (left > maxRight)
        left = Math.max(margin, clientX - rect.width - margin);

      // adjust vertically
      const maxBottom = window.innerHeight - rect.height - margin;
      if (top > maxBottom)
        top = Math.max(margin, clientY - rect.height - margin);

      tooltip.style("left", left + "px").style("top", top + "px");
    }

    // pointer interactions
    nodes
      .on("mousemove", (event, d) => {
        // show tooltip with richer info
        const path = ancestorPath(d);
        const html = `<div style="font-weight:700;margin-bottom:6px">${
          d.data.name
        }</div>
                      <div style="font-size:12px;color:#cbd5e1">Value: <strong>${
                        d.value || 0
                      }</strong></div>
                      <div style="font-size:12px;color:#94a3b8">Depth: ${
                        d.depth
                      }</div>
                      <div style="font-size:12px;color:#94a3b8;margin-top:6px">${path}</div>`;
        tooltip.html(html);
        positionTooltipAt(event.clientX, event.clientY);
      })
      .on("mouseleave", () => {
        tooltip.style("display", "none");
      })
      .on("click", (event, d) => {
        event.stopPropagation(); // prevent bubbling to container
        focusOn(d);
        setSelection(d);
      });

    // center label + click-to-zoom-out affordance (also kept but user requested separate button)
    const center = g
      .append("g")
      .attr("text-anchor", "middle")
      .style("cursor", "default");
    center
      .append("text")
      .attr("class", "center-title")
      .attr("y", -6)
      .attr("font-weight", 700)
      .attr("font-size", 14)
      .text("Topics");
    center
      .append("text")
      .attr("class", "center-sub")
      .attr("y", 12)
      .attr("font-size", 12)
      .attr("fill", "#64748b")
      .text("click slices to zoom");

    // zoom helper (keeps original logic but we expose as focusRef)
    function focusOn(d) {
      // store current focus for zoom-out button usage
      focusRef.current = focusOn;

      const transition = svg.transition().duration(700);
      // compute local scales for this zoom target
      const x = d3
        .scaleLinear()
        .domain([d.x0, d.x1])
        .range([0, 2 * Math.PI]);
      const y = d3
        .scaleSqrt()
        .domain([d.y0, radius])
        .range([d.y0 ? 20 : 0, radius]);

      nodes
        .transition(transition)
        .attrTween("d", (node) => {
          const start = { x0: node.x0, x1: node.x1, y0: node.y0, y1: node.y1 };
          const end = {
            x0: Math.max(
              0,
              Math.min(
                2 * Math.PI,
                ((node.x0 - d.x0) / (d.x1 - d.x0)) * 2 * Math.PI
              )
            ),
            x1: Math.max(
              0,
              Math.min(
                2 * Math.PI,
                ((node.x1 - d.x0) / (d.x1 - d.x0)) * 2 * Math.PI
              )
            ),
            y0: Math.max(0, node.y0 - d.y0),
            y1: Math.max(0, node.y1 - d.y0),
          };
          const interp = d3.interpolateObject(start, end);
          return (t) => arc(interp(t));
        })
        .attr("fill-opacity", (node) => {
          // highlight nodes that remain inside the focused subtree
          return isAncestorOf(d, node) ? 0.95 : 0.3;
        })
        .attr("pointer-events", (node) =>
          isAncestorOf(d, node) ? "auto" : "none"
        );
    }

    // helper to test ancestry
    function isAncestorOf(ancestor, node) {
      let cur = node;
      while (cur) {
        if (cur === ancestor) return true;
        cur = cur.parent;
      }
      return false;
    }

    // expose focusOn for external control (zoom out button)
    focusRef.current = focusOn;

    // initial fade in
    nodes
      .attr("fill-opacity", 0)
      .transition()
      .duration(700)
      .attr("fill-opacity", 0.9);

    // clicking on background (outside arcs) zooms out to root
    svg.on("click", () => {
      if (rootRef.current) {
        focusOn(rootRef.current);
        setSelection(null);
      }
    });

    // cleanup on unmount
    return () => {
      svg.selectAll("*").remove();
      d3.select("body").select(".sun-tip-fixed").remove();
    };
  }, [data, width, height]);

  // zoom-out button handler (calls the d3 focus function with root)
  function zoomOutToRoot() {
    if (!rootRef.current) return;
    if (typeof focusRef.current === "function") {
      focusRef.current(rootRef.current);
      setSelected(null);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Zoom out button in the top-right corner of the chart container */}
      <div className="absolute right-3 top-3 z-20 flex items-center gap-2">
        <button
          onClick={zoomOutToRoot}
          className="bg-white border px-3 py-1 rounded shadow-sm text-sm hover:bg-gray-50"
          title="Zoom out to root"
        >
          Zoom out
        </button>
        {/* small selection summary */}
        <div className="hidden sm:flex items-center gap-2 px-2 py-1 rounded bg-white/70 text-sm">
          {selected ? (
            <div>
              <div className="font-semibold">{selected.name}</div>
              <div className="text-xs text-gray-600">
                Value: {selected.value} • Depth: {selected.depth}
              </div>
              <div
                className="text-xs text-gray-500 truncate"
                style={{ maxWidth: 220 }}
              >
                {selected.path}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-600">No selection</div>
          )}
        </div>
      </div>

      {/* svg */}
      <svg ref={svgRef} style={{ width: "100%", height }} />

      {/* mobile/tooltip fallback — leave empty; D3 creates .sun-tip-fixed div on body when needed */}
    </div>
  );
}
