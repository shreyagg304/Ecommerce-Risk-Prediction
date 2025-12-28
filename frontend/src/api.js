import axios from "axios";
const BASE = "http://localhost:5000";

export const getInsights = (mid) =>
  axios.get(`${BASE}/marketplace_stats`, { params: { marketplace_id: mid } });

export const getCategoryRisk = (mid) =>
  axios.get(`${BASE}/marketplace_category_risk`, { params: { marketplace_id: mid } });

export const getSellers = (mid) =>
  axios.get(`${BASE}/sellers`, { params: { marketplace_id: mid } });

export const getSellerOrders = (sid) =>
  axios.get(`${BASE}/seller_orders`, { params: { seller_id: sid } });

export const getSellerTrend = (sid) =>
  axios.get(`${BASE}/seller_trend`, { params: { seller_id: sid } });

export const getSellerModelStats = (sid) =>
  axios.get(`${BASE}/seller_model_stats`, { params: { seller_id: sid } });

export const getSellerExplanation = (sid) =>
  axios.get(`${BASE}/seller_explanation`, { params: { seller_id: sid } });

export function getCategoryTrend(marketplaceId, category = "") {
  const params = new URLSearchParams();
  if (marketplaceId) params.append("marketplace_id", marketplaceId);
  if (category) params.append("category", category);
  return axios.get(`${BASE}/marketplace_category_trend?${params.toString()}`);
}
