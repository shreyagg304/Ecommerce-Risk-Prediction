# backend/utils.py
import pandas as pd
import os
import joblib
import numpy as np
from datetime import datetime

# ------------------------------------------------------------
# Loaders
# ------------------------------------------------------------

def load_sellers(data_dir):
    path = os.path.join(data_dir, "sellers.csv")
    if not os.path.exists(path):
        return pd.DataFrame(columns=["seller_id", "seller_name", "marketplace_id"])
    return pd.read_csv(path, dtype=str)


def load_orders(data_dir):
    path = os.path.join(data_dir, "orders.csv")
    if not os.path.exists(path):
        cols = [
            'Order_ID','Product_Category','Product_Price','Discount_Applied',
            'Delivery_Time_Days','Customer_Type','Payment_Method',
            'Customer_Return_Rate','Product_Rating','Returned',
            'seller_id','marketplace_id','order_timestamp'
        ]
        return pd.DataFrame(columns=cols)

    df = pd.read_csv(path, dtype=str)

    if 'order_timestamp' not in df.columns:
        df['order_timestamp'] = pd.NaT
    else:
        df['order_timestamp'] = pd.to_datetime(df['order_timestamp'], errors='coerce')

    return df


def load_batch_predictions(data_dir):
    path = os.path.join(data_dir, "batch_predictions.csv")

    required = [
        "Order_ID","seller_id","marketplace_id",
        "Product_Category","Customer_Type","Payment_Method",
        "risk_score","risk_label","timestamp"
    ]

    if not os.path.exists(path):
        return pd.DataFrame(columns=required)

    try:
        df = pd.read_csv(path)
    except Exception:
        df = pd.DataFrame(columns=required)
        df.to_csv(path, index=False)
        return df

    for col in required:
        if col not in df.columns:
            df[col] = None

    df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")

    return df


def get_seller_marketplace(seller_id, data_dir):
    sellers = load_sellers(data_dir)
    row = sellers[sellers["seller_id"] == seller_id]
    if row.empty:
        return None
    return row.iloc[0]["marketplace_id"]


# ------------------------------------------------------------
# Aggregations
# ------------------------------------------------------------

def compute_marketplace_stats(orders_df, preds_df, marketplace_id=None):
    o = orders_df.copy()
    p = preds_df.copy()

    if marketplace_id:
        o = o[o["marketplace_id"] == marketplace_id]
        p = p[p["marketplace_id"] == marketplace_id]

    total_orders = len(o)
    total_sellers = o["seller_id"].nunique()

    # Trend
    if not p.empty:
        p["timestamp"] = pd.to_datetime(p["timestamp"], errors="coerce")
        p["date"] = p["timestamp"].dt.date
        trend = (
            p.groupby("date")["risk_score"]
            .mean()
            .reset_index()
            .to_dict(orient="records")
        )
    else:
        trend = []

    # Category risk
    if not p.empty and "Product_Category" in p.columns:
        cat = (
            p.groupby("Product_Category")["risk_score"]
            .mean()
            .reset_index()
            .to_dict(orient="records")
        )
    else:
        cat = []

    # Top risky sellers
    if not p.empty:
        top = (
            p.groupby("seller_id")["risk_score"]
            .mean()
            .reset_index()
            .sort_values("risk_score", ascending=False)
            .to_dict(orient="records")
        )
    else:
        top = []

    if not p.empty:
        high_risk_orders = int((p["risk_score"] >= 0.75).sum())
        high_risk_ratio = float((p["risk_score"] >= 0.75).mean())
        max_risk = float(p["risk_score"].max())
    else:
        high_risk_orders = 0
        high_risk_ratio = 0.0
        max_risk = 0.0

    # ---------------------------------------------------------
    # NEW: Marketplace Health Score
    # ---------------------------------------------------------
    health_score = compute_marketplace_health(o, p)
    alerts = compute_risk_alerts(p, o)

    return {
        "total_orders": int(total_orders),
        "total_sellers": int(total_sellers),
        "trend": trend,
        "category_risk": cat,
        "top_risky_sellers": top,
        "health_score": health_score,
        "alerts": alerts,
        "high_risk_orders": high_risk_orders,
        "high_risk_ratio": round(high_risk_ratio, 3),
        "max_risk": round(max_risk, 3),
    }


def compute_category_risk(orders_df, preds_df, marketplace_id=None):
    p = preds_df.copy()

    if marketplace_id:
        p = p[p["marketplace_id"] == marketplace_id]

    if p.empty:
        return []

    agg = (
        p.groupby("Product_Category")
        .agg(avg_risk=("risk_score", "mean"))
        .reset_index()
        .sort_values("avg_risk", ascending=False)
    )

    return agg.to_dict(orient="records")


def compute_seller_trend(preds_df):
    p = preds_df.copy()
    if p.empty:
        return []
    p['date'] = pd.to_datetime(p['timestamp']).dt.date
    t = p.groupby(['date']).agg(
        avg_risk=('risk_score','mean'),
        high_count=('risk_label', lambda x: (x=='High').sum())
    ).reset_index()
    return t.sort_values('date').to_dict(orient='records')


def compute_category_trend(orders_df, preds_df, marketplace_id=None, top_n=6):
    """
    Returns time-series (daily) average risk per Product_Category.

    Output structure:
    [
      {
        "category": "Electronics",
        "points": [
          {"date": "2025-11-01", "avg_risk": 0.12},
          {"date": "2025-11-02", "avg_risk": 0.14},
          ...
        ]
      },
      ...
    ]
    If marketplace_id provided, filters both orders & preds before computing.
    """
    o = orders_df.copy()
    p = preds_df.copy()

    if marketplace_id:
        o = o[o.get("marketplace_id", "") == marketplace_id]
        p = p[p.get("marketplace_id", "") == marketplace_id]

    if p.empty:
        return []

    # Ensure timestamp + date
    p = p.copy()
    p["timestamp"] = pd.to_datetime(p["timestamp"], errors="coerce")
    p["date"] = p["timestamp"].dt.date

    # If Product_Category not present in predictions but present in orders,
    # do a left-merge to bring it in (safe merge)
    if "Product_Category" not in p.columns:
        merged = p.merge(
            o[["Order_ID", "seller_id", "marketplace_id", "Product_Category"]],
            on=["Order_ID", "seller_id", "marketplace_id"],
            how="left",
        )
    else:
        merged = p.copy()

    # Drop rows without category
    merged = merged[merged["Product_Category"].notna() & (merged["Product_Category"] != "")]

    if merged.empty:
        return []

    # group by date + category -> average risk
    grp = merged.groupby(["Product_Category", "date"])["risk_score"].mean().reset_index()
    grp = grp.sort_values(["Product_Category", "date"])

    # find top categories by overall avg risk (or volume) to limit series when no category filter
    top_categories = (
        grp.groupby("Product_Category")["risk_score"]
        .mean()
        .reset_index()
        .sort_values("risk_score", ascending=False)
        .head(top_n)
        .Product_Category
        .tolist()
    )

    # build time series points for each category found in data
    series = []
    categories = grp["Product_Category"].unique().tolist()

    for cat in categories:
        points_df = grp[grp["Product_Category"] == cat][["date", "risk_score"]]
        points = [{"date": d.isoformat(), "avg_risk": float(r)} for d, r in zip(points_df["date"], points_df["risk_score"])]
        series.append({"category": cat, "points": points})

    # return all series, but frontend will choose a single one if user supplied category param
    # also include a small metadata item 'top_categories' which helps frontend rendering decisions
    return {"series": series, "top_categories": top_categories}


def load_model_stats(models_dir, seller_id):
    stats_path = os.path.join(models_dir, f"model_{seller_id}_stats.json")
    if not os.path.exists(stats_path):
        return {"error":"no_stats"}
    return pd.read_json(stats_path, typ='series').to_dict()


def compute_marketplace_health(o, p):
    if p.empty:
        return 60  # neutral if no predictions

    avg_risk = p['risk_score'].mean()
    high_risk_ratio = (p['risk_label'] == 'High').mean()

    # Return rate from orders
    if 'Returned' in o.columns:
        try:
            return_rate = o['Returned'].astype(float).mean()
        except:
            return_rate = 0
    else:
        return_rate = 0

    # Trend slope
    if 'timestamp' in p.columns:
        p = p.copy()
        p['timestamp'] = pd.to_datetime(p['timestamp'], errors='coerce')
        p['date'] = p['timestamp'].dt.date
        daily = p.groupby('date')['risk_score'].mean().reset_index()

        if len(daily) >= 2:
            slope = daily['risk_score'].iloc[-1] - daily['risk_score'].iloc[0]
        else:
            slope = 0
    else:
        slope = 0

    # Combine everything (0–100 score)
    score = (
        (1 - avg_risk) * 40 +
        (1 - high_risk_ratio) * 25 +
        (1 - return_rate) * 20 +
        (1 - slope) * 15
    )

    return max(0, min(100, round(score)))

def compute_risk_alerts(p, o):
    alerts = []

    if p.empty:
        return alerts

    # -------------------------------
    # Seller-based alerts (COUNT, not mean)
    # -------------------------------
    seller_stats = p.groupby("seller_id").agg(
        high_risk_count=("risk_score", lambda x: (x >= 0.75).sum()),
        total_orders=("risk_score", "count")
    ).reset_index()

    for _, row in seller_stats.iterrows():
        ratio = row["high_risk_count"] / row["total_orders"]
        if row["high_risk_count"] >= 10 and ratio >= 0.25:
            alerts.append({
                "type": "seller",
                "message": (
                    f"Seller {row['seller_id']} has "
                    f"{row['high_risk_count']} high-risk orders "
                    f"({ratio*100:.1f}%)"
                )
            })

    # -------------------------------
    # Category-based alerts (COUNT, not mean)
    # -------------------------------
    cat_stats = p.groupby("Product_Category").agg(
        high_risk_count=("risk_score", lambda x: (x >= 0.75).sum()),
        total_orders=("risk_score", "count")
    )

    for cat, row in cat_stats.iterrows():
        ratio = row["high_risk_count"] / row["total_orders"]
        if ratio >= 0.3:
            alerts.append({
                "type": "category",
                "message": (
                    f"{cat} category has "
                    f"{ratio*100:.1f}% high-risk orders"
                )
            })

    return alerts

def explain_seller_risk(orders_df, preds_df, seller_id):
    sdf = orders_df[orders_df["seller_id"] == seller_id]
    pdf = preds_df[preds_df["seller_id"] == seller_id]

    reasons = []

    if not sdf.empty:
        if sdf["Returned"].astype(float).mean() > 0.3:
            reasons.append("High return rate")

        if (sdf["Payment_Method"] == "COD").mean() > 0.5:
            reasons.append("High COD usage")

        if sdf["Product_Rating"].astype(float).mean() < 3:
            reasons.append("Low average product rating")

    if not pdf.empty:
        if pdf["risk_score"].mean() > 0.7:
            reasons.append("Consistently high predicted risk")

    return reasons
