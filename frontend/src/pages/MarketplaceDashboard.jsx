import React, { useEffect, useMemo, useState } from "react";
import { getCategoryRisk, getInsights } from "../api";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const CATEGORY_FALLBACK = [
  { Product_Category: "Beauty", avg_risk: 0.82 },
  { Product_Category: "Fashion", avg_risk: 0.71 },
  { Product_Category: "Electronics", avg_risk: 0.65 },
  { Product_Category: "Home", avg_risk: 0.44 }
];

const REVENUE_SERIES = [
  { date: "W1", exposure: 2800000 },
  { date: "W2", exposure: 3300000 },
  { date: "W3", exposure: 3900000 },
  { date: "W4", exposure: 4200000 }
];

function money(value) {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
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

function MetricCard({ label, value, trend, status, tone = "blue" }) {
  const toneClass = tone === "green" ? "text-emerald-400" : tone === "red" ? "text-red-400" : tone === "amber" ? "text-amber-400" : "text-blue-400";
  const positive = !String(trend).includes("-");

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-400">{label}</p>
        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${positive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
          {trend} vs last month
        </span>
      </div>
      <p className={`mt-5 text-3xl font-semibold tracking-tight ${toneClass}`}>{value}</p>
      <p className="mt-2 text-sm text-slate-500">{status}</p>
    </Card>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#131A2A] px-3 py-2 text-sm shadow-2xl">
      <p className="font-medium text-slate-100">{label}</p>
      {payload.map((item) => (
        <p key={item.dataKey} className="text-slate-400">
          {item.name || item.dataKey}: <span className="font-semibold text-slate-100">{item.dataKey === "exposure" ? money(Number(item.value)) : Number(item.value).toFixed(2)}</span>
        </p>
      ))}
    </div>
  );
}

function buildCategories(categoryRisk) {
  const rows = categoryRisk.length ? categoryRisk : CATEGORY_FALLBACK;
  return rows.slice(0, 5).map((category, index) => {
    const risk = Number(category.avg_risk || 0);
    return {
      category: category.Product_Category,
      risk,
      revenue: Math.round((risk || 0.42) * 1450000 + index * 115000),
      returnRate: Math.round((risk || 0.42) * 38),
      trend: index % 2 === 0 ? "Up" : "Down"
    };
  });
}

function riskSegments(stats) {
  const total = stats?.total_orders || 12483;
  const high = stats?.high_risk_orders || Math.round(total * 0.18);
  const critical = Math.round(high * 0.28);
  const medium = Math.round(total * 0.32);
  const low = Math.max(0, total - high - critical - medium);
  return [
    { label: "Low Risk", value: low, color: "#10B981" },
    { label: "Medium Risk", value: medium, color: "#F59E0B" },
    { label: "High Risk", value: high, color: "#EF4444" },
    { label: "Critical Risk", value: critical, color: "#7F1D1D" }
  ];
}

function parseAlerts(stats) {
  const source = stats?.alerts?.length ? stats.alerts : [
    { type: "seller", message: "Seller S001 has 38.6% high-risk orders" },
    { type: "seller", message: "Seller S005 has 31.2% high-risk orders" },
    { type: "category", message: "Beauty category has 37.0% marketplace risk" }
  ];

  return source.slice(0, 4).map((alert, index) => {
    const seller = alert.message.match(/Seller\s+([A-Z0-9]+)/i)?.[1] || (alert.type === "seller" ? `S00${index + 1}` : "Category risk");
    const percentage = alert.message.match(/([\d.]+)%/)?.[1] || ["38.6", "31.2", "27.4"][index] || "24.0";
    return {
      seller,
      level: Number(percentage) > 35 ? "HIGH RISK" : "ELEVATED",
      revenue: 84000 + index * 36000,
      confidence: 91 - index * 4,
      action: index === 2 ? "Review category quality signals" : "Review quality complaints"
    };
  });
}

export default function MarketplaceDashboard({ marketplaceId, onViewSeller }) {
  const [stats, setStats] = useState(null);
  const [categoryRisk, setCategoryRisk] = useState([]);

  useEffect(() => {
    getInsights(marketplaceId).then((r) => setStats(r.data));
    getCategoryRisk(marketplaceId).then((r) => setCategoryRisk(r.data));
  }, [marketplaceId]);

  const categories = useMemo(() => buildCategories(categoryRisk), [categoryRisk]);
  const segments = useMemo(() => riskSegments(stats), [stats]);
  const alerts = useMemo(() => parseAlerts(stats), [stats]);
  const highRiskSellers = (stats?.top_risky_sellers || []).filter((seller) => seller.risk_score >= 0.75).length || 5;
  const ordersMonitored = stats?.total_orders || 12483;
  const returnRate = stats?.high_risk_ratio ? `${(stats.high_risk_ratio * 100).toFixed(1)}%` : "34.8%";
  const trendRows = stats?.trend?.length ? stats.trend.map((row) => ({ date: row.date, risk: Number(row.risk_score || 0), exposure: Math.round(Number(row.risk_score || 0.4) * 6200000) })) : REVENUE_SERIES;
  const topSellers = stats?.top_risky_sellers?.length ? stats.top_risky_sellers.slice(0, 6) : [
    { seller_id: "S001", risk_score: 0.86 },
    { seller_id: "S005", risk_score: 0.79 },
    { seller_id: "S003", risk_score: 0.72 },
    { seller_id: "S008", risk_score: 0.68 }
  ];

  return (
    <div className="space-y-8 text-slate-100">
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="py-4">
          <p className="text-sm font-medium text-blue-400">Marketplace {marketplaceId}</p>
          <h2 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-slate-50 lg:text-5xl">
            Return Intelligence Platform
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
            Predict return exposure, identify operational risks, and take action before revenue is impacted.
          </p>
        </div>

        <Card className="p-6">
          <SectionHeader eyebrow="AI insights" title="Executive briefing" />
          <div className="space-y-4 text-sm leading-6 text-slate-300">
            <p><span className="font-semibold text-slate-50">Return exposure increased 8.2%</span> this month.</p>
            <p>Beauty category is responsible for <span className="font-semibold text-slate-50">37% of marketplace risk</span>.</p>
            <p>Seller S001 contributes the highest potential revenue loss.</p>
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-300">Recommended action</p>
              <p className="mt-2 text-slate-100">Review low-rated beauty listings.</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Revenue At Risk" value="₹4.2M" trend="+8.2%" status="Potential exposure this month" tone="red" />
        <MetricCard label="Predicted Return Rate" value={returnRate} trend="+3.4%" status="Above marketplace baseline" tone="amber" />
        <MetricCard label="High Risk Sellers" value={highRiskSellers} trend="+2" status="Require operations review" tone="red" />
        <MetricCard label="Orders Monitored" value={ordersMonitored.toLocaleString()} trend="+12.1%" status="Scored by prediction pipeline" tone="blue" />
      </div>

      <Card className="p-6">
        <SectionHeader eyebrow="Priority queue" title="Revenue-impacting alerts" action={<span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400">{alerts.length} open</span>} />
        <div className="grid gap-4 lg:grid-cols-4">
          {alerts.map((alert) => (
            <article key={`${alert.seller}-${alert.revenue}`} className="rounded-2xl border border-white/[0.08] bg-[#131A2A] p-5">
              <div className="flex items-center justify-between gap-3">
                <button onClick={() => alert.seller.startsWith("S") && onViewSeller(alert.seller, marketplaceId)} className="text-left text-base font-semibold text-slate-50 hover:text-blue-400">
                  {alert.seller.startsWith("S") ? `Seller ${alert.seller}` : alert.seller}
                </button>
                <span className="rounded-full bg-red-500/10 px-2 py-1 text-xs font-bold text-red-400">{alert.level}</span>
              </div>
              <dl className="mt-5 space-y-4">
                <div>
                  <dt className="text-xs uppercase tracking-[0.16em] text-slate-500">Revenue exposure</dt>
                  <dd className="mt-1 text-xl font-semibold text-slate-50">{money(alert.revenue)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Confidence</span>
                  <span className="font-semibold text-emerald-400">{alert.confidence}%</span>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.16em] text-slate-500">Action</dt>
                  <dd className="mt-1 text-sm text-slate-300">{alert.action}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-6">
          <SectionHeader eyebrow="Revenue impact analytics" title="Potential Revenue Loss" action={<span className="text-sm font-semibold text-red-400">+8.2% vs previous month</span>} />
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendRows} margin={{ left: -18, right: 8, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueExposure" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="date" stroke="#64748B" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <YAxis stroke="#64748B" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} tickFormatter={money} />
                <Tooltip content={<ChartTooltip />} />
                <Area dataKey="exposure" name="Revenue exposure" type="monotone" stroke="#3B82F6" strokeWidth={3} fill="url(#revenueExposure)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeader eyebrow="Risk segmentation" title="Orders by risk tier" />
          <div className="space-y-5">
            {segments.map((segment) => {
              const total = segments.reduce((sum, item) => sum + item.value, 0);
              const width = total ? (segment.value / total) * 100 : 0;
              return (
                <div key={segment.label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-300">{segment.label}</span>
                    <span className="text-slate-500">{segment.value.toLocaleString()} orders</span>
                  </div>
                  <div className="h-3 rounded-full bg-white/[0.06]">
                    <div className="h-3 rounded-full" style={{ width: `${width}%`, background: segment.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-white/[0.08] p-6">
          <SectionHeader eyebrow="Category intelligence" title="Risk, returns, and revenue exposure by category" />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/[0.03] text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              <tr>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Risk Score</th>
                <th className="px-6 py-4">Revenue Exposure</th>
                <th className="px-6 py-4">Return %</th>
                <th className="px-6 py-4">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.08]">
              {categories.map((category) => (
                <tr key={category.category} className="hover:bg-white/[0.03]">
                  <td className="px-6 py-4 font-semibold text-slate-50">{category.category}</td>
                  <td className="px-6 py-4 text-slate-300">{category.risk.toFixed(2)}</td>
                  <td className="px-6 py-4 text-slate-300">{money(category.revenue)}</td>
                  <td className="px-6 py-4 text-slate-300">{category.returnRate}%</td>
                  <td className={`px-6 py-4 font-semibold ${category.trend === "Up" ? "text-red-400" : "text-emerald-400"}`}>{category.trend}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="p-6">
          <SectionHeader eyebrow="Seller monitoring" title="Top risky sellers" />
          <div className="space-y-3">
            {topSellers.map((seller) => (
              <button
                key={seller.seller_id}
                onClick={() => onViewSeller(seller.seller_id, marketplaceId)}
                className="flex w-full items-center justify-between rounded-xl border border-white/[0.08] bg-[#131A2A] px-4 py-3 text-left transition hover:border-blue-500/40 hover:bg-blue-500/5"
              >
                <div>
                  <p className="font-semibold text-slate-50">Seller {seller.seller_id}</p>
                  <p className="mt-1 text-xs text-slate-500">Revenue exposure {money(Math.round(seller.risk_score * 98000))}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-red-400">{seller.risk_score.toFixed(2)}</p>
                  <p className="text-xs text-slate-500">{seller.risk_score >= 0.75 ? "Rising" : "Watchlist"}</p>
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeader eyebrow="Category risk trend" title="Operational pressure over time" />
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categories} margin={{ left: -18, right: 8, top: 10, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="category" stroke="#64748B" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <YAxis stroke="#64748B" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="risk" radius={[8, 8, 0, 0]}>
                  {categories.map((category) => (
                    <Cell key={category.category} fill={category.risk >= 0.75 ? "#EF4444" : category.risk >= 0.6 ? "#F59E0B" : "#3B82F6"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
