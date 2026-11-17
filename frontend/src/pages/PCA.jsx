import { useState, useEffect } from "react";
import { useApp } from "../state";
import { api } from "../services/api";
import { Card, Btn, Field, Sel, Status, FeaturePicker, Formula, Note, f2 } from "../components/ui";
import ScatterPlot from "../charts/ScatterPlot";
export default function PCAPage() {
  const { data, result, guard, req } = useApp();
  const [feats, setFeats] = useState([]), [color, setColor] = useState(true), [res, setRes] = useState(null);
  useEffect(() => { if (data && !feats.length) setFeats(data.report.numeric_columns); }, [data]);
  if (!data) return <Status />;
  const go = () => guard(async () => setRes(await api.pca({ ...req(data.rows, feats), scale: true, labels: color && result ? result.labels : null })));
  return (<div className="space-y-4"><Status />
    <Card title="PCA setup"><Field label="Features"><FeaturePicker cols={data.report.numeric_columns} value={feats} onChange={setFeats} /></Field>
      <div className="mt-3 flex items-end gap-3"><Field label="Color by current clustering"><Sel value={color ? "yes" : "no"} onChange={(e) => setColor(e.target.value === "yes")} options={["yes", "no"]} /></Field><Btn onClick={go}>Run PCA</Btn></div>
      <Formula>Z = XW</Formula><Note>X = standardized data, W = loading matrix (principal directions), Z = transformed 2-D data. PCA reduces dimensions for visualization; it does not assign cluster labels.</Note></Card>
    {res && <><div className="grid gap-4 lg:grid-cols-3"><Card title="2-D projection" className="lg:col-span-2"><ScatterPlot points={res.coords} xName="PC1" yName="PC2" /></Card>
      <Card title="Variance"><table className="w-full text-sm"><thead className="text-xs text-slate-400"><tr><th className="text-left">PC</th><th>Explained</th><th>Cumulative</th></tr></thead><tbody>
        {res.explained.map((v, i) => <tr key={i} className="border-t border-white/10 text-center"><td className="text-left">PC{i + 1}</td><td>{f2(v * 100, 1)}%</td><td>{f2(res.cumulative[i] * 100, 1)}%</td></tr>)}</tbody></table>
        <p className="mt-2 text-sm text-cyan-300">Retained by 2 components: {f2(res.retained * 100, 1)}%</p>
        <table className="mt-3 w-full text-sm"><thead className="text-xs text-slate-400"><tr><th className="text-left">Feature</th><th>PC1</th><th>PC2</th></tr></thead><tbody>
          {res.loadings.map((l) => <tr key={l.feature} className="border-t border-white/10 text-center"><td className="text-left">{l.feature}</td><td>{l.pc1}</td><td>{l.pc2}</td></tr>)}</tbody></table></Card></div>
      <Card title="Original values vs PCA coordinates (first 10 customers)"><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="text-xs text-slate-400"><tr><th className="text-left">ID</th>
        {res.features.map((f) => <th key={f}>{f}</th>)}<th>PC1</th><th>PC2</th></tr></thead><tbody>{res.coords.slice(0, 10).map((c) =>
          <tr key={c.id} className="border-t border-white/10 text-center"><td className="text-left">{c.id}</td>{res.features.map((f) => <td key={f}>{data.rows[c.i][f]}</td>)}<td>{c.x}</td><td>{c.y}</td></tr>)}</tbody></table></div></Card></>}</div>);
}
