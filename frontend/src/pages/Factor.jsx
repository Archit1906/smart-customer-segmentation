import { useState } from "react";
import { useApp } from "../state";
import { api } from "../services/api";
import { Card, Btn, Field, Num, Status, FeaturePicker, Note } from "../components/ui";
export default function Factor() {
  const { data, features, setFeatures, guard, req } = useApp();
  const [n, setN] = useState(2), [res, setRes] = useState(null);
  if (!data) return <Status />;
  const go = () => guard(async () => setRes(await api.factor({ ...req(data.rows, features), n_factors: n })));
  const cell = (v) => ({ background: v >= 0 ? `rgba(34,211,238,${Math.min(Math.abs(v), 1) * 0.8})` : `rgba(167,139,250,${Math.min(Math.abs(v), 1) * 0.8})` });
  return (<div className="space-y-4"><Status />
    <Card title="Factor analysis"><Field label="Features (need 2+)"><FeaturePicker cols={data.report.numeric_columns} value={features} onChange={setFeatures} /></Field>
      <div className="mt-3 flex items-end gap-3"><Field label="Number of factors"><Num min={1} max={features.length} value={n} onChange={(e) => setN(+e.target.value)} /></Field><Btn onClick={go}>Run</Btn></div>
      <Note>Factor analysis models the observed variables as combinations of hidden (latent) factors plus noise. PCA instead finds directions of maximum total variance and has no noise model.</Note></Card>
    {res && <><Card title="Loading heatmap"><table className="w-full text-center text-sm"><thead className="text-xs text-slate-400"><tr><th className="p-2 text-left">Feature</th>
      {Array.from({ length: res.n_factors }, (_, j) => <th key={j}>Factor {j + 1}</th>)}<th>Noise var.</th></tr></thead><tbody>{res.features.map((f, i) =>
        <tr key={f} className="border-t border-white/10"><td className="p-2 text-left">{f}</td>{res.loadings[i].map((v, j) => <td key={j} style={cell(v)}>{v.toFixed(2)}</td>)}<td>{res.noise_variance[i]}</td></tr>)}</tbody></table></Card>
      <Card title="Reading the loadings (computed, |loading| ≥ 0.5)"><ul className="list-disc space-y-1 pl-5 text-sm">{Array.from({ length: res.n_factors }, (_, j) => {
        const hi = res.features.filter((_, i) => Math.abs(res.loadings[i][j]) >= 0.5);
        return <li key={j}>Factor {j + 1}: {hi.length ? "driven by " + hi.join(", ") : "no feature has a strong loading"}.</li>; })}</ul>
        <Note>Naming a factor (e.g. “purchasing behavior”) is your interpretation of these loadings, not something the algorithm provides.</Note></Card></>}</div>);
}
