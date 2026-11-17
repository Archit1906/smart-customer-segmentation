import { useState } from "react";
import { useApp } from "../state";
import { api } from "../services/api";
import { Card, Btn, Field, Sel, Num, Status, FeaturePicker, Metrics, Note } from "../components/ui";
import ScatterPlot, { COLORS } from "../charts/ScatterPlot";
export default function Hier() {
  const { data, features, setFeatures, guard, req } = useApp();
  const [p, setP] = useState({ k: 5, linkage: "ward", metric: "euclidean" }), [res, setRes] = useState(null);
  if (!data) return <Status />;
  const go = () => guard(async () => setRes(await api.hier({ ...req(data.rows, features), params: p })));
  const dn = res?.dendrogram;
  const W = 900, H = 320, maxX = dn ? Math.max(...dn.icoord.flat()) : 1, maxY = dn ? Math.max(...dn.dcoord.flat()) : 1;
  const col = (c) => (/^C\d$/.test(c) ? COLORS[+c[1]] : "#64748b");
  return (<div className="space-y-4"><Status />
    <Card title="Agglomerative clustering"><Field label="Features"><FeaturePicker cols={data.report.numeric_columns} value={features} onChange={setFeatures} /></Field>
      <div className="mt-3 flex flex-wrap items-end gap-3"><Field label="Clusters"><Num min={2} max={15} value={p.k} onChange={(e) => setP({ ...p, k: +e.target.value })} /></Field>
        <Field label="Linkage"><Sel value={p.linkage} onChange={(e) => setP({ ...p, linkage: e.target.value })} options={["ward", "complete", "average", "single"]} /></Field>
        <Field label="Metric (Ward = euclidean)"><Sel value={p.metric} onChange={(e) => setP({ ...p, metric: e.target.value })} options={["euclidean", "manhattan", "cosine"]} /></Field><Btn onClick={go}>Run</Btn></div></Card>
    {res && <><Card title="Dendrogram"><div className="overflow-x-auto"><svg viewBox={`0 0 ${W} ${H}`} className="min-w-[640px] w-full">{dn.icoord.map((xs, i) =>
      <polyline key={i} fill="none" stroke={col(dn.colors[i])} strokeWidth="1.3" points={xs.map((x, j) => `${10 + (x / maxX) * (W - 20)},${H - 10 - (dn.dcoord[i][j] / maxY) * (H - 20)}`).join(" ")} />)}</svg></div>
      <Note>{dn.sampled ? `The dendrogram uses a random sample of ${dn.n} customers for readability.` : "All customers are shown."} Height = merge distance; colors show the branches that form the chosen number of clusters.</Note></Card>
      <div className="grid gap-4 lg:grid-cols-2"><Card title="Cluster labels"><ScatterPlot points={res.points} xName={res.xName} yName={res.yName} /></Card><Card title="Evaluation"><Metrics m={res.metrics} /></Card></div></>}</div>);
}
