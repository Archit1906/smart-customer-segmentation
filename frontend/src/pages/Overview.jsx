import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useApp } from "../state";
import { Card, Kpi, Spinner, Status, ClusterTable, f2 } from "../components/ui";
import ScatterPlot, { COLORS } from "../charts/ScatterPlot";
export default function Overview() {
  const { data, result: r } = useApp();
  if (!data || !r) return <><Status /><Spinner text="Loading dataset and running K-means..." /></>;
  const avg = (c) => { const v = data.rows.map((x) => +x[c]).filter(Number.isFinite); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
  return (<div className="space-y-4"><Status />
    <p className="text-slate-300">Smart Customer Segmentation uses unsupervised machine learning to identify groups of customers with similar purchasing behavior.</p>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
      <Kpi l="Total Customers" v={data.rows.length} /><Kpi l="Clusters" v={r.stats.length} />
      <Kpi l="Avg Annual Income" v={f2(avg("AnnualIncome"), 0)} /><Kpi l="Avg Spending Score" v={f2(avg("SpendingScore"), 1)} />
      <Kpi l="Silhouette" v={r.metrics.valid ? f2(r.metrics.silhouette) : "n/a"} /><Kpi l="Algorithm" v={r.algo === "kmeans" ? "K-means" : r.algo === "gmm" ? "GMM" : r.algo} /></div>
    <div className="grid gap-4 lg:grid-cols-3">
      <Card title="Customer distribution"><ResponsiveContainer width="100%" height={300}><BarChart data={r.stats.map((s) => ({ name: "C" + s.cluster, n: s.customers, c: s.cluster }))}>
        <XAxis dataKey="name" stroke="#94a3b8" /><YAxis stroke="#94a3b8" /><Tooltip contentStyle={{ background: "#0f172a" }} />
        <Bar dataKey="n" name="Customers">{r.stats.map((s) => <Cell key={s.cluster} fill={COLORS[s.cluster % 10]} />)}</Bar></BarChart></ResponsiveContainer></Card>
      <Card title={`${r.xName} vs ${r.yName}`} className="lg:col-span-2"><ScatterPlot points={r.points} centers={r.centers} xName={r.xName} yName={r.yName} height={300} /></Card></div>
    <Card title="Cluster summary"><ClusterTable r={r} /></Card></div>);
}
