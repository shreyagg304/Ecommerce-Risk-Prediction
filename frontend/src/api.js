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

export const predictOrder = (sid, order) => {
  const allowed = [
    "Product_Category",
    "Product_Price",
    "Discount_Applied",
    "Delivery_Time_Days",
    "Customer_Type",
    "Payment_Method",
    "Customer_Return_Rate",
    "Product_Rating"
  ];

  const cleanOrder = {};
  allowed.forEach(k => cleanOrder[k] = order[k]);

  return axios.post(`${BASE}/predict_seller_order`, {
    seller_id: sid,
    order: cleanOrder
  });
};