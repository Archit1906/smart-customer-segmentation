async function call(path, body) {
  let r;
  try {
    r = await fetch("/api" + path, body instanceof FormData ? { method: "POST", body }
      : body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {});
  } catch { throw new Error("Cannot reach the backend. Is this project's Flask server running on port 5001?"); }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "Request failed (" + r.status + ")");
  return j;
}
export const api = {
  sample: () => call("/dataset/sample"),
  upload: (file) => { const f = new FormData(); f.append("file", file); return call("/dataset/upload", f); },
  cluster: (algo, b) => call("/clustering/" + algo, b),
  compare: (b) => call("/clustering/compare", b),
  elbow: (b) => call("/clustering/elbow", b),
  hier: (b) => call("/clustering/hierarchical", b),
  pca: (b) => call("/dimensionality/pca", b),
  factor: (b) => call("/dimensionality/factor-analysis", b),
};
