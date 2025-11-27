import React, { useEffect, useState } from "react";
import {
  getInsights,
  getCategoryRisk,
  getSellers
} from "../api";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";

export default function MarketplaceDashboard({ onViewSeller, marketplaceId }) {
  const [stats, setStats] = useState(null);
  const [categoryRisk, setCategoryRisk] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [marketplace, setMarketplace] = useState(marketplaceId);

  useEffect(() => {
    setMarketplace(marketplaceId);
  }, [marketplaceId]);

  useEffect(() => {
    refresh();
  }, [marketplace]);

  function refresh() {
    getInsights(marketplace).then((r) => setStats(r.data));
    getCategoryRisk(marketplace).then((r) => setCategoryRisk(r.data));
    getSellers(marketplace).then((r) => setSellers(r.data));
  }

  // colors for pie chart
  const COLORS = [
    "#3B82F6",
    "#EF4444",
    "#F59E0B",
    "#10B981",
    "#6366F1",
    "#EC4899"
  ];

  return (
    <div className="space-y-10">

      {/* CARDS: Orders + Sellers */}
      <div className="grid grid-cols-2 gap-6 text-gray-200">
        <div className="bg-base-800 p-6 rounded-xl shadow-card border border-base-700">
          <div className="text-gray-400 text-sm">Total Orders</div>
          <div className="text-3xl font-bold mt-2">
            {stats ? stats.total_orders : "—"}
          </div>
        </div>

        <div className="bg-base-800 p-6 rounded-xl shadow-card border border-base-700">
          <div className="text-gray-400 text-sm">Total Sellers</div>
          <div className="text-3xl font-bold mt-2">
            {stats ? stats.total_sellers : "—"}
          </div>
        </div>
      </div>

      {/* RISK TREND + TOP SELLERS */}
      <div className="grid grid-cols-3 gap-6">
        
        {/* TREND */}
        <div className="col-span-2 bg-base-800 rounded-xl shadow-card border border-base-700 p-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-100">Risk Trend</h3>

          {stats?.trend?.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={stats.trend}>
                <XAxis dataKey="date" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip cursor={{ fill: "#1e293b33" }} />
                <Line type="monotone" dataKey="risk_score" stroke="#60A5FA" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-gray-500 py-10 text-center">No trend data</div>
          )}
        </div>

        {/* TOP SELLERS */}
        <div className="bg-base-800 rounded-xl shadow-card border border-base-700 p-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-100">Top Risky Sellers</h3>

          <ul className="space-y-3">
            {stats?.top_risky_sellers?.length ? (
              stats.top_risky_sellers.map((s, i) => (
                <li
                  key={s.seller_id}
                  className="flex items-center justify-between bg-base-700 px-4 py-2 rounded-lg"
                >
                  <span className="text-gray-300">
                    {i + 1}. {s.seller_id}
                  </span>
                  <span className="font-semibold text-brand-400">
                    {s.risk_score.toFixed(2)}
                  </span>
                  <button
                    onClick={() => onViewSeller(s.seller_id, marketplace)}
                    className="px-3 py-1 text-sm bg-brand-600 hover:bg-brand-500 rounded-lg text-white"
                  >
                    View
                  </button>
                </li>
              ))
            ) : (
              <li className="text-gray-500">No data</li>
            )}
          </ul>
        </div>
      </div>

      {/* CATEGORY RISK */}
      <div className="bg-base-800 rounded-xl shadow-card border border-base-700 p-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-100">Category Risk</h3>

        {categoryRisk?.length ? (
          <div className="flex justify-center">
            <ResponsiveContainer width="60%" height={350}>
              <PieChart>
                <Pie
                  data={categoryRisk}
                  dataKey="avg_risk"
                  nameKey="Product_Category"
                  outerRadius={120}
                  label={({ name, value }) => `${name}: ${value.toFixed(2)}`}
                >
                  {categoryRisk.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-gray-500 py-10 text-center">No category risk data</div>
        )}
      </div>

      {/* SELLERS TABLE */}
      <div>
        <h3 className="text-xl font-semibold mb-4 text-gray-100">Sellers</h3>

        <div className="overflow-hidden rounded-xl border border-base-700 shadow-card">
          <table className="min-w-full bg-base-800 text-gray-200">
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
                      onClick={() => onViewSeller(s.seller_id, marketplace)}
                      className="px-3 py-1 bg-brand-600 hover:bg-brand-500 rounded-lg text-white text-sm"
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
