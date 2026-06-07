import React from "react";
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

const forecast = [
  { day: "Now", volume: 1420, exposure: 3100000, risk: 0.62 },
  { day: "Day 7", volume: 1580, exposure: 3400000, risk: 0.66 },
  { day: "Day 14", volume: 1710, exposure: 3800000, risk: 0.69 },
  { day: "Day 21", volume: 1840, exposure: 4100000, risk: 0.72 },
  { day: "Day 30", volume: 2010, exposure: 4600000, risk: 0.75 }
];

function money(value) {
  if (value >= 1000000) return `₹${(value / 1000000).toFixed(1)}M`;
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

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#131A2A] px-3 py-2 text-sm shadow-2xl">
      <p className="font-medium text-slate-100">{label}</p>
      {payload.map((item) => (
        <p key={item.dataKey} className="text-slate-400">
          {item.name}: <span className="font-semibold text-slate-100">{item.dataKey === "exposure" ? money(Number(item.value)) : Number(item.value).toFixed(item.dataKey === "risk" ? 2 : 0)}</span>
        </p>
      ))}
    </div>
  );
}

export default function ForecastingPage({ marketplaceId }) {
  return (
    <div className="space-y-8 text-slate-100">
      <div>
        <p className="text-sm font-medium text-blue-400">Marketplace {marketplaceId}</p>
        <h2 className="mt-3 text-4xl font-semibold tracking-tight text-slate-50">Forecasting</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
          Predict return volume, revenue exposure, and risk direction over the next 30 days.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-6">
          <p className="text-sm text-slate-400">Predicted Return Volume</p>
          <p className="mt-4 text-4xl font-semibold text-slate-50">2,010</p>
          <p className="mt-2 text-sm text-red-400">Next 30 days / +11.8%</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-slate-400">Revenue Exposure Forecast</p>
          <p className="mt-4 text-4xl font-semibold text-red-400">₹4.6M</p>
          <p className="mt-2 text-sm text-slate-500">Projected preventable exposure</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-slate-400">Risk Trend Projection</p>
          <p className="mt-4 text-4xl font-semibold text-amber-400">0.75</p>
          <p className="mt-2 text-sm text-slate-500">Expected marketplace risk score</p>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Revenue exposure forecast</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-50">Next 30 days</h3>
          <div className="mt-5 h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecast} margin={{ left: -18, right: 8, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="forecastExposure" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.32} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="day" stroke="#64748B" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <YAxis stroke="#64748B" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} tickFormatter={money} />
                <Tooltip content={<ChartTooltip />} />
                <Area dataKey="exposure" name="Revenue exposure" type="monotone" stroke="#EF4444" strokeWidth={3} fill="url(#forecastExposure)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Risk trend projection</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-50">Model outlook</h3>
          <div className="mt-5 h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecast} margin={{ left: -18, right: 8, top: 10, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="day" stroke="#64748B" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <YAxis stroke="#64748B" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} domain={[0, 1]} />
                <Tooltip content={<ChartTooltip />} />
                <Line dataKey="risk" name="Projected risk" type="monotone" stroke="#3B82F6" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
