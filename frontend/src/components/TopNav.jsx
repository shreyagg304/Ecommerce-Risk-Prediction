import React from "react";

export default function TopNav({
  marketplace,
  setMarketplace,
  selectedSeller,
  onBack
}) {
  return (
    <div className="flex items-center justify-between px-8 py-4 bg-base-800 border-b border-base-700">

      {/* LEFT */}
      <div className="flex items-center gap-6">
        <h1 className="text-xl font-semibold text-brand-400">
          ReturnRisk
        </h1>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-400">
          {selectedSeller ? `Seller ${selectedSeller}` : "Marketplace"}
        </span>

        <select
          value={marketplace}
          onChange={(e) => setMarketplace(e.target.value)}
          className="bg-base-700 text-white px-3 py-2 rounded-lg focus:outline-none"
        >
          <option>M001</option>
          <option>M002</option>
          <option>M003</option>
        </select>
      </div>
    </div>
  );
}
