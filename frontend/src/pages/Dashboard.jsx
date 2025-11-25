import React, { useEffect, useState } from "react";
import { getAvgIntensityByYear, getCountByCountry } from "../api/api";
import LineChartD3 from "../components/charts/LineChartD3";
import ScatterPlotD3 from "../components/charts/ScatterPlotD3";

export default function Dashboard() {
  const [ts, setTs] = useState([]);
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const t = await getAvgIntensityByYear();
        setTs(t);
      } catch (e) {
        console.error(e);
      }
      try {
        const c = await getCountByCountry();
        setCountries(c);
      } catch (e) {
        console.log(e);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Avg Intensity by Year</h3>
          <LineChartD3 data={ts} xKey="year" yKey="avgIntensity" />
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Country counts</h3>
          <ul>
            {countries.map((c) => (
              <li key={c.country}>
                {c.country} — {c.count}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Intensity vs Likelihood (sample)</h3>
        <ScatterPlotD3 apiPath="/agg/scatter-intensity-likelihood/" />
      </section>
    </div>
  );
}
