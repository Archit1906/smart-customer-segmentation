import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { api } from "./services/api";
const Ctx = createContext();
export const useApp = () => useContext(Ctx);
const DEF = ["AnnualIncome", "SpendingScore"];

export function AppProvider({ children }) {
  const [data, setData] = useState(null);
  const [features, setFeatures] = useState(DEF);
  const [result, setResult] = useState(null);
  const [opts, setOpts] = useState({ scale: true, impute: "median" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const guard = useCallback(async (fn) => {
    setBusy(true); setError("");
    try { return await fn(); } catch (e) { setError(e.message); } finally { setBusy(false); }
  }, []);
  const req = (rows, feats, o = opts) => ({ rows, features: feats, scale: o.scale, impute: o.impute });
  const run = (algo, params, feats = features) =>
    guard(async () => { const r = await api.cluster(algo, { ...req(data.rows, feats), params }); setResult(r); return r; });
  const apply = (d) => {
    if (!d || !Array.isArray(d.rows) || !Array.isArray(d.report?.numeric_columns)) {
      throw new Error("The backend returned an incompatible dataset. Make sure this project's Flask server is running on port 5001.");
    }
    const nc = d.report.numeric_columns;
    const f = DEF.every((c) => nc.includes(c)) ? DEF : nc.slice(0, 2);
    setData(d); setFeatures(f); return f;
  };
  const loadSample = () => guard(async () => {
    const d = await api.sample(); const f = apply(d);
    setResult(await api.cluster("kmeans", { ...req(d.rows, f), params: { k: 5 } }));
  });
  const upload = (file) => guard(async () => {
    const d = await api.upload(file); const f = apply(d);
    setResult(await api.cluster("kmeans", { ...req(d.rows, f), params: { k: 3 } }).catch((e) => { setError(e.message); return null; }));
  });
  useEffect(() => { loadSample(); }, []);
  return <Ctx.Provider value={{ data, features, setFeatures, result, setResult, opts, setOpts, busy, error, setError, guard, run, loadSample, upload, req }}>{children}</Ctx.Provider>;
}
