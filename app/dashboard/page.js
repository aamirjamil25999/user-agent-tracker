"use client";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [report, setReport] = useState(null);
  const [weekly, setWeekly] = useState(null);
  const [agents, setAgents] = useState(null);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Active");
  const [inactiveSeconds, setInactiveSeconds] = useState(0);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  /* ✅ Visit Tracking */
  const recordVisit = async (siteName = "Dashboard Page") => {
    if (!token) return;
    try {
      await fetch("/api/visits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
          site: siteName,
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
        }),
      });
      console.log("✅ Visit recorded:", siteName);
    } catch (err) {
      console.error("❌ Visit record failed:", err);
    }
  };

  useEffect(() => { recordVisit("Dashboard Page"); }, []);
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        recordVisit("Returned to Dashboard");
        loadAllData();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [token]);
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => recordVisit("Active Dashboard Session"), 120000);
    return () => clearInterval(interval);
  }, [token]);

  /* ✅ Auto Logout + Inactivity */
  useEffect(() => {
    if (!token) return;
    let inactivityTimer, logoutTimer, counterInterval;
    const handleActivity = () => {
      setStatus("Active"); setInactiveSeconds(0);
      clearTimeout(inactivityTimer); clearTimeout(logoutTimer); clearInterval(counterInterval);
      inactivityTimer = setTimeout(() => { setStatus("Inactive"); startCounter(); }, 10000);
      logoutTimer = setTimeout(() => { handleLogout(); }, 5 * 60 * 1000);
    };
    const startCounter = () => {
      let sec = 0;
      counterInterval = setInterval(() => { sec++; setInactiveSeconds(sec); }, 1000);
    };
    const handleLogout = async () => {
      try { await fetch("/api/logout", { method: "POST", headers: { Authorization: "Bearer " + token } }); }
      catch (e) { console.error("Auto logout failed:", e); }
      clearInterval(counterInterval);
      localStorage.removeItem("token"); setStatus("Offline"); window.location.href = "/login";
    };
    ["mousemove","keydown","click","scroll"].forEach(ev => window.addEventListener(ev, handleActivity));
    handleActivity();
    return () => {
      clearTimeout(inactivityTimer); clearTimeout(logoutTimer); clearInterval(counterInterval);
      ["mousemove","keydown","click","scroll"].forEach(ev => window.removeEventListener(ev, handleActivity));
    };
  }, [token]);

  /* ✅ Fetch Reports Every 10s */
  useEffect(() => {
    if (!token) return;
    loadAllData();
    const interval = setInterval(() => loadAllData(), 10000);
    return () => clearInterval(interval);
  }, [token, days]);

  const safeJson = async (res) => { try { return await res.json(); } catch { return {}; } };
  const loadAllData = async () => { setLoading(true); await Promise.all([loadToday(), loadWeekly(days), loadAgents()]); setLoading(false); };
  const loadToday = async () => {
    const res = await fetch("/api/reports", { headers: { Authorization: "Bearer " + token } });
    const j = await safeJson(res); if (res.ok) setReport(j);
  };
  const loadWeekly = async (n) => {
    const end = new Date().toISOString().slice(0, 10);
    const start = new Date(Date.now() - (n - 1) * 86400000).toISOString().slice(0, 10);
    const res = await fetch(`/api/reports/weekly?start=${start}&end=${end}`, { headers: { Authorization: "Bearer " + token } });
    const j = await safeJson(res); if (res.ok) setWeekly(j);
  };
  const loadAgents = async () => {
    const d = new Date().toISOString().slice(0, 10);
    const res = await fetch(`/api/reports/agents?date=${d}`, { headers: { Authorization: "Bearer " + token } });
    const j = await safeJson(res); if (res.ok) setAgents(j);
  };

  const today = report?.report;
  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2,"0")}:${String(s % 60).padStart(2,"0")}`;

  const downloadJSON = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = `today-report-${report?.report?.date || "today"}.json`;
    a.click(); URL.revokeObjectURL(url);
  };
  const downloadCSV = () => {
    if (!report?.report) return;
    const r = report.report;
    const headers = ["Date","Sessions","Visits","Total Working Hours","Total Inactivity Hours","Total Active Hours"];
    const row = [r.date,r.sessionsCount,r.visitsCount,r.totalWorkingHours,r.totalInactivityHours,r.totalActiveHours];
    const csv = headers.join(",") + "\n" + row.join(",");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = `today-report-${r.date || "today"}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  /* ✅ UI */
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-cyan-50">
      <div className="relative z-10 p-6 md:p-8 max-w-7xl mx-auto">
        <Header status={status} inactiveSeconds={inactiveSeconds} formatTime={formatTime}
          loading={loading} days={days} setDays={setDays}
          downloadJSON={downloadJSON} downloadCSV={downloadCSV} />
        <Overview today={today} />
        <Weekly weekly={weekly} days={days} />
        <Agents agents={agents} />
      </div>
    </div>
  );
}

/* ---------------- Components ---------------- */
function Header({ status, inactiveSeconds, formatTime, loading, days, setDays, downloadJSON, downloadCSV }) {
  return (
    <div className="mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 bg-clip-text text-transparent">Activity Dashboard</h1>
          <p className="text-sm text-gray-600 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Real-time monitoring system
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-2 bg-white/80 rounded-xl p-1.5 border shadow">
            {[7,14,30].map((d)=>(
              <button key={d} onClick={()=>setDays(d)}
                className={`px-3 py-2 rounded-lg font-semibold text-sm ${days===d?"bg-gradient-to-r from-purple-500 to-pink-500 text-white":"text-gray-700 hover:bg-gray-100"}`}>{d}d</button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={downloadJSON} className="px-4 py-2 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 text-gray-900 shadow">📄 JSON</button>
            <button onClick={downloadCSV} className="px-4 py-2 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 text-gray-900 shadow">📊 CSV</button>
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 bg-white/80 rounded-2xl p-4 border shadow">
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${status==="Active"?"bg-green-500 animate-pulse":status==="Inactive"?"bg-yellow-500":"bg-red-500"}`}></span>
          <span className="font-bold">{status}</span>
        </div>
        {status==="Inactive" && <span className="text-sm text-gray-600">Inactive for {formatTime(inactiveSeconds)}</span>}
        {loading && <div className="ml-auto flex items-center gap-2 text-sm text-purple-600"><div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>Refreshing...</div>}
      </div>
    </div>
  );
}

function Overview({ today }) {
  if (!today) return <div className="flex justify-center py-10"><div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div></div>;
  return (
    <div className="mb-8 bg-white rounded-2xl p-6 border shadow">
      <h2 className="text-2xl font-bold mb-4">📊 Today's Overview</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard title="🎯 Sessions" value={today.sessionsCount} />
        <StatCard title="👥 Visits" value={today.visitsCount} />
        <StatCard title="⏰ Working" value={`${today.totalWorkingHours}h`} />
        <StatCard title="⏸️ Inactive" value={`${today.totalInactivityHours}h`} />
        <StatCard title="⚡ Active" value={`${today.totalActiveHours}h`} />
      </div>
    </div>
  );
}

function Weekly({ weekly, days }) {
  if (!weekly) return <div className="flex justify-center py-10"><div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div></div>;
  return (
    <div className="mb-8 bg-white rounded-2xl p-6 border shadow">
      <h3 className="text-xl font-bold mb-4">📈 Weekly Summary — Last {days} Days</h3>
      <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
        <thead className="bg-gray-50">
          <tr>
            <Th>📅 Date</Th><Th>🎯 Sessions</Th><Th>👥 Visits</Th><Th>⏰ Working</Th><Th>⏸️ Inactive</Th><Th>⚡ Active</Th>
          </tr>
        </thead>
        <tbody>
          {weekly.days.map((d)=>(
            <tr key={d.date} className="border-b hover:bg-gray-50">
              <Td bold>{d.date}</Td><Td>{d.sessions}</Td><Td>{d.visits}</Td>
              <Td>{d.totalWorkingHours}h</Td><Td>{d.totalInactivityHours}h</Td><Td>{d.totalActiveHours}h</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Agents({ agents }) {
  if (!agents) return <div className="flex justify-center py-10"><div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div></div>;
  return (
    <div className="bg-white rounded-2xl p-6 border shadow">
      <h3 className="text-xl font-bold mb-4">👨‍💼 Agents Performance — Today</h3>
      <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
        <thead className="bg-gray-50">
          <tr>
            <Th>👤 Agent</Th><Th>🎯 Sessions</Th><Th>👥 Visits</Th><Th>⏰ Working</Th><Th>⏸️ Inactive</Th><Th>⚡ Active</Th><Th>📍 Status</Th>
          </tr>
        </thead>
        <tbody>
          {agents.agents.map((a)=>(
            <tr key={a.agentId} className="border-b hover:bg-gray-50">
              <Td bold>{a.name}</Td><Td>{a.sessions}</Td><Td>{a.visits}</Td>
              <Td>{a.workingHours}h</Td><Td>{a.inactiveHours}h</Td><Td>{a.activeHours}h</Td>
              <Td><StatusBadge status={a.status}/></Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200 hover:shadow-md">
      <p className="text-gray-600 text-sm font-medium mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function Th({ children }) {
  return <th className="text-left py-3 px-4 font-semibold">{children}</th>;
}
function Td({ children, bold }) {
  return <td className={`py-3 px-4 ${bold ? "font-semibold" : ""}`}>{children}</td>;
}
function StatusBadge({ status }) {
  const config = {
    Active: "bg-green-500/20 border-green-400 text-green-700",
    Inactive: "bg-yellow-500/20 border-yellow-400 text-yellow-700",
    Offline: "bg-red-500/20 border-red-400 text-red-700",
  };
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${config[status]}`}>
      <span className={`w-2 h-2 rounded-full ${status==="Active"?"bg-green-500":status==="Inactive"?"bg-yellow-500":"bg-red-500"}`}></span>
      {status}
    </span>
  );
}