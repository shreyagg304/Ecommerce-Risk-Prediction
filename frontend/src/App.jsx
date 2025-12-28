import React, { useState } from "react";
import MarketplaceDashboard from "./pages/MarketplaceDashboard";
import SellerDashboard from "./pages/SellerDashboard";
import TopNav from "./components/TopNav";

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
    <div className="min-h-screen bg-base-900 text-gray-200">

      <TopNav
        marketplace={marketplace}
        setMarketplace={setMarketplace}
        selectedSeller={selectedSeller}
        onBack={handleBack}
      />

      <main className="p-8">
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