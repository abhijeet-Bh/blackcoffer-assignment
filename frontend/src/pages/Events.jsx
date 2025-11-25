// src/pages/Events.jsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import { getEvents, getMetaFilters } from "../api/api";
import FiltersCard from "../components/FiltersCard"; // <-- put FiltersCard.jsx here

// small inline icons (no dependency)
const IconExternal = (props) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M14 3h7v7"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10 14L21 3"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M21 21H3V3"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const IconLink = (props) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M10 14a3 3 0 0 1 0-4l3-3a3 3 0 0 1 4 4l-1 1"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14 10a3 3 0 0 1 0 4l-3 3a3 3 0 0 1-4-4l1-1"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const IconCalendar = (props) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" {...props}>
    <rect
      x="3"
      y="5"
      width="18"
      height="16"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <path
      d="M16 3v4M8 3v4"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <path d="M3 11h18" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

function debounce(fn, ms = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export default function Events() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [data, setData] = useState({ total: 0, results: [] });
  const [loading, setLoading] = useState(false);

  // filters & search
  const [search, setSearch] = useState("");
  const [publishedYear, setPublishedYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [region, setRegion] = useState([]); // multi
  const [country, setCountry] = useState([]); // multi (unused in UI but kept)
  const [sector, setSector] = useState([]); // multi

  // meta options
  const [meta, setMeta] = useState({
    region: [],
    country: [],
    sector: [],
    published_year: [],
    end_year: [],
  });

  const mountedRef = useRef(true);

  // Numeric pager helpers
  const totalPages = Math.max(1, Math.ceil((data.total || 0) / limit));
  const pagerWindow = 5; // show up to 5 page buttons
  const startPage = Math.max(1, page - Math.floor(pagerWindow / 2));
  const endPage = Math.min(totalPages, startPage + pagerWindow - 1);

  // Build query string from filters
  const buildQs = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (publishedYear) params.set("year", publishedYear);
    if (endYear) params.set("end_year", endYear);
    if (region.length) params.set("region", region.join(","));
    if (country.length) params.set("country", country.join(","));
    if (sector.length) params.set("sector", sector.join(","));
    params.set("page", page);
    params.set("limit", limit);
    return params.toString();
  }, [search, publishedYear, endYear, region, country, sector, page, limit]);

  // fetch events
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const qs = buildQs();
      const res = await getEvents(qs);
      if (!mountedRef.current) return;
      setData(res || { total: 0, results: [] });
    } catch (e) {
      console.error("events load", e);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [buildQs]);

  // debounced fetch for search input
  const debouncedFetch = useRef(
    debounce(() => {
      setPage(1);
      fetchEvents();
    }, 450)
  ).current;

  // initial meta load
  useEffect(() => {
    mountedRef.current = true;
    (async () => {
      try {
        const m = await getMetaFilters();
        setMeta({
          region: m.region || [],
          country: m.country || [],
          sector: m.sector || [],
          published_year: m.published_year || [],
          end_year: m.end_year || [],
        });
      } catch (e) {
        console.error("meta filters", e);
      }
    })();
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // effect: fetch when page/limit changed or on explicit fetchEvents call
  useEffect(() => {
    fetchEvents();
  }, [page, limit, fetchEvents]);

  // effect: trigger debounced fetch when search changes
  useEffect(() => {
    debouncedFetch();
  }, [search, debouncedFetch]);

  // handle Apply filters button
  const handleApply = () => {
    setPage(1);
    fetchEvents();
  };

  const handleReset = () => {
    setSearch("");
    setPublishedYear("");
    setEndYear("");
    setRegion([]);
    setCountry([]);
    setSector([]);
    setPage(1);
    // small delay to allow state flush then fetch
    setTimeout(() => fetchEvents(), 20);
  };

  // helper open url
  const openResource = (url) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // copy link
  const copyToClipboard = async (url) => {
    try {
      await navigator.clipboard.writeText(url || "");
      // small feedback - naive
      // you can replace this with a toast later
      alert("Link copied to clipboard");
    } catch (e) {
      console.error("copy failed", e);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-14">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Events</h1>
          <p className="text-sm text-slate-500">
            Browse event records and open source resources.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm text-slate-500">
            Total:{" "}
            <span className="font-medium text-slate-800">
              {data.total || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Use FiltersCard component here */}
      <FiltersCard
        meta={meta}
        publishedYear={publishedYear}
        setPublishedYear={setPublishedYear}
        endYear={endYear}
        setEndYear={setEndYear}
        sector={sector}
        setSector={setSector}
        region={region}
        setRegion={setRegion}
        handleApply={handleApply}
        handleReset={handleReset}
        search={search}
        setSearch={setSearch}
      />

      {/* Results grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full p-6 bg-white rounded shadow text-center">
            Loading...
          </div>
        ) : data.results.length === 0 ? (
          <div className="col-span-full p-6 bg-white rounded shadow text-center">
            No events found
          </div>
        ) : (
          data.results.map((r, i) => (
            <article
              key={i}
              className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {r.title}
                    </h3>
                    <div className="ml-2 text-xs rounded-full px-2 py-0.5 bg-slate-100 text-slate-600">
                      {r.published_year || "—"}
                    </div>
                  </div>

                  <p className="text-sm text-slate-700 mt-2 line-clamp-3">
                    {r.insight || r.title}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <div className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md">
                      Topic: {r.topic || "—"}
                    </div>
                    <div className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md">
                      Region: {r.region || "—"}
                    </div>
                    <div className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-md">
                      Source: {r.source || "—"}
                    </div>
                    <div className="text-xs bg-slate-50 text-slate-700 px-2 py-1 rounded-md">
                      PEST: {r.pestle || "—"}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded-md bg-pink-50 text-pink-700 font-semibold">
                        {r.intensity ?? "—"}
                      </span>
                      <div className="text-[11px]">Intensity</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded-md bg-sky-50 text-sky-700 font-semibold">
                        {r.likelihood ?? "—"}
                      </span>
                      <div className="text-[11px]">Likelihood</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded-md bg-violet-50 text-violet-700 font-semibold">
                        {r.relevance ?? "—"}
                      </span>
                      <div className="text-[11px]">Relevance</div>
                    </div>

                    <div className="flex-1" />

                    <div className="text-xs text-slate-400 flex items-center gap-1">
                      <IconCalendar />
                      <span>{r.added ? r.added.split(",")[0] : ""}</span>
                    </div>
                  </div>
                </div>

                <div className="w-36 flex flex-col items-end gap-2">
                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={() => openResource(r.url)}
                      className="inline-flex items-center gap-2 bg-white border border-indigo-100 text-indigo-600 px-3 py-1 rounded-md hover:bg-indigo-50"
                      title="Open resource"
                    >
                      <IconExternal />
                      <span>Open</span>
                    </button>

                    <button
                      onClick={() => copyToClipboard(r.url)}
                      className="inline-flex items-center gap-2 bg-slate-50 border border-gray-100 text-slate-700 px-3 py-1 rounded-md hover:bg-slate-100 text-xs"
                      title="Copy link"
                    >
                      <IconLink />
                      <span>Copy link</span>
                    </button>
                  </div>

                  <div className="text-right text-xs text-slate-400">
                    <div>{r.country || "—"}</div>
                    <div className="mt-1">{r.sector || "—"}</div>
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-4 mt-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setPage(1);
            }}
            disabled={page === 1}
            className="px-3 py-1 rounded-md border bg-white hover:shadow-sm disabled:opacity-50"
          >
            First
          </button>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 rounded-md border bg-white hover:shadow-sm disabled:opacity-50"
          >
            Prev
          </button>
        </div>

        <div className="flex items-center gap-2">
          {Array.from(
            { length: endPage - startPage + 1 },
            (_, i) => startPage + i
          ).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-3 py-1 rounded-md ${
                p === page ? "bg-indigo-600 text-white" : "bg-white border"
              }`}
            >
              {p}
            </button>
          ))}
          {endPage < totalPages && (
            <div className="px-2 text-sm text-slate-400">…</div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 rounded-md border bg-white hover:shadow-sm disabled:opacity-50"
          >
            Next
          </button>
          <button
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages}
            className="px-3 py-1 rounded-md border bg-white hover:shadow-sm disabled:opacity-50"
          >
            Last
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-sm text-slate-500">Show</div>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="p-1 border rounded"
          >
            {[12, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <div className="text-sm text-slate-400">per page</div>
        </div>
      </div>
    </div>
  );
}
