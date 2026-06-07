import React from "react";

export default function TopNav({
  marketplace,
  setMarketplace,
  selectedSeller,
  onBack,
  activeView,
  setActiveView
}) {
  const navItems = ["Overview", "Monitoring", "Forecasting", "Sellers", "Categories", "Alerts", "Settings"];

  return (
    <header className="sticky top-0 z-20 border-b border-white/[0.08] bg-[#0B1020]/90 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-4">
          {selectedSeller && (
            <button
              onClick={onBack}
              className="hidden rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/[0.06] hover:text-slate-50 sm:inline-flex"
            >
              Back
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-sm font-bold text-white shadow-[0_0_40px_rgba(59,130,246,0.35)]">
              RR
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight text-slate-50">
                ReturnRisk
              </h1>
              <p className="hidden text-xs text-slate-500 sm:block">
                Predictive return intelligence
              </p>
            </div>
          </div>
        </div>

        <nav className="hidden max-w-3xl items-center gap-1 overflow-x-auto rounded-xl border border-white/[0.08] bg-white/[0.03] p-1 text-sm font-medium text-slate-400 lg:flex">
          {navItems.map((item) => (
            <button
              key={item}
              onClick={() => {
                if (selectedSeller) onBack();
                setActiveView(item);
              }}
              className={`rounded-lg px-3 py-2 transition ${
                (!selectedSeller && activeView === item) || (selectedSeller && item === "Sellers")
                  ? "bg-[#182132] text-slate-50 shadow-sm"
                  : "hover:bg-white/[0.05] hover:text-slate-200"
              }`}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-slate-500 xl:inline">
            {selectedSeller ? `Seller ${selectedSeller}` : `${activeView} / Marketplace`}
          </span>

          <select
            value={marketplace}
            onChange={(e) => setMarketplace(e.target.value)}
            className="h-10 rounded-lg border border-white/[0.08] bg-[#131A2A] px-3 text-sm font-medium text-slate-100 shadow-sm outline-none transition focus:border-blue-500/60 focus:ring-4 focus:ring-blue-500/10"
          >
            <option>M001</option>
            <option>M002</option>
            <option>M003</option>
          </select>
        </div>
      </div>
    </header>
  );
}
