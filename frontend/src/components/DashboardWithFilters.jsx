// src/components/DashboardWithFilters.jsx
import React, { useEffect, useState, useCallback } from "react";
import debounce from "lodash.debounce";
import api from "../api/api";
import RadarChart from "./charts/RadarChartD3";
import BeautifulLineChart from "./charts/BeautifulLineChart";
import BubbleChart from "./charts/BubbleChartD3";
import ZoomableSunburst from "./charts/ZoomableSunburstD3";

/**
 * DashboardWithFilters
 * Renders filter row (published_year, end_year, sector, region)
 * and four charts (radar, line, bubble, sunburst).
 */
export default function DashboardWithFilters() {
  const [meta, setMeta] = useState(null);
  const [loadingMeta, setLoadingMeta] = useState(true);

  // Filters
  const [publishedYear, setPublishedYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [sector, setSector] = useState([]); // multi-select
  const [region, setRegion] = useState([]); // multi-select

  // Chart data
  const [radarData, setRadarData] = useState([]);
  const [tsData, setTsData] = useState([]);
  const [bubbleData, setBubbleData] = useState([]);
  const [sunburstData, setSunburstData] = useState(null);

  useEffect(() => {
    (async () => {
      setLoadingMeta(true);
      try {
        const m = await api.getMetaFilters();
        setMeta(m);
      } catch (e) {
        console.error("meta load", e);
      } finally {
        setLoadingMeta(false);
      }
    })();
  }, []);

  const buildQS = (filters) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      if (Array.isArray(v)) {
        if (v.length) params.set(k, v.join(","));
      } else if (v !== "") {
        params.set(k, v);
      }
    });
    const s = params.toString();
    return s ? `?${s}` : "";
  };

  const fetchAll = useCallback(async (filters) => {
    try {
      const qs = buildQS(filters);
      const [radar, ts, bubble, sun] = await Promise.all([
        api.getRadarBySector(qs),
        api.getAvgIntensityByYear(qs),
        api.getScatterIntensityLikelihood(qs + (qs ? "&" : "?") + "limit=1500"),
        api.getTopicsSunburst(qs),
      ]);
      setRadarData(radar || []);
      setTsData((ts || []).filter((d) => d.year !== null));
      setBubbleData(bubble || []);
      setSunburstData(sun || null);
    } catch (e) {
      console.error("fetchAll", e);
    }
  }, []);

  // debounce filter changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedFetch = useCallback(
    debounce((f) => fetchAll(f), 300),
    [fetchAll]
  );

  useEffect(() => {
    const filters = {
      published_year: publishedYear ? publishedYear : undefined,
      end_year: endYear ? endYear : undefined,
      sector: sector.length ? sector : undefined,
      region: region.length ? region : undefined,
    };
    debouncedFetch(filters);
  }, [publishedYear, endYear, sector, region, debouncedFetch]);

  const opts = meta || {
    published_year: [],
    end_year: [],
    sector: [],
    region: [],
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-b from-white/80 to-white p-5 rounded-2xl shadow-md border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-sky-400 to-indigo-500 flex items-center justify-center shadow-sm">
              {/* filter icon */}
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                className="text-white"
              >
                <path
                  d="M3 5h18M6 12h12M10 19h4"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
              <p className="text-sm text-slate-500">
                Narrow down events — multiple selection supported.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Published year */}
          <div className="space-y-2">
            <label className="text-sm text-slate-600 flex items-center gap-2">
              <span>Published year</span>
              <span className="ml-1 text-xs text-gray-400">•</span>
            </label>
            <select
              value={publishedYear}
              onChange={(e) => setPublishedYear(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value="">All</option>
              {opts.published_year.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            {/* pill */}
            {publishedYear && (
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  onClick={() => setPublishedYear("")}
                  className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full text-xs"
                  title="Remove filter"
                >
                  {publishedYear}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M6 6l12 12M18 6L6 18"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* End year */}
          <div className="space-y-2">
            <label className="text-sm text-slate-600">End year</label>
            <select
              value={endYear}
              onChange={(e) => setEndYear(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value="">All</option>
              {opts.end_year.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            {endYear && (
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  onClick={() => setEndYear("")}
                  className="flex items-center gap-2 bg-rose-50 text-rose-700 px-2 py-1 rounded-full text-xs"
                >
                  {endYear}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M6 6l12 12M18 6L6 18"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Sector (multi-select) */}
          <div className="space-y-2">
            <label className="text-sm text-slate-600">Sector</label>
            <select
              multiple
              value={sector}
              onChange={(e) =>
                setSector(Array.from(e.target.selectedOptions, (o) => o.value))
              }
              className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm h-28 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              {opts.sector.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {/* sector pills */}
            <div className="mt-2 flex flex-wrap gap-2">
              {sector.map((s) => (
                <button
                  key={s}
                  onClick={() => setSector(sector.filter((x) => x !== s))}
                  className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full text-xs"
                >
                  <span className="max-w-[120px] truncate">{s}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M6 6l12 12M18 6L6 18"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {/* Region (multi-select) */}
          <div className="space-y-2">
            <label className="text-sm text-slate-600">Region</label>
            <select
              multiple
              value={region}
              onChange={(e) =>
                setRegion(Array.from(e.target.selectedOptions, (o) => o.value))
              }
              className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm h-28 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              {opts.region.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            <div className="mt-2 flex flex-wrap gap-2">
              {region.map((r) => (
                <button
                  key={r}
                  onClick={() => setRegion(region.filter((x) => x !== r))}
                  className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full text-xs"
                >
                  <span className="max-w-[120px] truncate">{r}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M6 6l12 12M18 6L6 18"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Active filters summary (bottom) */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {/* show small pills for all active filters for quick removal */}
            {publishedYear && (
              <button
                onClick={() => setPublishedYear("")}
                className="px-2 py-1 bg-indigo-600 text-white rounded-full text-xs"
              >
                Published: {publishedYear}
              </button>
            )}
            {endYear && (
              <button
                onClick={() => setEndYear("")}
                className="px-2 py-1 bg-rose-600 text-white rounded-full text-xs"
              >
                End: {endYear}
              </button>
            )}
            {sector.map((s) => (
              <button
                key={s}
                onClick={() => setSector(sector.filter((x) => x !== s))}
                className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs"
              >
                {s}
              </button>
            ))}
            {region.map((r) => (
              <button
                key={r}
                onClick={() => setRegion(region.filter((x) => x !== r))}
                className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs"
              >
                {r}
              </button>
            ))}
            {!publishedYear &&
              !endYear &&
              sector.length === 0 &&
              region.length === 0 && (
                <div className="text-sm text-slate-500">No filters applied</div>
              )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setPublishedYear("");
                setEndYear("");
                setSector([]);
                setRegion([]);
              }}
              className="text-sm text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Clear all
            </button>
            <button
              onClick={() => {
                // run apply / fetch; keep as no-op if you rely on effect
              }}
              className="bg-accent hover:bg-accent/80 cursor-pointer text-white text-sm px-3 py-1.5 rounded-md shadow"
            >
              Apply filters
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-4 rounded-2xl shadow">
          <h3 className="font-semibold mb-2">Sector comparison (Radar)</h3>
          <RadarChart data={radarData} maxItems={8} />
        </div>

        <div className="bg-white p-4 rounded-2xl shadow">
          <h3 className="font-semibold mb-2">Avg Intensity by Year</h3>
          <BeautifulLineChart
            data={tsData}
            xKey="year"
            yKey="avgIntensity"
            height={320}
          />
        </div>

        <div className="bg-white p-4 rounded-2xl shadow">
          <h3 className="font-semibold mb-2">
            Intensity vs Likelihood (Bubble)
          </h3>
          <BubbleChart data={bubbleData} />
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow">
        <h3 className="font-semibold mb-2">
          Topics breakdown (Zoomable Sunburst)
        </h3>
        <ZoomableSunburst data={sunburstData} />
      </div>
    </div>
  );
}
