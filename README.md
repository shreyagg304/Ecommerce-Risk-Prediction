# ReturnRisk – E-commerce Return Risk Analytics Dashboard

A full-stack analytics system that predicts, monitors, and explains order return risk across multiple marketplaces and sellers using machine learning and interactive dashboards.

# 🚀 What this project does

ReturnRisk simulates how large e-commerce platforms monitor return risk at scale.

## It provides:

Marketplace-level risk insights

Seller-level risk trends and explanations

Category-wise risk analysis

Alerting for high-risk sellers and categories

Time-based trend filtering (Last 7 / 30 / 90 days)

All data is generated synthetically to demonstrate real-world workflows.

# 🧠 Key Features
Marketplace Dashboard

Total orders & sellers overview

Overall marketplace health score

Risk trend over time

Category-level risk distribution

Top risky sellers

Automated risk alerts

Seller Dashboard

Seller-specific order history

Risk trend over time

ML model performance metrics

Rule-based explanations for elevated risk

High return rate

High COD usage

Low product ratings

Consistently high predicted risk

Time-Based Filtering

Supports Last 7 / 30 / 90 days

Filters are computed relative to the latest available dataset date, mimicking batch analytics systems used in production

# 🏗️ Architecture

## Frontend

React

Recharts (visualization)

Tailwind CSS

Deployed on Vercel

## Backend

Flask

Pandas / NumPy

scikit-learn (Random Forest)

REST APIs

Deployed on Render

Data

Synthetic CSV datasets

Generated via custom script

Committed for deterministic demos

# 🤖 Machine Learning

Seller-specific Random Forest models

Predicts probability of order return

## Trained on:

Product category

Price & discount

Delivery time

Customer type

Payment method

Product rating

## Model metrics exposed per seller:

Accuracy

Precision

Recall

F1 score

# 📊 Risk Alerts

## The system automatically flags:

Sellers with consistently high average risk

Categories with elevated return risk

Alerts are surfaced directly on the marketplace dashboard.

# 🔍 Explainability

Instead of black-box predictions, the system provides human-readable explanations for seller risk based on observable patterns in the data.

This mirrors how risk and trust teams justify decisions internally.

# 🌐 Live Demo

Backend: https://ecommerce-risk-prediction.onrender.com

Health Check: /health

(Frontend deployed separately)

# 🛠️ Local Setup
## Backend
```bash
cd backend
pip install -r requirements.txt
python generate_mock_data.py
python app.py
```
## Frontend
```bash
cd frontend
npm install
npm start
```

# 📝 Notes

Data is synthetic and pre-generated for demo stability

The backend uses an ephemeral filesystem (Render), so datasets are committed

Time filters are relative to dataset dates, not real-time streaming data

# 📌 Why this project matters

This project demonstrates:

End-to-end system design

Practical ML integration

Analytics-first thinking

Explainability and monitoring

Production-style dashboards

Deployment and environment handling

It focuses on clarity, realism, and decision support, not just prediction accuracy.
