import React, { useEffect, useState } from "react";
import {
  getSellerOrders,
  getSellerTrend,
  getSellerModelStats,
  predictOrder
} from "../api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export default function SellerDashboard({ sellerId, marketplaceId, onBack }) {
  const [orders, setOrders] = useState([]);
  const [trend, setTrend] = useState([]);
  const [modelStats, setModelStats] = useState(null);
  const [toast, setToast] = useState(null);

  // ░░ Pagination ░░
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // ░░ Filters ░░
  const [filterCategory, setFilterCategory] = useState("");
  const [filterReturned, setFilterReturned] = useState("");
  const [filterPayment, setFilterPayment] = useState("");

  useEffect(() => {
    if (!sellerId) return;

    getSellerOrders(sellerId).then((r) => {
      const data = Array.isArray(r.data) ? r.data : [];
      setOrders(data);
    });

    getSellerTrend(sellerId).then((r) =>
      setTrend(Array.isArray(r.data) ? r.data : [])
    );

    getSellerModelStats(sellerId).then((r) =>
      setModelStats(r.data || null)
    );
  }, [sellerId]);

  const handlePredict = async () => {
    if (!orders.length) return;

    const sample = orders.find((o) => o.Order_ID);
    if (!sample) return;

    const res = await predictOrder(sellerId, sample);

    setToast(`Predicted: ${res.data.risk_label} (${res.data.risk_score.toFixed(2)})`);
    setTimeout(() => setToast(null), 2500);

    getSellerTrend(sellerId).then((r) =>
      setTrend(Array.isArray(r.data) ? r.data : [])
    );
  };

  // FILTERS
  let filtered = [...orders];

  if (filterCategory) filtered = filtered.filter((o) => o.Product_Category === filterCategory);
  if (filterReturned) filtered = filtered.filter((o) => o.Returned == filterReturned);
  if (filterPayment) filtered = filtered.filter((o) => o.Payment_Method === filterPayment);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [filterCategory, filterReturned, filterPayment]);

  return (
    <div className="space-y-10 text-gray-200">

      {/* TOAST */}
      {toast && (
        <div className="fixed top-4 right-4 bg-brand-600 px-4 py-2 rounded-lg text-white shadow-lg z-50">
          {toast}
        </div>
      )}

      {/* BACK BUTTON */}
      <button
        onClick={() => onBack(marketplaceId)}
        className="text-brand-400 hover:text-brand-300"
      >
        ← Back
      </button>

      <h2 className="text-3xl font-bold">Seller {sellerId}</h2>

      {/* METRICS + TREND */}
      <div className="grid grid-cols-3 gap-6">
        
        {/* METRICS CARD */}
        <div className="bg-base-800 p-6 rounded-xl border border-base-700 shadow-card">
          <h4 className="text-xl font-semibold mb-3 text-gray-100">Model Metrics</h4>

          {modelStats && !modelStats.error ? (
            <ul className="space-y-1 text-gray-300">
              <li>Accuracy: <span className="font-semibold">{modelStats.accuracy?.toFixed(3)}</span></li>
              <li>Precision: <span className="font-semibold">{modelStats.precision?.toFixed(3)}</span></li>
              <li>Recall: <span className="font-semibold">{modelStats.recall?.toFixed(3)}</span></li>
              <li>Rows used: <span className="font-semibold">{modelStats.n_rows}</span></li>
            </ul>
          ) : (
            <div className="text-gray-500">No statistics available</div>
          )}
        </div>

        {/* RISK TREND */}
        <div className="col-span-2 bg-base-800 p-6 rounded-xl border border-base-700 shadow-card">
          <h4 className="text-xl font-semibold mb-3 text-gray-100">Risk Trend</h4>

          {trend?.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trend}>
                <XAxis dataKey="date" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip cursor={{ fill: "#1e293b33" }} />
                <Line type="monotone" dataKey="avg_risk" stroke="#60A5FA" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-gray-500 py-10 text-center">No trend data</div>
          )}
        </div>
      </div>

      {/* Predict Button */}
      <button
        onClick={handlePredict}
        className="px-5 py-2 bg-brand-600 hover:bg-brand-500 rounded-lg text-white shadow-md"
      >
        Predict Sample Order
      </button>

      {/* FILTERS */}
      <div className="flex gap-4 mt-6">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-base-700 px-4 py-2 rounded-lg border border-base-600"
        >
          <option value="">All Categories</option>
          {["Electronics", "Clothing", "Beauty", "Home", "Grocery", "Footwear"].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          value={filterReturned}
          onChange={(e) => setFilterReturned(e.target.value)}
          className="bg-base-700 px-4 py-2 rounded-lg border border-base-600"
        >
          <option value="">All Orders</option>
          <option value="1">Returned</option>
          <option value="0">Not Returned</option>
        </select>

        <select
          value={filterPayment}
          onChange={(e) => setFilterPayment(e.target.value)}
          className="bg-base-700 px-4 py-2 rounded-lg border border-base-600"
        >
          <option value="">All Payment Methods</option>
          <option value="COD">COD</option>
          <option value="UPI">UPI</option>
          <option value="Card">Card</option>
          <option value="Wallet">Wallet</option>
        </select>
      </div>

      {/* ORDERS TABLE */}
      <div>
        <h4 className="text-xl font-semibold mb-3">Orders</h4>

        <div className="overflow-hidden rounded-xl border border-base-700 shadow-card">
          <table className="min-w-full bg-base-800 text-gray-200">
            <thead className="bg-base-700 text-gray-400">
              <tr>
                <th className="px-4 py-2 text-left">Order</th>
                <th className="px-4 py-2 text-left">Category</th>
                <th className="px-4 py-2 text-left">Price</th>
                <th className="px-4 py-2 text-left">Returned</th>
                <th className="px-4 py-2 text-left">Payment</th>
              </tr>
            </thead>

            <tbody>
              {paginated.map((o, idx) => (
                <tr key={idx} className="border-t border-base-700">
                  <td className="px-4 py-2">{o.Order_ID}</td>
                  <td className="px-4 py-2">{o.Product_Category}</td>
                  <td className="px-4 py-2">₹{o.Product_Price}</td>
                  <td className="px-4 py-2">{o.Returned == "1" ? "Yes" : "No"}</td>
                  <td className="px-4 py-2">{o.Payment_Method}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {filtered.length > pageSize && (
          <div className="flex items-center gap-4 mt-4">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1 bg-base-700 rounded-lg disabled:opacity-40"
            >
              Prev
            </button>

            <span className="text-gray-400">
              Page {page} of {totalPages}
            </span>

            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 bg-base-700 rounded-lg disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
