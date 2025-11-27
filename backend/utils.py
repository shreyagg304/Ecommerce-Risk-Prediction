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
# Prediction & Logging
# ------------------------------------------------------------

def predict_single_order(order_dict, model_path):
    if not os.path.exists(model_path):
        return {"risk_score": 0.5, "risk_label": "Medium"}

    bundle = joblib.load(model_path)
    model = bundle["model"]
    encoder = bundle["encoder"]
    features = bundle["features"]

    # Clean numeric data
    o = dict(order_dict)
    for col in ["Product_Price","Discount_Applied","Delivery_Time_Days",
                "Customer_Return_Rate","Product_Rating"]:
        try:
            o[col] = float(o.get(col, 0))
        except:
            o[col] = 0.0

    X = pd.DataFrame([o])
    cat_cols = ["Product_Category","Customer_Type","Payment_Method"]

    X_cat = encoder.transform(X[cat_cols])
    X_num = X.drop(columns=cat_cols).select_dtypes(include=[float,int]).values
    X_final = np.hstack([X_num, X_cat])

    try:
        proba = float(model.predict_proba(X_final)[0].max())
        pred = int(model.predict(X_final)[0])
    except:
        pred = int(model.predict(X_final)[0])
        proba = 0.9 if pred == 1 else 0.1

    if proba > 0.75:
        label = "High" if pred == 1 else "Low"
    elif proba > 0.45:
        label = "Medium"
    else:
        label = "Low"

    return {"risk_score": proba, "risk_label": label}


def log_prediction(order, result, data_dir):
    path = os.path.join(data_dir, "batch_predictions.csv")

    order_id = order.get("Order_ID") or f"GEN_{int(datetime.utcnow().timestamp())}"

    row = {
        "Order_ID": order_id,
        "seller_id": order.get("seller_id", ""),
        "marketplace_id": order.get("marketplace_id", ""),

        # These fields FIX category risk
        "Product_Category": order.get("Product_Category", ""),
        "Customer_Type": order.get("Customer_Type", ""),
        "Payment_Method": order.get("Payment_Method", ""),

        "risk_score": result.get("risk_score"),
        "risk_label": result.get("risk_label"),
        "timestamp": datetime.utcnow().isoformat()
    }

    df = pd.DataFrame([row])

    if os.path.exists(path):
        existing = pd.read_csv(path)
        final = pd.concat([existing, df], ignore_index=True)
    else:
        final = df

    final.to_csv(path, index=False)


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
        p["date"] = pd.to_datetime(p["timestamp"]).dt.date
        trend = (
            p.groupby("date")["risk_score"]
            .mean()
            .reset_index()
            .to_dict(orient="records")
        )
    else:
        trend = []

    # Category risk (directly from predictions now)
    if not p.empty:
        cat = (
            p.groupby("Product_Category")["risk_score"]
            .mean()
            .reset_index()
            .to_dict(orient="records")
        )
    else:
        cat = []

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

    return {
        "total_orders": int(total_orders),
        "total_sellers": int(total_sellers),
        "trend": trend,
        "category_risk": cat,
        "top_risky_sellers": top,
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


def load_model_stats(models_dir, seller_id):
    stats_path = os.path.join(models_dir, f"model_{seller_id}_stats.json")
    if not os.path.exists(stats_path):
        return {"error":"no_stats"}
    return pd.read_json(stats_path, typ='series').to_dict()
