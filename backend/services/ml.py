import time
import warnings
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans, AgglomerativeClustering
from sklearn.mixture import GaussianMixture
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA, FactorAnalysis
from sklearn.metrics import silhouette_score, davies_bouldin_score, calinski_harabasz_score
from scipy.cluster.hierarchy import linkage, dendrogram

warnings.filterwarnings("ignore")


def prep(d, min_feats=2):
    df = pd.DataFrame(d["rows"])
    feats = d.get("features") or []
    if len(feats) < min_feats:
        raise ValueError(f"Select at least {min_feats} numerical features.")
    miss = [f for f in feats if f not in df.columns]
    if miss:
        raise ValueError("Unknown column(s): " + ", ".join(miss))
    X = df[feats].apply(pd.to_numeric, errors="coerce")
    if X.isna().any().any():
        how = d.get("impute", "none")
        if how not in ("mean", "median"):
            raise ValueError("Selected features contain missing/invalid values. Choose mean or median imputation.")
        X = X.fillna(X.mean() if how == "mean" else X.median())
        if X.isna().any().any():
            raise ValueError("A selected feature has no valid numeric values.")
    raw = X.to_numpy(float)
    if len(raw) < 5:
        raise ValueError("At least 5 customers are required.")
    sc = StandardScaler().fit(raw) if d.get("scale", True) else None
    return df, feats, raw, (sc.transform(raw) if sc else raw), sc


def metrics(X, labels):
    k, n = len(set(labels)), len(labels)
    if k < 2:
        return {"valid": False, "warning": "Only one cluster was found, so evaluation metrics are undefined."}
    if k >= n:
        return {"valid": False, "warning": "Every customer is its own cluster; metrics are not meaningful."}
    return {"valid": True, "silhouette": float(silhouette_score(X, labels)),
            "davies_bouldin": float(davies_bouldin_score(X, labels)),
            "calinski_harabasz": float(calinski_harabasz_score(X, labels))}


def describe(raw, labels, feats):
    om, os_ = raw.mean(0), raw.std(0) + 1e-9
    ia = feats.index("AnnualIncome") if "AnnualIncome" in feats else 0
    sa = feats.index("SpendingScore") if "SpendingScore" in feats else 1
    lvl = lambda v: "high" if v > 0.4 else "low" if v < -0.4 else "mid"
    names = {("high", "high"): "High-value customers", ("high", "low"): "Premium customers (high income, low spending)",
             ("low", "high"): "Enthusiastic spenders (low income, high spending)", ("low", "low"): "Budget-conscious customers",
             ("mid", "low"): "Low-engagement customers", ("low", "mid"): "Low-engagement customers",
             ("mid", "high"): "Engaged customers", ("high", "mid"): "Affluent moderate spenders"}
    out = []
    for c in sorted(set(labels.tolist())):
        m = raw[labels == c]
        mu = m.mean(0)
        z = (mu - om) / os_
        out.append({"cluster": int(c), "customers": int(len(m)), "means": {f: round(float(v), 2) for f, v in zip(feats, mu)},
                    "description": names.get((lvl(z[ia]), lvl(z[sa])), "Average customers")})
    return out


def payload(df, raw, Xp, labels, feats, centers=None, conf=None):
    labels = np.asarray(labels)
    ids = (df["CustomerID"] if "CustomerID" in df else pd.Series(range(1, len(df) + 1))).astype(str).tolist()
    pts = []
    for i in range(len(labels)):
        p = {"i": i, "id": ids[i], "x": round(float(raw[i, 0]), 2), "y": round(float(raw[i, 1]), 2), "c": int(labels[i])}
        if conf is not None:
            p["conf"] = round(float(conf[i]), 4)
        pts.append(p)
    if centers is None:
        centers = {int(c): raw[labels == c].mean(0) for c in set(labels.tolist())}
    else:
        centers = {int(c): centers[c] for c in range(len(centers))}
    return {"labels": labels.tolist(), "points": pts, "features": feats, "xName": feats[0], "yName": feats[1],
            "centers": [{"cluster": c, "x": round(float(v[0]), 2), "y": round(float(v[1]), 2)} for c, v in centers.items()],
            "stats": describe(raw, labels, feats), "metrics": metrics(Xp, labels.tolist())}


def cluster(algo, d):
    df, feats, raw, Xp, sc = prep(d)
    p = d.get("params", {})
    k, seed = int(p.get("k", 3)), int(p.get("seed", 42))
    max_iter = int(p.get("max_iter", 300))
    if not 1 <= k <= min(15, len(raw) - 1):
        raise ValueError("Number of clusters must be between 1 and 15 (and less than the number of customers).")
    inv = (lambda c: sc.inverse_transform(c)) if sc else (lambda c: c)
    t0 = time.perf_counter()
    if algo == "kmeans":
        m = KMeans(n_clusters=k, init=p.get("init", "k-means++"), max_iter=max_iter, n_init=10, random_state=seed).fit(Xp)
        ms = (time.perf_counter() - t0) * 1000
        out = payload(df, raw, Xp, m.labels_, feats, centers=inv(m.cluster_centers_))
        out["info"] = {"k": k, "iterations": int(m.n_iter_), "inertia": float(m.inertia_)}
    else:
        cov, tol = p.get("covariance", "full"), float(p.get("tol", 1e-3))
        if cov not in ("full", "tied", "diag", "spherical"):
            raise ValueError("Invalid covariance type.")
        mk = lambda it: GaussianMixture(n_components=k, covariance_type=cov, max_iter=it, tol=tol, random_state=seed)
        m = mk(max_iter).fit(Xp)
        ms = (time.perf_counter() - t0) * 1000
        proba = m.predict_proba(Xp)
        out = payload(df, raw, Xp, m.predict(Xp), feats, centers=inv(m.means_), conf=proba.max(1))
        out["proba"] = np.round(proba, 4).tolist()
        out["info"] = {"components": k, "iterations": int(m.n_iter_), "converged": bool(m.converged_),
                       "log_likelihood": float(m.score(Xp) * len(Xp)), "bic": float(m.bic(Xp)),
                       "weights": [round(float(w), 4) for w in m.weights_]}
        # real EM trace: refit with 1..n iterations from the same initialisation
        out["trace"] = [{"iter": it, "ll": float(mk(it).fit(Xp).score(Xp) * len(Xp))} for it in range(1, min(int(m.n_iter_), 40) + 1)]
    out.update({"algo": algo, "time_ms": round(ms, 2)})
    return out


def elbow(d):
    _, _, _, Xp, _ = prep(d)
    seed = int(d.get("params", {}).get("seed", 42))
    ks = list(range(1, min(10, len(Xp) - 1) + 1))
    ine = [float(KMeans(n_clusters=k, n_init=10, random_state=seed).fit(Xp).inertia_) for k in ks]
    x, y = np.array(ks, float), np.array(ine)
    xn, yn = (x - x[0]) / (x[-1] - x[0]), (y - y[-1]) / (y[0] - y[-1])
    return {"ks": ks, "inertia": ine, "suggested": int(ks[int(np.argmax(1 - xn - yn))])}


def compare(d):
    return {a: cluster(a, d) for a in ("kmeans", "gmm")}


def hierarchical(d):
    df, feats, raw, Xp, _ = prep(d)
    p = d.get("params", {})
    k, link, metric = int(p.get("k", 3)), p.get("linkage", "ward"), p.get("metric", "euclidean")
    if link not in ("ward", "complete", "average", "single") or metric not in ("euclidean", "manhattan", "cosine"):
        raise ValueError("Invalid linkage or metric.")
    if link == "ward":
        metric = "euclidean"
    if not 2 <= k <= min(15, len(Xp) - 1):
        raise ValueError("Number of clusters must be between 2 and 15.")
    labels = AgglomerativeClustering(n_clusters=k, linkage=link, metric=metric).fit_predict(Xp)
    out = payload(df, raw, Xp, labels, feats)
    idx = np.random.default_rng(0).choice(len(Xp), min(100, len(Xp)), replace=False)
    Z = linkage(Xp[idx], method=link, metric="cityblock" if metric == "manhattan" else metric)
    dn = dendrogram(Z, no_plot=True, color_threshold=float(Z[-(k - 1), 2]) - 1e-9)
    out["dendrogram"] = {"icoord": dn["icoord"], "dcoord": dn["dcoord"], "colors": dn["color_list"],
                         "sampled": len(idx) < len(Xp), "n": len(idx)}
    out["algo"] = "hierarchical"
    return out


def pca(d):
    df, feats, raw, Xp, _ = prep(d)
    Xs = StandardScaler().fit_transform(raw)
    full = PCA().fit(Xs)
    m = PCA(n_components=2).fit(Xs)
    Z = m.transform(Xs)
    labels = d.get("labels")
    ok = bool(labels) and len(labels) == len(Z)
    ids = (df["CustomerID"] if "CustomerID" in df else pd.Series(range(1, len(df) + 1))).astype(str).tolist()
    ev = full.explained_variance_ratio_
    return {"coords": [{"i": i, "id": ids[i], "x": round(float(Z[i, 0]), 4), "y": round(float(Z[i, 1]), 4),
                        "c": int(labels[i]) if ok else 0} for i in range(len(Z))],
            "explained": ev.round(4).tolist(), "cumulative": np.cumsum(ev).round(4).tolist(),
            "retained": float(ev[:2].sum()), "features": feats, "colored": ok,
            "loadings": [{"feature": f, "pc1": round(float(m.components_[0][j]), 4), "pc2": round(float(m.components_[1][j]), 4)} for j, f in enumerate(feats)]}


def factor(d):
    _, feats, raw, _, _ = prep(d)
    nf = int(d.get("n_factors", 2))
    if not 1 <= nf <= len(feats):
        raise ValueError("Number of factors must be between 1 and the number of selected features.")
    Xs = StandardScaler().fit_transform(raw)
    fa = FactorAnalysis(n_components=nf, random_state=0).fit(Xs)
    return {"features": feats, "n_factors": nf, "loadings": fa.components_.T.round(4).tolist(),
            "noise_variance": fa.noise_variance_.round(4).tolist()}


def evaluate(d):
    _, _, _, Xp, _ = prep(d)
    labels = d.get("labels")
    if not labels or len(labels) != len(Xp):
        raise ValueError("Labels must match the number of customers.")
    return metrics(Xp, [int(x) for x in labels])
