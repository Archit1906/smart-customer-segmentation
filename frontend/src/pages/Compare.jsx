import { useState } from "react";
import { GitCompare } from "lucide-react";
import { useApp } from "../state";
import { api } from "../services/api";
import { Card, Btn, Field, Num, Status, FeaturePicker, f2, Note } from "../components/ui";
import ScatterPlot from "../charts/ScatterPlot";
export default function Compare() {
  const { data, features, setFeatures, req, guard } = useApp();
  const [k, setK] = useState(5), [seed, setSeed] = useState(42), [res, setRes] = useState(null);
  if (!data) return <Status />;
  const go = () => guard(async () => setRes(await api.compare({ ...req(data.rows, features), params: { k, seed } })));
  const row = (l, fn) => <tr className="border-t border-white/10"><td className="p-2">{l}</td><td>{fn(res.kmeans)}</td><td>{fn(res.gmm)}</td></tr>;
  const m = (key) => (x) => (x.metrics.valid ? f2(x.metrics[key]) : "n/a");
  return (<div className="space-y-4"><Status />
    <Card title="Compare K-means and GMM on the same data"><Field label="Features"><FeaturePicker cols={data.report.numeric_columns} value={features} onChange={setFeatures} /></Field>
      <div className="mt-3 flex items-end gap-3"><Field label="Clusters / components"><Num min={1} max={15} value={k} onChange={(e) => setK(+e.target.value)} /></Field>
        <Field label="Seed"><Num value={seed} onChange={(e) => setSeed(+e.target.value)} /></Field><Btn onClick={go}><GitCompare size={16} />Run both</Btn></div></Card>
    {res && <><Card title="Metrics"><table className="w-full text-sm"><thead className="text-left text-xs text-slate-400"><tr><th className="p-2">Metric</th><th>K-means</th><th>GMM</th></tr></thead><tbody>
      {row("Silhouette ↑", m("silhouette"))}{row("Davies-Bouldin ↓", m("davies_bouldin"))}{row("Calinski-Harabasz ↑", m("calinski_harabasz"))}
      {row("Number of clusters", (x) => x.stats.length)}{row("Execution time", (x) => x.time_ms + " ms")}</tbody></table></Card>
      <div className="grid gap-4 lg:grid-cols-2">{[["K-means", res.kmeans], ["Gaussian Mixture", res.gmm]].map(([t, x]) =>
        <Card key={t} title={t}><ScatterPlot points={x.points} centers={x.centers} xName={x.xName} yName={x.yName} height={300} /></Card>)}</div>
      <Card title="Interpretation"><ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
        <li>K-means assigns each customer to the nearest centroid by distance (hard assignment).</li>
        <li>GMM models each cluster as a Gaussian and gives probabilistic (soft) membership.</li>
        <li>GMM can represent elliptical clusters with different covariance structures; K-means favors similar-sized, round clusters.</li>
        <li>Both need the number of clusters in advance, depend on initialization, and are sensitive to scaling and outliers.</li>
        <li>Neither is always better: compare metrics together with how interpretable the segments are.</li></ul></Card></>}</div>);
}
