# Return Risk Project (demo)

This is a starter demo for an e-commerce return risk prediction system.
It includes a minimal Flask backend, a simple RandomForest per-seller trainer,
example CSV data, and a tiny React frontend scaffold.

## Run backend
```
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# optionally train models:
python train_seller_models.py ./data ../backend/models
python app.py
```

## Run frontend (basic)
```
cd frontend
npm install
# create src/index.js rendering App.jsx and run with your preferred dev server
```

Notes: This is purposely minimal to help you iterate quickly.
