# Smart Customer Segmentation — An Interactive Machine Learning Playground

Unit 3 project (Mixture Models and EM). A React dashboard backed by a Flask + scikit-learn API that segments customers with real, computed clustering results.

## Objectives
Explore and upload customer data, run K-means and Gaussian Mixture Models (EM), compare them, visualize with PCA, and evaluate with Silhouette, Davies-Bouldin and Calinski-Harabasz. Download-ready labels are returned by the API (`labels` / per-point `c`).

## Features
Overview dashboard · Dataset (search by ID, sort, filter, stats, CSV upload with validation, sample download, reset) · Clustering Lab (K-means, GMM, scaling toggle, elbow method, real EM log-likelihood trace, per-customer membership probabilities) · Algorithm Comparison · PCA · Hierarchical clustering with dendrogram · Factor Analysis with loading heatmap · Learn & Explore.

## Technologies
React + Vite, Tailwind CSS v4, Recharts, Lucide, React Router · Flask, Flask-CORS, NumPy, Pandas, scikit-learn, SciPy. No database, API keys or paid services.

## Architecture
`frontend/` calls `/api/*` (Vite proxies to Flask on port 5001). The browser holds the dataset and sends it with each request; the backend is stateless (CSV / in-memory only).

## Run on Windows
**Backend** (PowerShell, terminal 1)
```
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```
**Frontend** (terminal 2) — needs Node.js 18+
```
cd frontend
npm install
npm run dev
```
Open http://localhost:5173

## API
| Method | Endpoint | Purpose |
|---|---|---|
| GET | /api/health | Health check |
| GET | /api/dataset/sample[?format=csv] | Default dataset (JSON or CSV) |
| POST | /api/dataset/upload | CSV upload (multipart `file`, max 5 MB) |
| POST | /api/clustering/kmeans, /gmm, /compare, /elbow, /hierarchical | Clustering |
| POST | /api/dimensionality/pca, /factor-analysis | Dimensionality reduction |
| POST | /api/evaluation | Metrics for supplied labels |

Request body: `{rows, features, scale, impute, params}`. Errors return `{error: "message"}`.

## Dataset
300 synthetic customers (seed 42): CustomerID, Age, Gender, AnnualIncome, SpendingScore, PurchaseFrequency, AverageOrderValue. Generated from five overlapping groups (high/high, high/low, low/high, low/low, mid); group labels are never stored or given to the algorithms.

## Limitations / simplifications
- K-means iterations are reported from scikit-learn (centroid-by-centroid animation is not shown). The GMM EM trace is real: the model is refit for 1…n iterations from the same initialization.
- Missing values: rows are never dropped; choose mean/median imputation or the request is rejected.
- Segment descriptions use cluster means vs. overall means of AnnualIncome/SpendingScore (or the first two features).
- Dendrogram uses a sample of up to 100 customers. Learn & Explore is text-based without interactive widgets. "Download results" is available through API labels; a UI button for it is not included.

## Future improvements
Result CSV export button, animated EM steps, theme toggle, automated tests, Docker.
