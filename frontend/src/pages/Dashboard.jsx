import React, { useEffect, useState } from "react";
import { getAvgIntensityByYear, getCountByCountry } from "../api/api";
import ScatterPlotD3 from "../components/charts/ScatterPlotD3";
import BeautifulLineChart from "../components/charts/BeautifulLineChart";
import CountryHistogram from "../components/charts/CountryHistogram";

export default function Dashboard() {
  const [ts, setTs] = useState([]);
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const t = await getAvgIntensityByYear();
        setTs(t.filter((d) => d.year !== null));
        //setTs(t);
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
    <div className="space-y-6 mt-14 text-text max-w-6xl mx-auto">
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-secondary/50 p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Avg Intensity by Year</h3>
          <BeautifulLineChart data={ts} xKey="year" yKey="avgIntensity" />
        </div>

        <div className="bg-secondary/50 p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Country counts</h3>
          <CountryHistogram limit={12} height={360} />
        </div>
      </section>

      <section className="bg-linear-to-r from-light/60 to-primary/70 p-4 rounded shadow">
        <h3 className="font-semibold text-text mb-2">
          Intensity vs Likelihood (sample)
        </h3>
        <ScatterPlotD3 apiPath="/agg/scatter-intensity-likelihood/" />
      </section>
    </div>
  );
}
