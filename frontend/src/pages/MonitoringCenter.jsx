import React from "react";

function Card({ children, className = "" }) {
  return (
    <section className={`rounded-2xl border border-white/[0.08] bg-[#182132] shadow-[0_18px_60px_rgba(0,0,0,0.26)] ${className}`}>
      {children}
    </section>
  );
}

const queues = [
  { label: "New Risks Detected", value: 18, detail: "6 seller spikes and 12 category anomalies", tone: "text-red-400" },
  { label: "Escalated Sellers", value: 7, detail: "Assigned to seller success", tone: "text-amber-400" },
  { label: "Recovered Sellers", value: 11, detail: "Risk decreased after intervention", tone: "text-emerald-400" },
  { label: "Pending Reviews", value: 23, detail: "Awaiting operations decision", tone: "text-blue-400" }
];

const worklist = [
  { seller: "S001", status: "Escalated", reason: "Beauty returns increased 14%", owner: "Risk Ops", action: "Review top-returned SKUs" },
  { seller: "S005", status: "New", reason: "COD-heavy inventory trending up", owner: "Seller Success", action: "Audit COD policy" },
  { seller: "S003", status: "Pending", reason: "Low ratings in fashion listings", owner: "Marketplace Ops", action: "Review listing accuracy" }
];

export default function MonitoringCenter({ marketplaceId, onViewSeller }) {
  return (
    <div className="space-y-8 text-slate-100">
      <div>
        <p className="text-sm font-medium text-blue-400">Marketplace {marketplaceId}</p>
        <h2 className="mt-3 text-4xl font-semibold tracking-tight text-slate-50">Monitoring Center</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
          Daily operations workflow for detecting, escalating, and resolving return-risk issues before revenue is impacted.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {queues.map((queue) => (
          <Card key={queue.label} className="p-6">
            <p className="text-sm font-medium text-slate-400">{queue.label}</p>
            <p className={`mt-4 text-4xl font-semibold ${queue.tone}`}>{queue.value}</p>
            <p className="mt-2 text-sm text-slate-500">{queue.detail}</p>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-white/[0.08] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Operations queue</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-50">Priority seller reviews</h3>
        </div>
        <div className="divide-y divide-white/[0.08]">
          {worklist.map((item) => (
            <button
              key={item.seller}
              onClick={() => onViewSeller(item.seller, marketplaceId)}
              className="grid w-full gap-4 px-6 py-5 text-left transition hover:bg-white/[0.03] lg:grid-cols-[0.8fr_0.8fr_1.4fr_0.9fr_1fr]"
            >
              <div>
                <p className="font-semibold text-slate-50">Seller {item.seller}</p>
                <p className="mt-1 text-xs text-slate-500">{item.owner}</p>
              </div>
              <span className="w-fit rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-400">{item.status}</span>
              <p className="text-sm text-slate-300">{item.reason}</p>
              <p className="text-sm text-slate-400">{item.owner}</p>
              <p className="text-sm font-medium text-slate-100">{item.action}</p>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
