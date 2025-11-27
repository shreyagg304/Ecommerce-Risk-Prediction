# backend/train_seller_models.py
import pandas as pd
import joblib
import os
import json
from sklearn.preprocessing import OneHotEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

FEATURES = [
    "Product_Category","Product_Price","Discount_Applied",
    "Delivery_Time_Days","Customer_Type","Payment_Method",
    "Customer_Return_Rate","Product_Rating"
]

def train_for_seller(df, seller_id, models_dir):
    sdf = df[df['seller_id'] == seller_id].copy()
    if len(sdf) < 30:
        print(f"Skipping seller {seller_id} (rows={len(sdf)})")
        return False

    # numeric conversion
    for c in ['Product_Price','Discount_Applied','Delivery_Time_Days','Customer_Return_Rate','Product_Rating']:
        sdf[c] = pd.to_numeric(sdf[c], errors='coerce').fillna(0.0)

    X = sdf[FEATURES]
    y = pd.to_numeric(sdf['Returned'], errors='coerce').fillna(0).astype(int)

    cat_cols = ['Product_Category','Customer_Type','Payment_Method']
    encoder = OneHotEncoder(sparse_output=False, handle_unknown="ignore")
    X_cat = encoder.fit_transform(X[cat_cols])
    X_num = X.drop(columns=cat_cols).select_dtypes(include=[int,float]).values
    import numpy as np
    X_final = np.hstack([X_num, X_cat])

    X_train, X_test, y_train, y_test = train_test_split(X_final, y, test_size=0.2, random_state=42, stratify=y)
    clf = RandomForestClassifier(n_estimators=200, class_weight='balanced', random_state=42)
    clf.fit(X_train, y_train)

    # metrics
    y_pred = clf.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)

    os.makedirs(models_dir, exist_ok=True)
    model_bundle = {'model': clf, 'encoder': encoder, 'features': FEATURES}
    joblib.dump(model_bundle, os.path.join(models_dir, f"model_{seller_id}.joblib"))

    stats = {
        'seller_id': seller_id,
        'n_rows': int(len(sdf)),
        'accuracy': float(acc),
        'precision': float(prec),
        'recall': float(rec),
        'f1': float(f1)
    }
    with open(os.path.join(models_dir, f"model_{seller_id}_stats.json"), "w") as fh:
        json.dump(stats, fh)

    print(f"Trained {seller_id}: acc={acc:.3f} prec={prec:.3f} rec={rec:.3f} f1={f1:.3f}")
    return True

def train_all(data_dir, models_dir):
    orders_path = os.path.join(data_dir, 'orders.csv')
    if not os.path.exists(orders_path):
        print("No orders.csv in data_dir")
        return
    df = pd.read_csv(orders_path)
    sellers = df['seller_id'].unique()
    for s in sellers:
        try:
            train_for_seller(df, s, models_dir)
        except Exception as e:
            print("Error training", s, e)

if __name__ == "__main__":
    import sys
    data_dir = sys.argv[1] if len(sys.argv)>1 else './data'
    models_dir = sys.argv[2] if len(sys.argv)>2 else './models'
    train_all(data_dir, models_dir)
