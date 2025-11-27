import React, { useEffect, useState } from "react";
import {
  getInsights,
  getCategoryRisk,
  getSellers,
  getCategoryTrend
} from "../api";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";

const COLORS = [
  "#60A5FA", "#F472B6", "#34D399",
  "#FBBF24", "#A78BFA", "#FB7185"
];

export default function MarketplaceDashboard({ marketplaceId, onViewSeller }) {
  const [stats, setStats] = useState(null);
  const [categoryRisk, setCategoryRisk] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [categoryTrend, setCategoryTrend] = useState({ series: [], top_categories: [] });

  // Filters
  const [timeRange, setTimeRange] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [riskLevel, setRiskLevel] = useState("");

  // Load every time marketplace changes OR category changes
  useEffect(() => {
    loadAll();
  }, [marketplaceId, categoryFilter]);

  const loadAll = () => {
    getInsights(marketplaceId).then((r) => setStats(r.data));
    getCategoryRisk(marketplaceId).then((r) => setCategoryRisk(r.data));
    getSellers(marketplaceId).then((r) => setSellers(r.data));
    getCategoryTrend(marketplaceId, categoryFilter).then((r) =>
      setCategoryTrend(r.data)
    );
  };

  /* ---------------- FILTER TREND ---------------- */

  let filteredTrend = stats?.trend ? [...stats.trend] : [];
  if (timeRange !== "all" && filteredTrend.length) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - parseInt(timeRange));

    filteredTrend = filteredTrend.filter(
      (t) => new Date(t.date) >= cutoff
    );
  }

  /* ---------------- FILTER CATEGORY PIE ---------------- */

  let filteredCategory = [...categoryRisk];
  if (categoryFilter) {
    filteredCategory = filteredCategory.filter(
      (c) => c.Product_Category === categoryFilter
    );
  }

  /* ---------------- FILTER RISKY SELLERS ---------------- */

  let filteredTopSellers = stats?.top_risky_sellers
    ? [...stats.top_risky_sellers]
    : [];

  if (riskLevel) {
    filteredTopSellers = filteredTopSellers.filter((s) => {
      if (riskLevel === "High") return s.risk_score >= 0.75;
      if (riskLevel === "Medium")
        return s.risk_score >= 0.45 && s.risk_score < 0.75;
      if (riskLevel === "Low") return s.risk_score < 0.45;
      return true;
    });
  }

  /* ---------------- CATEGORY TREND (NEW MULTI-LINE) ---------------- */

  const series = categoryTrend.series || [];

  let activeSeries = [];

  if (categoryFilter) {
    activeSeries = series.filter((s) => s.category === categoryFilter);
  } else {
    const top = categoryTrend.top_categories || [];
    activeSeries = series.filter((s) => top.includes(s.category));
  }

  // Merge all dates into one sorted list
  const dateSet = new Set();
  activeSeries.forEach((s) =>
    s.points.forEach((p) => dateSet.add(p.date))
  );
  const allDates = Array.from(dateSet).sort(
    (a, b) => new Date(a) - new Date(b)
  );

  // Build chart-ready data rows: { date, Electronics:0.12, Clothing:0.22, ... }
  const categoryTrendChart = allDates.map((d) => {
    const row = { date: d };
    activeSeries.forEach((s) => {
      const found = s.points.find((p) => p.date === d);
      row[s.category] = found ? parseFloat(found.avg_risk) : 0;
    });
    return row;
  });

  // Apply time filter to category trend
  if (timeRange !== "all") {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - parseInt(timeRange));

    categoryTrendChart = categoryTrendChart.filter(
      (r) => new Date(r.date) >= cutoff
    );
  }

  /* ---------------------------------------------------------------------- */

  return (
    <div className="space-y-10 text-gray-100">

      {/* FILTER BAR */}
      <div className="bg-base-800 border border-base-700 p-4 rounded-xl flex gap-4 items-center">

        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="bg-base-700 text-gray-200 px-3 py-2 rounded-lg"
        >
          <option value="all">All Time</option>
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-base-700 text-gray-200 px-3 py-2 rounded-lg"
        >
          <option value="">All Categories</option>
          {categoryRisk.map((c) => (
            <option key={c.Product_Category}>
              {c.Product_Category}
            </option>
          ))}
        </select>

        <select
          value={riskLevel}
          onChange={(e) => setRiskLevel(e.target.value)}
          className="bg-base-700 text-gray-200 px-3 py-2 rounded-lg"
        >
          <option value="">All Risks</option>
          <option value="High">High Risk</option>
          <option value="Medium">Medium Risk</option>
          <option value="Low">Low Risk</option>
        </select>
      </div>

      {/* HEALTH SCORE */}
      <div className="bg-base-800 p-6 rounded-xl border border-base-700 shadow-card">
        <h3 className="text-sm text-gray-300">Marketplace Health</h3>

        <p
          className={`text-4xl font-bold mt-1 ${
            stats?.health_score > 80
              ? "text-green-400"
              : stats?.health_score > 50
              ? "text-yellow-300"
              : "text-red-400"
          }`}
        >
          {stats?.health_score ?? "—"}
        </p>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-base-800 p-6 rounded-xl border border-base-700 shadow-card">
          <div className="text-gray-400 text-sm">Total Orders</div>
          <div className="text-3xl font-bold mt-2">
            {stats?.total_orders ?? "—"}
          </div>
        </div>

        <div className="bg-base-800 p-6 rounded-xl border border-base-700 shadow-card">
          <div className="text-gray-400 text-sm">Total Sellers</div>
          <div className="text-3xl font-bold mt-2">
            {stats?.total_sellers ?? "—"}
          </div>
        </div>
      </div>

      {/* TREND + TOP SELLERS */}
      <div className="grid grid-cols-3 gap-6">

        {/* MAIN RISK TREND */}
        <div className="col-span-2 bg-base-800 p-6 rounded-xl border border-base-700">
          <h3 className="text-xl font-semibold mb-4">Risk Trend</h3>

          {filteredTrend.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={filteredTrend}>
                <XAxis dataKey="date" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="risk_score"
                  stroke="#60A5FA"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-gray-500 text-center py-10">
              No trend data
            </div>
          )}
        </div>

        {/* TOP SELLERS */}
        <div className="bg-base-800 p-6 rounded-xl border border-base-700">
          <h3 className="text-xl font-semibold mb-4">Top Risky Sellers</h3>

          <ul className="space-y-3">
            {filteredTopSellers.length ? (
              filteredTopSellers.map((s, i) => (
                <li
                  key={s.seller_id}
                  className="bg-base-700 px-4 py-2 rounded-lg flex items-center justify-between"
                >
                  <span>{i + 1}. {s.seller_id}</span>
                  <span className="font-semibold text-brand-400">
                    {s.risk_score.toFixed(2)}
                  </span>

                  <button
                    onClick={() => onViewSeller(s.seller_id, marketplaceId)}
                    className="px-3 py-1 text-sm bg-brand-600 hover:bg-brand-500 rounded-lg"
                  >
                    View
                  </button>
                </li>
              ))
            ) : (
              <li className="text-gray-500">No sellers</li>
            )}
          </ul>
        </div>
      </div>

      {/* CATEGORY TREND (NEW MULTI-LINE CHART) */}
      <div className="bg-base-800 p-6 rounded-xl border border-base-700">
        <h3 className="text-xl font-semibold mb-4">Category Trend</h3>

        {activeSeries.length ? (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={categoryTrendChart}>
              <XAxis dataKey="date" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip />
              <Legend />

              {activeSeries.map((s, idx) => (
                <Line
                  key={s.category}
                  type="monotone"
                  dataKey={s.category}
                  stroke={COLORS[idx % COLORS.length]}
                  dot={false}
                  strokeWidth={3}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-gray-500 text-center py-10">
            No category trend data
          </div>
        )}
      </div>

      {/* CATEGORY PIE */}
      <div className="bg-base-800 p-6 rounded-xl border border-base-700">
        <h3 className="text-xl font-semibold mb-4">Category Risk</h3>

        {filteredCategory.length ? (
          <div className="flex justify-center">
            <ResponsiveContainer width="60%" height={350}>
              <PieChart>
                <Pie
                  data={filteredCategory}
                  dataKey="avg_risk"
                  nameKey="Product_Category"
                  outerRadius={120}
                  label={({ name, value, percent }) =>
                    `${name} — ${value.toFixed(2)} (${(percent * 100).toFixed()}%)`
                  }
                >
                  {filteredCategory.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-gray-500 text-center py-10">No category data</div>
        )}
      </div>

      {/* SELLER LIST */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Sellers</h3>

        <div className="rounded-xl border border-base-700 overflow-hidden">
          <table className="min-w-full bg-base-800">
            <thead className="bg-base-700 text-gray-400">
              <tr>
                <th className="py-3 px-4 text-left">ID</th>
                <th className="py-3 px-4 text-left">Name</th>
                <th className="py-3 px-4 text-left">Action</th>
              </tr>
            </thead>

            <tbody>
              {sellers.map((s) => (
                <tr key={s.seller_id} className="border-t border-base-700">
                  <td className="py-3 px-4">{s.seller_id}</td>
                  <td className="py-3 px-4">{s.seller_name}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => onViewSeller(s.seller_id, marketplaceId)}
                      className="px-3 py-1 text-sm bg-brand-600 hover:bg-brand-500 rounded-lg"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>
      </div>
    </div>
  );
}
