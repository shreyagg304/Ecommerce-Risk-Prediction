import React, { useEffect, useMemo, useState } from "react";
import { getSellerExplanation, getSellerModelStats, getSellerOrders, getSellerTrend } from "../api";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

function money(value) {
  if (value >= 100000) return `₹${(value / 1000).toFixed(0)}K`;
  return `₹${value.toLocaleString()}`;
}

function Card({ children, className = "" }) {
  return (
    <section className={`rounded-2xl border border-white/[0.08] bg-[#182132] shadow-[0_18px_60px_rgba(0,0,0,0.26)] ${className}`}>
      {children}
    </section>
  );
}

function SectionHeader({ eyebrow, title, action }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{eyebrow}</p>}
        <h3 className="mt-2 text-lg font-semibold tracking-tight text-slate-50">{title}</h3>
      </div>
      {action}
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#131A2A] px-3 py-2 text-sm shadow-2xl">
      <p className="font-medium text-slate-100">{label}</p>
      {payload.map((item) => (
        <p key={item.dataKey} className="text-slate-400">
          {item.name || item.dataKey}: <span className="font-semibold text-slate-100">{Number(item.value).toFixed(2)}</span>
        </p>
      ))}
    </div>
  );
}

function explanationCards(explanations) {
  const source = explanations.length ? explanations : ["Low average product rating", "High COD usage", "Long delivery times"];
  return source.slice(0, 3).map((item, index) => {
    const text = String(item).toLowerCase();
    if (text.includes("rating")) {
      return { title: "Low Ratings", impact: "+18%", body: "Customers consistently report quality issues." };
    }
    if (text.includes("cod")) {
      return { title: "COD Dependency", impact: "+12%", body: "Cash-on-delivery orders have elevated return probability." };
    }
    if (text.includes("delivery")) {
      return { title: "Delivery Delays", impact: "+8%", body: "Average delivery time exceeds marketplace baseline." };
    }
    return { title: item, impact: `+${10 - index * 2}%`, body: "This signal is contributing to the seller's elevated return exposure." };
  });
}

export default function SellerDashboard({ sellerId, marketplaceId, onBack }) {
  const [orders, setOrders] = useState([]);
  const [trend, setTrend] = useState([]);
  const [modelStats, setModelStats] = useState(null);
  const [explanation, setExplanation] = useState([]);
  const [investigating, setInvestigating] = useState(false);

  useEffect(() => {
    if (!sellerId) return;
    getSellerOrders(sellerId).then((r) => setOrders(Array.isArray(r.data) ? r.data : []));
    getSellerTrend(sellerId).then((r) => setTrend(Array.isArray(r.data) ? r.data : []));
    getSellerModelStats(sellerId).then((r) => setModelStats(r.data || null));
    getSellerExplanation(sellerId).then((r) => setExplanation(Array.isArray(r.data) ? r.data : []));
  }, [sellerId]);

  const latestRisk = trend.length ? Number(trend[trend.length - 1].avg_risk || 0) : 0.78;
  const healthScore = Math.max(18, Math.round((1 - latestRisk) * 100));
  const returnedCount = orders.filter((order) => String(order.Returned) === "1").length;
  const predictedReturnRate = orders.length ? returnedCount / orders.length : 0.35;
  const revenueExposure = Math.round((orders.length || 240) * 350 * Math.max(0.2, latestRisk));
  const trendData = trend.length ? trend : [
    { date: "W1", avg_risk: 0.61, high_count: 11 },
    { date: "W2", avg_risk: 0.68, high_count: 17 },
    { date: "W3", avg_risk: 0.74, high_count: 24 },
    { date: "W4", avg_risk: latestRisk, high_count: 29 }
  ];
  const factors = useMemo(() => explanationCards(explanation), [explanation]);
  const recentOrders = orders.slice(0, 8);

  return (
    <div className="space-y-8 text-slate-100">
      <div className="rounded-3xl border border-white/[0.08] bg-[#131A2A] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
        <button onClick={() => onBack(marketplaceId)} className="mb-6 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/[0.06] hover:text-slate-50">
          Back to overview
        </button>

        <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
          <div>
            <p className="text-sm font-medium text-blue-400">Marketplace {marketplaceId}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h2 className="text-4xl font-semibold tracking-tight text-slate-50">Seller {sellerId}</h2>
              <span className="rounded-full bg-red-500/10 px-3 py-1 text-sm font-bold text-red-400">High Risk</span>
            </div>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-400">
              Intelligence profile for seller return exposure, explainability, benchmarks, and recommended interventions.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/[0.08] bg-[#182132] p-5">
              <p className="text-sm text-slate-400">Health Score</p>
              <p className="mt-3 text-4xl font-semibold text-red-400">{healthScore}</p>
              <p className="mt-2 text-sm text-slate-500">High Risk</p>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-[#182132] p-5">
              <p className="text-sm text-slate-400">Revenue Exposure</p>
              <p className="mt-3 text-4xl font-semibold text-slate-50">{money(revenueExposure)}</p>
              <p className="mt-2 text-sm text-slate-500">Potential loss</p>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-[#182132] p-5">
              <p className="text-sm text-slate-400">Predicted Return Rate</p>
              <p className="mt-3 text-4xl font-semibold text-amber-400">{(predictedReturnRate * 100).toFixed(0)}%</p>
              <p className="mt-2 text-sm text-slate-500">Next period</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="p-6">
          <SectionHeader eyebrow="Risk trend" title="Seller exposure over time" />
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ left: -18, right: 8, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="sellerRisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="date" stroke="#64748B" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <YAxis stroke="#64748B" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} domain={[0, 1]} />
                <Tooltip content={<ChartTooltip />} />
                <Area dataKey="avg_risk" name="Risk score" type="monotone" stroke="#EF4444" strokeWidth={3} fill="url(#sellerRisk)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeader eyebrow="AI investigation" title="Seller risk analysis" action={<button onClick={() => setInvestigating(true)} className="rounded-lg bg-blue-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-400">Investigate Seller</button>} />
          <div className="space-y-4 text-sm leading-6 text-slate-300">
            {investigating ? (
              <>
                <p><span className="font-semibold text-slate-50">Seller risk increased 14%</span> over the last 30 days.</p>
                <p>Primary driver: Beauty category returns.</p>
                <p>Secondary driver: Low product ratings.</p>
                <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-300">Recommended intervention</p>
                  <p className="mt-2 text-slate-100">Review top-returned SKUs.</p>
                </div>
              </>
            ) : (
              <p className="text-slate-400">Run a mocked AI investigation to generate an executive-ready risk narrative for this seller.</p>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <SectionHeader eyebrow="Explainability" title="Why risk is elevated" />
        <div className="grid gap-4 lg:grid-cols-3">
          {factors.map((factor) => (
            <article key={factor.title} className="rounded-2xl border border-white/[0.08] bg-[#131A2A] p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold text-slate-50">{factor.title}</p>
                <span className="rounded-full bg-red-500/10 px-2 py-1 text-xs font-bold text-red-400">Impact {factor.impact}</span>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-400">{factor.body}</p>
            </article>
          ))}
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="p-6">
          <SectionHeader eyebrow="Recommended actions" title="Next best interventions" />
          <ul className="space-y-3 text-sm text-slate-300">
            {["Review product quality", "Audit listing accuracy", "Reduce delivery delays", "Review COD-heavy inventory"].map((action) => (
              <li key={action} className="rounded-xl border border-white/[0.08] bg-[#131A2A] px-4 py-3">{action}</li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <SectionHeader eyebrow="Benchmarking" title="Seller vs marketplace" />
          <div className="space-y-5">
            {[
              ["Seller", "21% Return Rate", 70, "#EF4444"],
              ["Marketplace Average", "12%", 40, "#3B82F6"],
              ["Difference", "+9%", 30, "#F59E0B"]
            ].map(([label, value, width, color]) => (
              <div key={label}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-slate-400">{label}</span>
                  <span className="font-semibold text-slate-50">{value}</span>
                </div>
                <div className="h-3 rounded-full bg-white/[0.06]">
                  <div className="h-3 rounded-full" style={{ width: `${width}%`, background: color }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeader eyebrow="ML performance" title="Prediction confidence" />
          {modelStats && !modelStats.error ? (
            <div className="space-y-4">
              {[
                ["Accuracy", modelStats.accuracy],
                ["Precision", modelStats.precision],
                ["Recall", modelStats.recall]
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-slate-400">{label}</span>
                    <span className="font-semibold text-slate-50">{Number(value || 0).toFixed(3)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/[0.06]">
                    <div className="h-2 rounded-full bg-blue-500" style={{ width: `${Math.min(100, Number(value || 0) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No model statistics available.</p>
          )}
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-white/[0.08] p-6">
          <SectionHeader eyebrow="Recent orders" title="Operational review queue" />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/[0.03] text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              <tr>
                <th className="px-6 py-4">Order</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Value</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.08]">
              {(recentOrders.length ? recentOrders : [
                { Order_ID: "O-1048", Product_Category: "Beauty", Product_Price: 2199, Payment_Method: "COD", Returned: "1" },
                { Order_ID: "O-1041", Product_Category: "Beauty", Product_Price: 1799, Payment_Method: "COD", Returned: "1" },
                { Order_ID: "O-1032", Product_Category: "Fashion", Product_Price: 2499, Payment_Method: "UPI", Returned: "0" }
              ]).map((order) => (
                <tr key={order.Order_ID} className="hover:bg-white/[0.03]">
                  <td className="px-6 py-4 font-semibold text-slate-50">{order.Order_ID}</td>
                  <td className="px-6 py-4 text-slate-300">{order.Product_Category}</td>
                  <td className="px-6 py-4 text-slate-300">{money(Number(order.Product_Price || 0))}</td>
                  <td className="px-6 py-4 text-slate-300">{order.Payment_Method}</td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${String(order.Returned) === "1" ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                      {String(order.Returned) === "1" ? "Returned" : "Kept"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
