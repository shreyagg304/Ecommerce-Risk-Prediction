import React, { useState } from "react";
import MarketplaceDashboard from "./pages/MarketplaceDashboard";
import SellerDashboard from "./pages/SellerDashboard";

export default function App() {
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [marketplace, setMarketplace] = useState("M001");

  const handleViewSeller = (sellerId, market) => {
    setSelectedSeller(sellerId);
    setMarketplace(market);
  };

  const handleBack = () => {
    setSelectedSeller(null);
  };

  return (
    <div className="flex min-h-screen bg-base-900 text-gray-200">

      {/* SIDEBAR */}
      <aside className="w-64 bg-base-800 border-r border-base-700 p-6 flex flex-col">
        <h1 className="text-2xl font-semibold text-brand-400 mb-10 tracking-wide">
          ReturnRisk
        </h1>

        <nav className="flex flex-col gap-2">
          <NavItem label="Dashboard" active={!selectedSeller} />
          <NavItem label="Seller View" active={!!selectedSeller} />
        </nav>

        <div className="mt-auto pt-6 text-sm text-gray-500">
          © ReturnRisk 2025
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-semibold text-white">
            {selectedSeller ? `Seller ${selectedSeller}` : "Marketplace Dashboard"}
          </h2>

          <div className="px-4 py-2 rounded-lg bg-base-800 border border-base-700">
            <select
              value={marketplace}
              onChange={(e) => setMarketplace(e.target.value)}
              className="bg-base-800/90 text-white focus:outline-none"
            >
              <option>M001</option>
              <option>M002</option>
              <option>M003</option>
            </select>
          </div>
        </div>

        {!selectedSeller ? (
          <MarketplaceDashboard
            marketplaceId={marketplace}
            onViewSeller={handleViewSeller}
          />
        ) : (
          <SellerDashboard
            sellerId={selectedSeller}
            marketplaceId={marketplace}
            onBack={handleBack}
          />
        )}
      </main>
    </div>
  );
}

function NavItem({ label, active }) {
  return (
    <button
      className={`text-left px-3 py-2 rounded-lg transition-all w-full
        ${active 
          ? "bg-brand-600 text-white shadow-glow" 
          : "hover:bg-base-700 text-gray-400 hover:text-white"
        }`}
    >
      {label}
    </button>
  );
}
