import { useState } from "react";
import { BrowserRouter, NavLink, Route, Routes, Navigate } from "react-router-dom";
import { LayoutDashboard, Table, FlaskConical, GitCompare, Orbit, Network, Layers, BookOpen, Menu, RotateCcw, Database, Cpu } from "lucide-react";
import { AppProvider, useApp } from "./state";
import Overview from "./pages/Overview"; import Dataset from "./pages/Dataset"; import Lab from "./pages/Lab"; import Compare from "./pages/Compare";
import PCAPage from "./pages/PCA"; import Hier from "./pages/Hier"; import Factor from "./pages/Factor"; import Learn from "./pages/Learn";
const NAV = [["/", "Overview", LayoutDashboard], ["/dataset", "Customer Dataset", Table], ["/lab", "Clustering Lab", FlaskConical], ["/compare", "Algorithm Comparison", GitCompare],
  ["/pca", "PCA Visualization", Orbit], ["/hierarchical", "Hierarchical Clustering", Network], ["/factor", "Factor Analysis", Layers], ["/learn", "Learn & Explore", BookOpen]];
function Shell() {
  const [open, setOpen] = useState(true), [mob, setMob] = useState(false);
  const { data, result, loadSample } = useApp();
  return (<div className="flex min-h-screen">
    <aside className={`fixed z-30 h-full border-r border-white/10 bg-[#0a1020] p-3 transition-all md:static ${open ? "w-60" : "w-16"} ${mob ? "" : "max-md:-translate-x-full"}`}>
      <div className="mb-6 flex items-center gap-2 px-2 text-cyan-300"><Cpu />{open && <span className="font-semibold">SegmentAI</span>}</div>
      {NAV.map(([to, label, Icon]) => (<NavLink key={to} to={to} end={to === "/"} onClick={() => setMob(false)} className={({ isActive }) => `mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${isActive ? "bg-cyan-400/15 text-cyan-200" : "text-slate-400 hover:bg-white/5"}`}><Icon size={18} />{open && label}</NavLink>))}</aside>
    <div className="flex min-w-0 flex-1 flex-col">
      <header className="flex flex-wrap items-center gap-3 border-b border-white/10 bg-[#0a1020]/80 px-4 py-3 backdrop-blur">
        <button onClick={() => (window.innerWidth < 768 ? setMob(!mob) : setOpen(!open))} aria-label="Toggle sidebar"><Menu size={20} /></button>
        <h1 className="font-semibold">Smart Customer Segmentation <span className="hidden text-slate-500 sm:inline">· ML Playground</span></h1>
        <div className="ml-auto flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1"><Database size={14} />{data ? `${data.rows.length} customers` : "loading..."}</span>
          <span className="flex items-center gap-1"><Cpu size={14} />{result ? (result.algo === "kmeans" ? "K-means" : result.algo === "gmm" ? "GMM" : result.algo) : "no model"}</span>
          <button onClick={loadSample} className="flex items-center gap-1 rounded-lg border border-white/15 px-2 py-1 hover:bg-white/10"><RotateCcw size={14} />Reset</button></div></header>
      <main className="p-4 md:p-6"><Routes><Route path="/" element={<Overview />} /><Route path="/dataset" element={<Dataset />} /><Route path="/lab" element={<Lab />} /><Route path="/compare" element={<Compare />} />
        <Route path="/pca" element={<PCAPage />} /><Route path="/hierarchical" element={<Hier />} /><Route path="/factor" element={<Factor />} /><Route path="/learn" element={<Learn />} /><Route path="*" element={<Navigate to="/" />} /></Routes></main></div></div>);
}
export default function App() { return <BrowserRouter><AppProvider><Shell /></AppProvider></BrowserRouter>; }
