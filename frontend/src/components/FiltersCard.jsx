// FiltersCard.jsx
import React, { useState, useMemo, useRef, useEffect } from "react";

/* Small inline icons (no external deps) */
const IconSearch = (props) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...props}>
    <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.6" />
    <path
      d="M21 21l-4.35-4.35"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);
const IconClear = (props) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M6 6l12 12M18 6L6 18"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);
const IconChevron = (props) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M6 9l6 6 6-6"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Searchable multi-select dropdown component
 * props:
 * - options: array of strings
 * - value: array of selected strings
 * - onChange: fn(newArray)
 * - placeholder: string
 * - label: string
 */
function MultiSelect({
  options = [],
  value = [],
  onChange,
  placeholder,
  label,
}) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const containerRef = useRef();

  // close when clicking outside
  useEffect(() => {
    function onDoc(e) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target)) setOpen(false);
    }
    window.addEventListener("click", onDoc);
    return () => window.removeEventListener("click", onDoc);
  }, []);

  const filtered = useMemo(() => {
    if (!filter) return options;
    const q = filter.toLowerCase();
    return options.filter((o) => (o || "").toLowerCase().includes(q));
  }, [options, filter]);

  const toggleOption = (opt) => {
    if (value.includes(opt)) onChange(value.filter((v) => v !== opt));
    else onChange([...value, opt]);
  };

  const selectAllFiltered = () => {
    const toAdd = filtered.filter((f) => !value.includes(f));
    onChange([...value, ...toAdd]);
  };

  const clearAll = () => onChange([]);

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-xs text-slate-500 mb-1">{label}</label>

      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="w-full flex items-center justify-between gap-3 p-2.5 rounded-lg border border-gray-200 bg-white hover:shadow-sm"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="text-slate-500 mr-1">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              className="opacity-80"
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

          <div className="min-w-0 text-sm text-slate-700">
            {value.length === 0 ? (
              <span className="text-slate-400">{placeholder}</span>
            ) : (
              <div className="flex flex-wrap gap-2 items-center">
                {value.slice(0, 4).map((v) => (
                  <span
                    key={v}
                    className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full"
                  >
                    {v}
                  </span>
                ))}
                {value.length > 4 && (
                  <span className="text-xs text-slate-500">
                    +{value.length - 4} more
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {value.length > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                clearAll();
              }}
              className="p-1 rounded hover:bg-gray-100"
              title="Clear"
            >
              <IconClear className="text-slate-400" />
            </button>
          )}
          <IconChevron
            className="text-slate-400 transform"
            style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          />
        </div>
      </button>

      {open && (
        <div className="absolute z-30 right-0 left-0 mt-2 bg-white border border-gray-100 rounded-lg shadow-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="relative flex-1">
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder={`Search ${label}`}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={selectAllFiltered}
                className="text-xs px-2 py-1 rounded bg-indigo-50 text-indigo-700"
              >
                Select
              </button>
              <button
                onClick={clearAll}
                className="text-xs px-2 py-1 rounded bg-gray-50 text-slate-600"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="max-h-40 overflow-auto border-t border-gray-100 pt-2">
            {filtered.length === 0 ? (
              <div className="text-xs text-slate-400 p-2">No results</div>
            ) : (
              filtered.map((opt) => {
                const checked = value.includes(opt);
                return (
                  <label
                    key={opt}
                    className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleOption(opt)}
                      className="h-4 w-4"
                    />
                    <div className="text-sm text-slate-700">{opt}</div>
                    <div className="ml-auto text-xs text-slate-400">
                      {/* optional meta/count */}
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* Main Filters card — export default block expects parent's state handlers */
export default function FiltersCard({
  meta = { published_year: [], end_year: [], sector: [], region: [] },
  publishedYear,
  setPublishedYear,
  endYear,
  setEndYear,
  sector,
  setSector,
  region,
  setRegion,
  handleApply,
  handleReset,
  search,
  setSearch,
}) {
  return (
    <div className="bg-gradient-to-b from-white to-slate-50 p-5 rounded-2xl shadow-md border border-gray-100">
      <div className="flex items-start justify-between mb-4 gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Filters</h3>
          <p className="text-sm text-slate-500 mt-1">
            Refine events by year, region, sector or search text.
          </p>
        </div>

        <div className="flex items-center gap-2"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        {/* Search */}
        <div className="md:col-span-4">
          <label className="text-xs text-slate-500 mb-1 block">Search</label>
          <div className="flex items-center gap-2">
            <div className="px-3 py-2 rounded-l-lg bg-white border border-r-0 border-gray-200">
              <IconSearch className="text-slate-400" />
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title or insight..."
              className="flex-1 p-2.5 border border-gray-200 rounded-r-lg focus:ring-2 focus:ring-indigo-200 text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="ml-2 px-2 py-1 rounded bg-gray-50 border"
              >
                <IconClear className="text-slate-400" />
              </button>
            )}
          </div>
        </div>

        {/* Published Year */}
        <div className="md:col-span-2">
          <label className="text-xs text-slate-500 mb-1 block">
            Published year
          </label>
          <select
            value={publishedYear}
            onChange={(e) => setPublishedYear(e.target.value)}
            className="w-full mt-1 p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-200 text-sm bg-white"
          >
            <option value="">All</option>
            {meta.published_year.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* End Year */}
        <div className="md:col-span-2">
          <label className="text-xs text-slate-500 mb-1 block">End year</label>
          <select
            value={endYear}
            onChange={(e) => setEndYear(e.target.value)}
            className="w-full mt-1 p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-200 text-sm bg-white"
          >
            <option value="">All</option>
            {meta.end_year.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Sector (searchable multiselect) */}
        <div className="md:col-span-2">
          <MultiSelect
            options={meta.sector || []}
            value={sector}
            onChange={setSector}
            placeholder="Select sectors"
            label="Sector"
          />
        </div>

        {/* Region (searchable multiselect) */}
        <div className="md:col-span-2">
          <MultiSelect
            options={meta.region || []}
            value={region}
            onChange={setRegion}
            placeholder="Select regions"
            label="Region"
          />
        </div>

        {/* bottom action row for mobile/responsive */}
        <div className="md:col-span-12 flex items-center justify-between mt-2">
          <div className="text-sm text-slate-500">
            {publishedYear ||
            endYear ||
            sector.length ||
            region.length ||
            search ? (
              <div>
                Active filters:
                <span className="ml-2 text-xs text-slate-700 font-medium">
                  {publishedYear && `Published:${publishedYear} `}
                  {endYear && `End:${endYear} `}
                  {sector.length > 0 && ` Sectors:${sector.length}`}
                  {region.length > 0 && ` Regions:${region.length}`}
                  {search && ` • "${search}"`}
                </span>
              </div>
            ) : (
              <span>No filters applied</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="px-3 py-1 rounded-md border text-sm text-slate-600 hover:bg-gray-50"
            >
              Reset
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
