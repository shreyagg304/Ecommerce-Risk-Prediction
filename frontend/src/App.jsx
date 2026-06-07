import React, { useState } from "react";
import MarketplaceDashboard from "./pages/MarketplaceDashboard";
import SellerDashboard from "./pages/SellerDashboard";
import MonitoringCenter from "./pages/MonitoringCenter";
import ForecastingPage from "./pages/ForecastingPage";
import TopNav from "./components/TopNav";

function WorkspacePage({ title, subtitle, items = [] }) {
  return (
    <div className="space-y-6 text-slate-100">
      <div>
        <p className="text-sm font-medium text-slate-500">ReturnRisk 2.0</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-50">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{subtitle}</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {items.map((item) => (
          <section key={item.title} className="rounded-xl border border-white/[0.08] bg-[#182132] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
            <p className="text-sm font-medium text-slate-400">{item.label}</p>
            <p className="mt-3 text-2xl font-semibold text-slate-50">{item.title}</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">{item.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [marketplace, setMarketplace] = useState("M001");
  const [activeView, setActiveView] = useState("Overview");

  const handleViewSeller = (sellerId, market) => {
    setSelectedSeller(sellerId);
    setMarketplace(market);
  };

  const handleBack = () => {
    setSelectedSeller(null);
  };

  const renderView = () => {
    if (selectedSeller) {
      return (
        <SellerDashboard
          sellerId={selectedSeller}
          marketplaceId={marketplace}
          onBack={handleBack}
        />
      );
    }

    if (activeView === "Monitoring") {
      return <MonitoringCenter marketplaceId={marketplace} onViewSeller={handleViewSeller} />;
    }

    if (activeView === "Forecasting") {
      return <ForecastingPage marketplaceId={marketplace} />;
    }

    if (activeView === "Sellers") {
      return (
        <WorkspacePage
          title="Seller Intelligence"
          subtitle="Monitor seller health, prioritize interventions, and open detailed risk profiles from the overview seller directory."
          items={[
            { label: "Workflow", title: "Seller scorecards", body: "Use the Overview seller monitoring table to drill into revenue exposure, explanations, benchmarks, and recent orders." },
            { label: "Focus", title: "High-risk cohorts", body: "Prioritize sellers with rising predicted return rates and high revenue exposure." },
            { label: "Action", title: "Seller success handoff", body: "Use recommended actions to guide quality, listing, fulfillment, and COD reviews." }
          ]}
        />
      );
    }

    if (activeView === "Categories") {
      return (
        <WorkspacePage
          title="Category Intelligence"
          subtitle="Understand which product categories are driving return exposure and where marketplace teams should intervene."
          items={[
            { label: "Top signal", title: "Beauty risk concentration", body: "Beauty and Fashion categories are highlighted in the executive overview as primary revenue exposure drivers." },
            { label: "Analysis", title: "Risk and revenue side by side", body: "Category tables rank risk score, revenue exposure, return rate, and trend direction together." },
            { label: "Action", title: "Listing quality review", body: "Prioritize low-rated listings, misleading descriptions, and fulfillment issues in high-risk categories." }
          ]}
        />
      );
    }

    if (activeView === "Alerts") {
      return (
        <WorkspacePage
          title="Alerts"
          subtitle="A central queue for revenue-impacting seller and category risks."
          items={[
            { label: "Priority", title: "High confidence alerts", body: "Alerts are framed by severity, revenue exposure, confidence, and recommended action." },
            { label: "Escalation", title: "Operations workflow", body: "Use Monitoring to see new risks, escalated sellers, recovered sellers, and pending reviews." },
            { label: "Outcome", title: "Reduce preventable returns", body: "The alert model supports action before revenue is impacted." }
          ]}
        />
      );
    }

    if (activeView === "Settings") {
      return (
        <WorkspacePage
          title="Settings"
          subtitle="Workspace configuration placeholder for a future production deployment."
          items={[
            { label: "Marketplace", title: marketplace, body: "Marketplace switching remains available without adding authentication or account management." },
            { label: "Rules", title: "Risk thresholds", body: "Future teams could configure revenue exposure thresholds and alert severity mappings here." },
            { label: "Data", title: "Existing APIs preserved", body: "This redesign does not change backend routes, database structures, or model training." }
          ]}
        />
      );
    }

    return <MarketplaceDashboard marketplaceId={marketplace} onViewSeller={handleViewSeller} />;
  };

  return (
    <div className="min-h-screen bg-[#0B1020] text-slate-100">

      <TopNav
        marketplace={marketplace}
        setMarketplace={setMarketplace}
        selectedSeller={selectedSeller}
        onBack={handleBack}
        activeView={activeView}
        setActiveView={setActiveView}
      />

      <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
        {renderView()}
      </main>

    </div>
  );
}
