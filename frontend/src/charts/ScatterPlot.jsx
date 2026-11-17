import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
export const COLORS = ["#22d3ee", "#a78bfa", "#f472b6", "#fbbf24", "#34d399", "#60a5fa", "#fb923c", "#e879f9", "#a3e635", "#f87171"];
const Tip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (<div className="rounded-lg border border-white/20 bg-slate-900 p-2 text-xs">
    <div className="font-semibold">{p.id ?? "Centroid"}</div><div>x: {p.x}</div><div>y: {p.y}</div><div>Cluster {p.c ?? p.cluster}</div>
    {p.conf != null && <div>Confidence: {(p.conf * 100).toFixed(1)}%</div>}</div>);
};
export default function ScatterPlot({ points, centers = [], xName, yName, height = 340 }) {
  const cl = [...new Set(points.map((p) => p.c))].sort((a, b) => a - b);
  const ax = { stroke: "#94a3b8", tick: { fontSize: 11 }, type: "number", domain: ["auto", "auto"] };
  return (<ResponsiveContainer width="100%" height={height}><ScatterChart margin={{ top: 8, right: 12, bottom: 24, left: 0 }}>
    <CartesianGrid stroke="#1e293b" /><XAxis {...ax} dataKey="x" name={xName} label={{ value: xName, position: "bottom", fill: "#94a3b8", fontSize: 11 }} />
    <YAxis {...ax} dataKey="y" name={yName} label={{ value: yName, angle: -90, position: "insideLeft", fill: "#94a3b8", fontSize: 11 }} />
    <ZAxis dataKey="z" domain={[0, 10]} range={[40, 320]} /><Tooltip content={<Tip />} /><Legend verticalAlign="top" />
    {cl.map((c) => <Scatter key={c} name={"Cluster " + c} isAnimationActive={false} fill={COLORS[c % 10]} fillOpacity={0.75}
      data={points.filter((p) => p.c === c).map((p) => ({ ...p, z: 2 }))} />)}
    {centers.length > 0 && <Scatter name="Centroids" shape="star" fill="#fff" stroke="#000" isAnimationActive={false} data={centers.map((c) => ({ ...c, z: 10 }))} />}
  </ScatterChart></ResponsiveContainer>);
}
