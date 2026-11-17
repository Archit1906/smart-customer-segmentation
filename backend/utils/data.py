import io
import numpy as np
import pandas as pd

# (name, size, income in $k (mean, sd), spending score (mean, sd)) -- used ONLY to generate data
GROUPS = [("hi-hi", 60, (88, 12), (80, 9)), ("hi-lo", 50, (85, 13), (20, 9)),
          ("lo-hi", 50, (26, 9), (78, 10)), ("lo-lo", 50, (24, 9), (22, 9)),
          ("mid", 90, (55, 10), (50, 10))]


def sample_dataset(seed=42):
    rng = np.random.default_rng(seed)
    parts = []
    for _, n, (im, isd), (sm, ssd) in GROUPS:
        inc = np.clip(rng.normal(im, isd, n), 10, 140) * 1000
        sp = np.clip(rng.normal(sm, ssd, n), 1, 100)
        freq = np.clip(np.round(sp / 6 + rng.normal(3, 2.5, n)), 1, 40)
        aov = np.clip(20 + inc / 1000 * 0.9 + sp * 0.4 + rng.normal(0, 12, n), 10, None)
        age = np.clip(np.round(rng.normal(38, 12, n)), 18, 70)
        parts.append(pd.DataFrame({"Age": age.astype(int), "Gender": rng.choice(["Male", "Female"], n),
                                   "AnnualIncome": inc.round(0).astype(int), "SpendingScore": sp.round(0).astype(int),
                                   "PurchaseFrequency": freq.astype(int), "AverageOrderValue": aov.round(2)}))
    df = pd.concat(parts).sample(frac=1, random_state=seed).reset_index(drop=True)  # group labels are NOT kept
    df.insert(0, "CustomerID", [f"C{i + 1:04d}" for i in range(len(df))])
    return df


def analyze(df):
    """Validate a dataframe without dropping anything; return rows + a validation report."""
    if len(df) < 5:
        raise ValueError("The file needs at least 5 customer rows.")
    id_col = next((c for c in df.columns if str(c).lower().replace("_", "") == "customerid"), None)
    warnings = []
    if id_col is None:
        df.insert(0, "CustomerID", [f"C{i + 1:04d}" for i in range(len(df))])
        id_col = "CustomerID"
        warnings.append("No CustomerID column found; IDs were generated.")
    numeric, invalid = [], {}
    for c in df.columns:
        if c == id_col:
            continue
        conv = pd.to_numeric(df[c], errors="coerce")
        nn = int(df[c].notna().sum())
        if nn and conv.notna().sum() >= 0.5 * nn:
            numeric.append(c)
            bad = int((conv.isna() & df[c].notna()).sum())
            if bad:
                invalid[c] = bad
    if len(numeric) < 2:
        raise ValueError("Required numerical columns are missing: at least 2 numeric columns are needed.")
    missing = {c: int(df[c].isna().sum()) for c in df.columns if df[c].isna().any()}
    dup = df[id_col][df[id_col].duplicated()].astype(str).unique().tolist()
    if missing: warnings.append("Missing values found: " + ", ".join(f"{k} ({v})" for k, v in missing.items()) + ". Choose mean/median imputation in the Clustering Lab.")
    if invalid: warnings.append("Invalid (non-numeric) values in numeric columns: " + ", ".join(f"{k} ({v})" for k, v in invalid.items()) + ". They are treated as missing.")
    if dup: warnings.append(f"Duplicate customer IDs: {', '.join(dup[:10])}{'...' if len(dup) > 10 else ''}.")
    rows = df.astype(object).where(df.notna(), None).to_dict("records")
    return {"rows": rows, "report": {"count": len(df), "columns": list(df.columns), "numeric_columns": numeric,
                                      "missing": missing, "invalid": invalid, "duplicate_ids": dup, "warnings": warnings}}


def parse_csv(raw: bytes):
    try:
        df = pd.read_csv(io.BytesIO(raw))
    except Exception:
        raise ValueError("Could not read the file as CSV.")
    if df.empty:
        raise ValueError("The CSV file is empty.")
    return analyze(df)
