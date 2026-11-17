import { Loader2 } from "lucide-react";
import { useApp } from "../state";
export const Card = ({ title, children, className = "" }) => (
  <section className={"rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4 " + className}>
    {title && <h3 className="mb-3 text-sm font-semibold text-cyan-300">{title}</h3>}{children}</section>);
export const Btn = ({ children, ...p }) => (
  <button {...p} className={"inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-40 " + (p.className || "")}>{children}</button>);
export const Ghost = ({ children, ...p }) => (
  <button {...p} className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm hover:bg-white/10 disabled:opacity-40">{children}</button>);
export const Field = ({ label, children }) => (<label className="block text-xs text-slate-400">{label}<div className="mt-1 text-sm text-slate-100">{children}</div></label>);
const inp = "w-full rounded-lg border border-white/15 bg-slate-900 px-2 py-1.5";
export const Sel = ({ options, ...p }) => (<select {...p} className={inp}>{options.map((o) => <option key={o} value={o}>{o}</option>)}</select>);
export const Num = (p) => <input type="number" {...p} className={inp} />;
export const Spinner = ({ text = "Computing..." }) => (<div className="flex items-center gap-2 text-cyan-300"><Loader2 className="animate-spin" size={18} />{text}</div>);
export const Note = ({ children }) => <p className="text-xs leading-relaxed text-slate-400">{children}</p>;
export const Formula = ({ children }) => <pre className="overflow-x-auto rounded-lg bg-slate-950/70 p-3 font-mono text-sm text-violet-300">{children}</pre>;
export const Kpi = ({ l, v }) => (<Card><div className="text-xs text-slate-400">{l}</div><div className="mt-1 text-2xl font-semibold text-cyan-300">{v}</div></Card>);
export const f2 = (v, d = 3) => (v == null || Number.isNaN(v) ? "—" : Number(v).toLocaleString(undefined, { maximumFractionDigits: d }));

export function FeaturePicker({ cols, value, onChange }) {
  const t = (c) => onChange(value.includes(c) ? value.filter((x) => x !== c) : [...value, c]);
  return (<div className="flex flex-wrap gap-2">{cols.map((c) => (
    <button key={c} onClick={() => t(c)} className={"rounded-full border px-3 py-1 text-xs " + (value.includes(c) ? "border-cyan-400 bg-cyan-400/20 text-cyan-200" : "border-white/15 text-slate-400")}>{c}</button>))}</div>);
}
export function Status() {
  const { busy, error } = useApp();
  return (<>{busy && <Spinner />}{error && <div className="rounded-lg border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}</>);
}
export function Metrics({ m }) {
  if (!m) return null;
  if (!m.valid) return <div className="rounded-lg border border-amber-400/40 bg-amber-500/10 p-3 text-sm text-amber-200">{m.warning}</div>;
  return (<div className="grid grid-cols-3 gap-3 text-center">
    {[["Silhouette ↑", m.silhouette, "−1…1, near 1 = well separated"], ["Davies-Bouldin ↓", m.davies_bouldin, "lower = better separated"], ["Calinski-Harabasz ↑", m.calinski_harabasz, "higher = better defined"]].map(([l, v, h]) => (
      <div key={l} className="rounded-lg bg-slate-900/70 p-3"><div className="text-xs text-slate-400">{l}</div><div className="text-xl text-cyan-300">{f2(v)}</div><div className="text-[10px] text-slate-500">{h}</div></div>))}
    <p className="col-span-3 text-left text-[11px] text-slate-500">Metrics are indicators computed on the model-space data, not proof of quality.</p></div>);
}
export function ClusterTable({ r }) {
  return (<div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs text-slate-400"><tr>
    <th className="p-2">Cluster</th><th>Customers</th>{r.features.map((f) => <th key={f}>Avg {f}</th>)}<th>Segment</th></tr></thead><tbody>
      {r.stats.map((s) => (<tr key={s.cluster} className="border-t border-white/10"><td className="p-2">{s.cluster}</td><td>{s.customers}</td>
        {r.features.map((f) => <td key={f}>{f2(s.means[f], 1)}</td>)}<td className="text-violet-300">{s.description}</td></tr>))}</tbody></table></div>);
}
