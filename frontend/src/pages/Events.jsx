import React, { useEffect, useState } from "react";
import { getEvents } from "../api/api";

export default function Events() {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [data, setData] = useState({ total: 0, results: [] });

  useEffect(() => {
    (async () => {
      try {
        const res = await getEvents(`page=${page}&limit=${limit}`);
        setData(res);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [page, limit]);

  const totalPages = Math.ceil((data.total || 0) / limit);

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Events</h1>
      <div className="space-y-2">
        {data.results.map((r, i) => (
          <div key={i} className="bg-white p-3 rounded shadow">
            <div className="flex justify-between">
              <div className="font-semibold">{r.title}</div>
              <div className="text-sm text-gray-500">{r.published_year}</div>
            </div>
            <div className="text-sm text-gray-700">
              {r.insight?.slice(0, 200)}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-between items-center">
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
          className="px-3 py-1 bg-gray-200 rounded"
        >
          Prev
        </button>
        <div>
          Page {page} / {totalPages || 1}
        </div>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="px-3 py-1 bg-gray-200 rounded"
        >
          Next
        </button>
      </div>
    </div>
  );
}
