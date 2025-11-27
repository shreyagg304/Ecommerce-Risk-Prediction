import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random
import os

os.makedirs("./backend/data", exist_ok=True)
# ------------------------------
# SETTINGS
# ------------------------------
TOTAL_ROWS = 5000
DAYS_BACK = 90

marketplaces = {
    "M001": ["S001", "S002", "S003", "S004", "S005"],
    "M002": ["S006", "S007", "S008"],
    "M003": ["S009", "S010"]
}

categories = ["Electronics", "Clothing", "Home", "Beauty", "Grocery", "Footwear"]
customer_types = ["New", "Returning"]
payments = ["COD", "UPI", "Card", "Wallet"]

# risk distribution: SPICY profile
# ~35% high, ~30% medium, ~35% low
def generate_risk():
    r = random.random()
    if r < 0.35:
        score = round(random.uniform(0.75, 0.98), 4)
        label = "High"
    elif r < 0.65:
        score = round(random.uniform(0.45, 0.75), 4)
        label = "Medium"
    else:
        score = round(random.uniform(0.05, 0.45), 4)
        label = "Low"
    return score, label


# ------------------------------
# Generate sellers.csv
# ------------------------------
seller_rows = []

for m, seller_list in marketplaces.items():
    for seller in seller_list:
        seller_rows.append({
            "seller_id": seller,
            "seller_name": f"Seller_{seller}",
            "marketplace_id": m
        })

sellers_df = pd.DataFrame(seller_rows)
sellers_df.to_csv("./backend/data/sellers.csv", index=False)

print("Created sellers.csv")

# ------------------------------
# Generate orders.csv
# ------------------------------
orders = []

start_date = datetime.now() - timedelta(days=DAYS_BACK)

for i in range(TOTAL_ROWS):
    # pick marketplace
    marketplace = random.choice(list(marketplaces.keys()))
    seller = random.choice(marketplaces[marketplace])
    
    # random date in last 90 days
    order_time = start_date + timedelta(days=random.random()*DAYS_BACK)
    
    category = random.choice(categories)
    price = round(random.uniform(200, 5000), 2)
    discount = round(price * random.uniform(0.05, 0.35), 2)
    delivery = random.randint(1, 7)
    cust_type = random.choice(customer_types)
    payment = random.choice(payments)
    ret_rate = round(random.uniform(0.01, 0.25), 2)
    rating = round(random.uniform(1.0, 5.0), 1)
    returned = np.random.choice([0, 1], p=[0.8, 0.2])

    Order_ID = f"ORD{i+1:05d}"

    orders.append({
        "Order_ID": Order_ID,
        "Product_Category": category,
        "Product_Price": price,
        "Discount_Applied": discount,
        "Delivery_Time_Days": delivery,
        "Customer_Type": cust_type,
        "Payment_Method": payment,
        "Customer_Return_Rate": ret_rate,
        "Product_Rating": rating,
        "Returned": returned,
        "seller_id": seller,
        "marketplace_id": marketplace,
        "order_timestamp": order_time.strftime("%Y-%m-%d")
    })

orders_df = pd.DataFrame(orders)
orders_df.to_csv("./backend/data/orders.csv", index=False)

print("Created orders.csv")

# ------------------------------
# Generate batch_predictions.csv
# ------------------------------

pred_rows = []
for row in orders:
    risk_score, risk_label = generate_risk()
    
    pred_rows.append({
        "Order_ID": row["Order_ID"],
        "seller_id": row["seller_id"],
        "marketplace_id": row["marketplace_id"],
        "Product_Category": row["Product_Category"],
        "Customer_Type": row["Customer_Type"],
        "Payment_Method": row["Payment_Method"],
        "risk_score": risk_score,
        "risk_label": risk_label,
        "timestamp": row["order_timestamp"]
    })

pred_df = pd.DataFrame(pred_rows)
pred_df.to_csv("./backend/data/batch_predictions.csv", index=False)

print("Created batch_predictions.csv")
print("All mock data generated successfully!")
