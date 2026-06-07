# backend/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import pandas as pd

from utils import (
    load_sellers,
    load_orders,
    load_batch_predictions,
    compute_marketplace_stats,
    compute_category_risk,
    compute_seller_trend,
    compute_category_trend,
    load_model_stats,
    get_seller_marketplace,
    explain_seller_risk,
)

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(__file__)
DATA_DIR = os.path.join(BASE_DIR, "data")
MODELS_DIR = os.path.join(BASE_DIR, "models")


@app.route("/health")
def health():
    return jsonify({"status":"ok"})


@app.route("/marketplace_insights")
def marketplace_insights():
    marketplace_id = request.args.get("marketplace_id")
    sellers = load_sellers(DATA_DIR)
    orders = load_orders(DATA_DIR)

    if marketplace_id:
        sellers = sellers[sellers.marketplace_id == marketplace_id]
        orders = orders[orders.marketplace_id == marketplace_id]

    return jsonify({
        "total_orders": int(len(orders)),
        "total_sellers": int(sellers.seller_id.nunique())
    })


@app.route("/marketplace_stats")
def marketplace_stats():
    marketplace_id = request.args.get("marketplace_id")
    orders = load_orders(DATA_DIR)
    preds = load_batch_predictions(DATA_DIR)
    stats = compute_marketplace_stats(orders, preds, marketplace_id)
    return jsonify(stats)


@app.route("/marketplace_category_risk")
def marketplace_category_risk():
    marketplace_id = request.args.get("marketplace_id")
    orders = load_orders(DATA_DIR)
    preds = load_batch_predictions(DATA_DIR)
    cat = compute_category_risk(orders, preds, marketplace_id)
    return jsonify(cat)


@app.route("/sellers")
def sellers_list():
    marketplace_id = request.args.get("marketplace_id")
    sellers = load_sellers(DATA_DIR)

    if marketplace_id:
        sellers = sellers[sellers.marketplace_id == marketplace_id]

    return jsonify(sellers.fillna("").to_dict(orient="records"))


@app.route("/seller_orders")
def seller_orders():
    seller_id = request.args.get("seller_id")
    orders = load_orders(DATA_DIR)

    if seller_id:
        orders = orders[orders.seller_id == seller_id]

    # sort but do NOT LIMIT
    if "order_timestamp" in orders.columns:
        orders["order_timestamp"] = pd.to_datetime(orders["order_timestamp"], errors="coerce")
        orders = orders.sort_values("order_timestamp", ascending=False)
        orders["order_timestamp"] = orders["order_timestamp"].astype(str)
    else:
        orders = orders.sort_values("Order_ID", ascending=False)

    return jsonify(orders.fillna("").to_dict(orient="records"))

@app.route("/seller_trend")
def seller_trend():
    seller_id = request.args.get("seller_id")
    preds = load_batch_predictions(DATA_DIR)

    if seller_id:
        preds = preds[preds.seller_id == seller_id]

    trend = compute_seller_trend(preds)
    return jsonify(trend)


@app.route("/seller_model_stats")
def seller_model_stats():
    seller_id = request.args.get("seller_id")
    stats = load_model_stats(MODELS_DIR, seller_id)
    return jsonify(stats)


@app.route("/marketplace_category_trend")
def marketplace_category_trend():
    """
    Query params:
      - marketplace_id (optional)
      - category (optional)  -> if present, API will filter to that category's series only
    """
    marketplace_id = request.args.get("marketplace_id")
    category = request.args.get("category")

    orders = load_orders(DATA_DIR)
    preds = load_batch_predictions(DATA_DIR)

    res = compute_category_trend(orders, preds, marketplace_id=marketplace_id, top_n=8)

    # If user requested a single category, return just that one series (if available)
    if category:
        found = [s for s in res.get("series", []) if s["category"] == category]
        return jsonify({"series": found, "requested_category": category, "top_categories": res.get("top_categories", [])})

    return jsonify(res)

@app.route("/seller_explanation")
def seller_explanation():
    seller_id = request.args.get("seller_id")

    if not seller_id:
        return jsonify([])

    orders = load_orders(DATA_DIR)
    preds = load_batch_predictions(DATA_DIR)

    reasons = explain_seller_risk(orders, preds, seller_id)
    return jsonify(reasons)

if __name__ == "__main__":
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(MODELS_DIR, exist_ok=True)
    app.run(host="0.0.0.0", port=5000, debug=True)
