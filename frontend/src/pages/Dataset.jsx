import { useMemo, useRef, useState } from "react";
import { Upload, Download, RotateCcw } from "lucide-react";
import { useApp } from "../state";
import { Card, Btn, Ghost, Field, Sel, Spinner, Status, Note } from "../components/ui";
const box = "w-full rounded-lg border border-white/15 bg-slate-900 px-2 py-1.5";
export default function Dataset() {
  const { data, upload, loadSample, setError } = useApp();
  const [q, setQ] = useState(""), [fc, setFc] = useState(""), [fv, setFv] = useState(""), [sort, setSort] = useState(null), [page, setPage] = useState(0);
  const file = useRef();
  const rows = useMemo(() => {
    if (!data) return [];
    let r = data.rows.filter((x) => String(x.CustomerID).toLowerCase().includes(q.toLowerCase()));
    if (fc && fv) r = r.filter((x) => String(x[fc] ?? "").toLowerCase().includes(fv.toLowerCase()));
    if (sort) r = [...r].sort((a, b) => (a[sort.c] > b[sort.c] ? 1 : -1) * sort.d);
    return r;
  }, [data, q, fc, fv, sort]);
  if (!data) return <Spinner text="Loading dataset..." />;
  const { report: rep } = data, P = 20;
  const stat = (c) => { const v = data.rows.map((x) => +x[c]).filter(Number.isFinite); const m = v.reduce((a, b) => a + b, 0) / v.length;
    return [c, v.length, m.toFixed(1), Math.min(...v), Math.max(...v)]; };
  return (<div className="space-y-4"><Status />
    <Card title="Dataset actions"><div className="mb-2 flex flex-wrap gap-2">
      <input ref={file} type="file" accept=".csv" hidden onChange={(e) => { const f = e.target.files[0]; if (f) { if (f.size > 5e6) setError("File is too large (max 5 MB)."); else { upload(f); setPage(0); } } e.target.value = ""; }} />
      <Btn onClick={() => file.current.click()}><Upload size={16} />Upload CSV</Btn>
      <a href="/api/dataset/sample?format=csv"><Ghost><Download size={16} />Download sample</Ghost></a>
      <Ghost onClick={() => { loadSample(); setPage(0); }}><RotateCcw size={16} />Reset to default</Ghost></div>
      <Note>{rep.count} rows · numeric columns: {rep.numeric_columns.join(", ")}. Invalid records are never removed silently.</Note>
      {rep.warnings.map((w) => <div key={w} className="mt-2 rounded-lg border border-amber-400/40 bg-amber-500/10 p-2 text-xs text-amber-200">{w}</div>)}</Card>
    <Card title="Statistics"><table className="w-full text-sm"><thead className="text-xs text-slate-400"><tr><th className="text-left">Column</th><th>Valid</th><th>Mean</th><th>Min</th><th>Max</th></tr></thead>
      <tbody>{rep.numeric_columns.map((c) => <tr key={c} className="border-t border-white/10 text-center">{stat(c).map((v, i) => <td key={i} className={i ? "" : "text-left"}>{v}</td>)}</tr>)}</tbody></table></Card>
    <Card title="Customers"><div className="mb-3 grid gap-2 sm:grid-cols-3">
      <Field label="Search by Customer ID"><input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} className={box} placeholder="C0012" /></Field>
      <Field label="Filter column"><Sel value={fc} onChange={(e) => setFc(e.target.value)} options={["", ...rep.columns]} /></Field>
      <Field label="contains"><input value={fv} onChange={(e) => { setFv(e.target.value); setPage(0); }} className={box} /></Field></div>
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="text-xs text-slate-400"><tr>{rep.columns.map((c) =>
        <th key={c} onClick={() => setSort({ c, d: sort?.c === c ? -sort.d : 1 })} className="cursor-pointer p-2 text-left hover:text-cyan-300">{c}{sort?.c === c ? (sort.d > 0 ? " ▲" : " ▼") : ""}</th>)}</tr></thead>
        <tbody>{rows.slice(page * P, page * P + P).map((r, i) => <tr key={i} className="border-t border-white/10">{rep.columns.map((c) => <td key={c} className="p-2">{r[c] ?? <span className="text-amber-300">missing</span>}</td>)}</tr>)}</tbody></table></div>
      <div className="mt-3 flex items-center gap-3 text-sm"><Ghost disabled={page === 0} onClick={() => setPage(page - 1)}>Prev</Ghost>
        <span>Page {page + 1} / {Math.max(1, Math.ceil(rows.length / P))} ({rows.length} rows)</span><Ghost disabled={(page + 1) * P >= rows.length} onClick={() => setPage(page + 1)}>Next</Ghost></div></Card></div>);
}
