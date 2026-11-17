import { useState } from "react";
import { Play } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Cell } from "recharts";
import { useApp } from "../state";
import { api } from "../services/api";
import { Card, Btn, Ghost, Field, Sel, Num, Note, Formula, Status, FeaturePicker, Metrics, ClusterTable, f2 } from "../components/ui";
import ScatterPlot, { COLORS } from "../charts/ScatterPlot";
export default function Lab() {
  const { data, features, setFeatures, opts, setOpts, result: r, run, guard, req } = useApp();
  const [algo, setAlgo] = useState("kmeans");
  const [p, setP] = useState({ k: 5, init: "k-means++", max_iter: 300, seed: 42, covariance: "full", tol: 0.001 });
  const [elbow, setElbow] = useState(null), [sel, setSel] = useState(0);
  if (!data) return <Status />;
  const set = (k, conv = Number) => (e) => setP({ ...p, [k]: conv(e.target.value) });
  const go = () => run(algo, p);
  const showing = r && r.algo === algo ? r : null;
  return (<div className="space-y-4"><Status />
    <Card title="Experiment setup">
      <div className="mb-3 flex gap-2">{[["kmeans", "K-means"], ["gmm", "Gaussian Mixture (EM)"]].map(([a, l]) =>
        <Ghost key={a} onClick={() => setAlgo(a)} style={algo === a ? { borderColor: "#22d3ee", color: "#67e8f9" } : {}}>{l}</Ghost>)}</div>
      <Field label="Features (select 2 or more; the first two are plotted)"><FeaturePicker cols={data.report.numeric_columns} value={features} onChange={setFeatures} /></Field>
      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-6">
        <Field label={algo === "kmeans" ? "Clusters K" : "Components"}><Num min={1} max={15} value={p.k} onChange={set("k")} /></Field>
        {algo === "kmeans" ? <Field label="Initialization"><Sel value={p.init} onChange={set("init", String)} options={["k-means++", "random"]} /></Field>
          : <Field label="Covariance"><Sel value={p.covariance} onChange={set("covariance", String)} options={["full", "tied", "diag", "spherical"]} /></Field>}
        <Field label="Max iterations"><Num min={1} value={p.max_iter} onChange={set("max_iter")} /></Field>
        {algo === "gmm" && <Field label="Tolerance"><Num step="0.0001" value={p.tol} onChange={set("tol")} /></Field>}
        <Field label="Random seed"><Num value={p.seed} onChange={set("seed")} /></Field>
        <Field label="Standardize (StandardScaler)"><Sel value={opts.scale ? "on" : "off"} onChange={(e) => setOpts({ ...opts, scale: e.target.value === "on" })} options={["on", "off"]} /></Field>
        <Field label="Missing values"><Sel value={opts.impute} onChange={(e) => setOpts({ ...opts, impute: e.target.value })} options={["median", "mean", "none"]} /></Field></div>
      <Note>Why scale? Annual income is in thousands while spending score is 1–100. Standardization stops the larger-range feature from dominating the distance calculation.</Note>
      <div className="mt-3 flex gap-2"><Btn onClick={go}><Play size={16} />Run Clustering</Btn>
        {algo === "kmeans" && <Ghost onClick={() => guard(async () => setElbow(await api.elbow({ ...req(data.rows, features), params: p })))}>Elbow method (K=1–10)</Ghost>}</div></Card>

    {elbow && algo === "kmeans" && <Card title="Elbow method"><ResponsiveContainer width="100%" height={240}><LineChart data={elbow.ks.map((k, i) => ({ k, inertia: elbow.inertia[i] }))}>
      <CartesianGrid stroke="#1e293b" /><XAxis dataKey="k" stroke="#94a3b8" /><YAxis stroke="#94a3b8" /><Tooltip contentStyle={{ background: "#0f172a" }} />
      <Line dataKey="inertia" stroke="#22d3ee" strokeWidth={2} /></LineChart></ResponsiveContainer>
      <div className="mt-2 flex items-center gap-3"><span className="text-sm">Suggested K = {elbow.suggested}</span><Ghost onClick={() => setP({ ...p, k: elbow.suggested })}>Use K={elbow.suggested}</Ghost></div>
      <Note>The elbow is a heuristic (largest bend of the inertia curve), not a guaranteed optimum.</Note></Card>}

    {showing && <>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Clusters (★ = centroid / component mean)" className="lg:col-span-2"><ScatterPlot points={showing.points} centers={showing.centers} xName={showing.xName} yName={showing.yName} /></Card>
        <Card title="Run details"><ul className="space-y-1 text-sm">
          {algo === "kmeans" ? <><li>K: {showing.info.k}</li><li>Iterations: {showing.info.iterations}</li><li>Inertia: {f2(showing.info.inertia)}</li></>
            : <><li>Components: {showing.info.components}</li><li>Iterations: {showing.info.iterations}</li><li>Converged: {showing.info.converged ? "yes" : "no"}</li>
              <li>Log-likelihood: {f2(showing.info.log_likelihood)}</li><li>BIC: {f2(showing.info.bic)}</li><li>Mixing weights π: {showing.info.weights.join(", ")}</li></>}
          <li>Cluster sizes: {showing.stats.map((s) => s.customers).join(", ")}</li><li>Time: {showing.time_ms} ms</li></ul>
          <div className="mt-3"><Formula>{algo === "kmeans" ? "J = Σᵢ ||xᵢ − μ_cᵢ||²" : "L(θ) = Σᵢ log Σₖ πₖ N(xᵢ | μₖ, Σₖ)"}</Formula></div>
          <Note>{algo === "kmeans" ? "K-means: initialize K centroids → assign each customer to the nearest centroid → recompute centroids → repeat until convergence. It minimizes the within-cluster sum of squared distances."
            : "EM: E-step computes each customer's probability (responsibility) for every component; M-step updates π, μ and Σ; repeat until the log-likelihood stops improving. πₖ = mixing coefficient, μₖ = mean, Σₖ = covariance, N = Gaussian density."}</Note></Card></div>
      <Card title="Evaluation"><Metrics m={showing.metrics} /></Card>
      <Card title="Cluster summary"><ClusterTable r={showing} /></Card>
      {algo === "gmm" && <div className="grid gap-4 lg:grid-cols-2">
        <Card title="EM convergence (log-likelihood per iteration)"><ResponsiveContainer width="100%" height={240}><LineChart data={showing.trace}>
          <CartesianGrid stroke="#1e293b" /><XAxis dataKey="iter" stroke="#94a3b8" /><YAxis stroke="#94a3b8" domain={["auto", "auto"]} /><Tooltip contentStyle={{ background: "#0f172a" }} />
          <Line dataKey="ll" stroke="#a78bfa" strokeWidth={2} dot /></LineChart></ResponsiveContainer>
          <Note>Each point is a real refit stopped after that many EM iterations from the same initialization.</Note></Card>
        <Card title="Membership probabilities for one customer">
          <Field label="Customer"><Sel value={showing.points[sel].id} onChange={(e) => setSel(showing.points.findIndex((x) => x.id === e.target.value))} options={showing.points.map((x) => x.id)} /></Field>
          <ResponsiveContainer width="100%" height={200}><BarChart data={showing.proba[sel].map((v, i) => ({ name: "C" + i, p: +(v * 100).toFixed(2) }))}>
            <XAxis dataKey="name" stroke="#94a3b8" /><YAxis stroke="#94a3b8" unit="%" domain={[0, 100]} /><Tooltip contentStyle={{ background: "#0f172a" }} />
            <Bar dataKey="p" name="Probability %">{showing.proba[sel].map((_, i) => <Cell key={i} fill={COLORS[i % 10]} />)}</Bar></BarChart></ResponsiveContainer>
          <Note>Hard label: cluster {showing.points[sel].c} · confidence {(showing.points[sel].conf * 100).toFixed(1)}%. Unlike K-means, GMM gives soft memberships.</Note></Card></div>}
    </>}
    {!showing && <Note>Press “Run Clustering” to run {algo === "kmeans" ? "K-means" : "the Gaussian Mixture Model"} on the selected features.</Note>}</div>);
}
