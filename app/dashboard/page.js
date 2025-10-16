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

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // ✅ Auto Logout & Inactivity Timer
  useEffect(() => {
    if (!token) return;

    let inactivityTimer;
    let logoutTimer;
    let counterInterval;

    const handleActivity = () => {
      setStatus("Active");
      setInactiveSeconds(0);

      clearTimeout(inactivityTimer);
      clearTimeout(logoutTimer);
      clearInterval(counterInterval);

      inactivityTimer = setTimeout(() => {
        setStatus("Inactive");
        startCounter();
      }, 10000);

      logoutTimer = setTimeout(() => {
        handleLogout();
      }, 5 * 60 * 1000);
    };

    const startCounter = () => {
      let sec = 0;
      counterInterval = setInterval(() => {
        sec++;
        setInactiveSeconds(sec);
      }, 1000);
    };

    const handleLogout = async () => {
      try {
        await fetch("/api/logout", {
          method: "POST",
          headers: { Authorization: "Bearer " + token },
        });
      } catch (e) {
        console.error("Auto logout failed:", e);
      }
      clearInterval(counterInterval);
      localStorage.removeItem("token");
      setStatus("Offline");
      window.location.href = "/login";
    };

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("click", handleActivity);
    window.addEventListener("scroll", handleActivity);

    handleActivity();

    return () => {
      clearTimeout(inactivityTimer);
      clearTimeout(logoutTimer);
      clearInterval(counterInterval);
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("scroll", handleActivity);
    };
  }, [token]);

  // ✅ Fetch every 10s
  useEffect(() => {
    if (!token) return;
    loadAllData();
    const interval = setInterval(() => loadAllData(), 10000);
    return () => clearInterval(interval);
  }, [token, days]);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([loadToday(), loadWeekly(days), loadAgents()]);
    setLoading(false);
  };

  const safeJson = async (res) => {
    try {
      return await res.json();
    } catch {
      return {};
    }
  };

  const loadToday = async () => {
    const res = await fetch("/api/reports", {
      headers: { Authorization: "Bearer " + token },
    });
    const j = await safeJson(res);
    if (res.ok) setReport(j);
  };

  const loadWeekly = async (lastNDays) => {
    const end = new Date().toISOString().slice(0, 10);
    const start = new Date(Date.now() - (lastNDays - 1) * 86400000)
      .toISOString()
      .slice(0, 10);
    const res = await fetch(`/api/reports/weekly?start=${start}&end=${end}`, {
      headers: { Authorization: "Bearer " + token },
    });
    const j = await safeJson(res);
    if (res.ok) setWeekly(j);
  };

  const loadAgents = async () => {
    const d = new Date().toISOString().slice(0, 10);
    const res = await fetch(`/api/reports/agents?date=${d}`, {
      headers: { Authorization: "Bearer " + token },
    });
    const j = await safeJson(res);
    if (res.ok) setAgents(j);
  };

  const today = report?.report;
  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const downloadJSON = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `today-report-${report?.report?.date || "today"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCSV = () => {
    if (!report?.report) return;
    const r = report.report;
    const headers = [
      "Date",
      "Sessions",
      "Visits",
      "Total Working Hours",
      "Total Inactivity Hours",
      "Total Active Hours",
    ];
    const row = [
      r.date,
      r.sessionsCount,
      r.visitsCount,
      r.totalWorkingHours,
      r.totalInactivityHours,
      r.totalActiveHours,
    ];
    const csv = headers.join(",") + "\n" + row.join(",");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `today-report-${r.date || "today"}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-cyan-50">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-cyan-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="relative z-10 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 bg-clip-text text-transparent drop-shadow-sm">
                Activity Dashboard
              </h1>
              <p className="text-sm sm:text-base text-gray-600 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Real-time monitoring system
              </p>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex gap-2 bg-white/80 backdrop-blur-sm rounded-xl p-1.5 border border-gray-200 shadow-lg">
                {[7, 14, 30].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDays(d)}
                    className={`px-3 sm:px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                      days === d
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {d}d
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={downloadJSON}
                  className="flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 text-gray-900 hover:from-purple-500 hover:via-pink-500 hover:to-cyan-500 transition-all shadow-md hover:shadow-lg"
                >
                  📄 JSON
                </button>
                <button
                  onClick={downloadCSV}
                  className="flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 text-gray-900 hover:from-purple-500 hover:via-pink-500 hover:to-cyan-500 transition-all shadow-md hover:shadow-lg"
                >
                  📊 CSV
                </button>
              </div>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="mt-4 sm:mt-6 flex flex-wrap items-center gap-3 sm:gap-4 bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-200 shadow-lg">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${
                status === "Active" ? "bg-green-500 animate-pulse" :
                status === "Inactive" ? "bg-yellow-500" : "bg-red-500"
              }`}></span>
              <span className="font-bold text-gray-900">{status}</span>
            </div>
            {status === "Inactive" && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Inactive for {formatTime(inactiveSeconds)}</span>
              </div>
            )}
            {loading && (
              <div className="ml-auto flex items-center gap-2 text-sm text-purple-600">
                <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="hidden sm:inline">Refreshing...</span>
              </div>
            )}
          </div>
        </div>

        {/* Today's Overview */}
        <div className="mb-6">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl p-4 sm:p-6 border border-gray-200 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-2xl sm:text-3xl">📊</span>
                  Today's Overview
                </h2>
                {today?.date && (
                  <span className="inline-block px-4 py-1.5 bg-purple-100 rounded-full text-sm font-semibold border border-purple-200 text-purple-700">
                    {today.date}
                  </span>
                )}
              </div>

              {!today ? (
                <div className="flex justify-center py-8 sm:py-12">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                  <StatCard title="Sessions" value={today.sessionsCount} icon="🎯" color="from-violet-100 to-purple-100" />
                  <StatCard title="Visits" value={today.visitsCount} icon="👥" color="from-blue-100 to-cyan-100" />
                  <StatCard title="Working" value={`${today.totalWorkingHours}h`} icon="⏰" color="from-emerald-100 to-green-100" />
                  <StatCard title="Inactive" value={`${today.totalInactivityHours}h`} icon="⏸️" color="from-amber-100 to-orange-100" />
                  <StatCard title="Active" value={`${today.totalActiveHours}h`} icon="⚡" color="from-fuchsia-100 to-pink-100" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Weekly Summary */}
        <div className="mb-6">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl p-4 sm:p-6 border border-gray-200 shadow-xl">
              <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900 flex flex-wrap items-center gap-2">
                <span className="text-2xl sm:text-3xl">📈</span>
                <span>Weekly Summary</span>
                <span className="px-3 py-1 bg-cyan-100 rounded-full text-sm font-semibold border border-cyan-200 text-cyan-700">
                  Last {days} Days
                </span>
              </h3>

              {!weekly ? (
                <div className="flex justify-center py-8 sm:py-12">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-inner">
                  <table className="w-full text-sm">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <Th>📅 Date</Th>
                        <Th>🎯 Sessions</Th>
                        <Th>👥 Visits</Th>
                        <Th>⏰ Working</Th>
                        <Th>⏸️ Inactive</Th>
                        <Th>⚡ Active</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {weekly.days.map((d, idx) => (
                        <tr
                          key={d.date}
                          className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-200"
                        >
                          <Td bold>{d.date}</Td>
                          <Td>{d.sessions}</Td>
                          <Td>{d.visits}</Td>
                          <Td>{d.totalWorkingHours}h</Td>
                          <Td>{d.totalInactivityHours}h</Td>
                          <Td>{d.totalActiveHours}h</Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Agents Performance */}
        <div>
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-rose-500 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl p-4 sm:p-6 border border-gray-200 shadow-xl">
              <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900 flex flex-wrap items-center gap-2">
                <span className="text-2xl sm:text-3xl">👨‍💼</span>
                <span>Agents Performance</span>
                <span className="px-3 py-1 bg-pink-100 rounded-full text-sm font-semibold border border-pink-200 text-pink-700">
                  Today
                </span>
              </h3>

              {!agents ? (
                <div className="flex justify-center py-8 sm:py-12">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-inner">
                  <table className="w-full text-sm">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <Th>👤 Agent</Th>
                        <Th>🎯 Sessions</Th>
                        <Th>👥 Visits</Th>
                        <Th>⏰ Working</Th>
                        <Th>⏸️ Inactive</Th>
                        <Th>⚡ Active</Th>
                        <Th>📍 Status</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {agents.agents.map((a) => (
                        <tr
                          key={a.agentId}
                          className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-200"
                        >
                          <Td bold>{a.name}</Td>
                          <Td>{a.sessions}</Td>
                          <Td>{a.visits}</Td>
                          <Td>{a.workingHours}h</Td>
                          <Td>{a.inactiveHours}h</Td>
                          <Td>{a.activeHours}h</Td>
                          <Td>
                            <StatusBadge status={a.status} />
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Components */
function StatCard({ title, value, icon, color }) {
  return (
    <div className={`bg-gradient-to-br ${color} rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-200 hover:shadow-lg hover:scale-105 transition-all duration-200`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-gray-700 text-xs sm:text-sm font-semibold">{title}</p>
        <span className="text-xl sm:text-2xl">{icon}</span>
      </div>
      <p className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900">
        {value}
      </p>
    </div>
  );
}

function Th({ children }) {
  return (
    <th className="text-left text-gray-700 font-bold py-3 px-3 sm:px-4 border-b-2 border-gray-200 whitespace-nowrap">
      {children}
    </th>
  );
}

function Td({ children, bold }) {
  return (
    <td className={`py-3 px-3 sm:px-4 whitespace-nowrap ${bold ? 'font-bold text-gray-900' : 'text-gray-700'}`}>
      {children}
    </td>
  );
}

function StatusBadge({ status }) {
  const config = {
    Active: {
      bg: "bg-green-100",
      border: "border-green-300",
      text: "text-green-700",
      dot: "bg-green-500"
    },
    Inactive: {
      bg: "bg-yellow-100",
      border: "border-yellow-300",
      text: "text-yellow-700",
      dot: "bg-yellow-500"
    },
    Offline: {
      bg: "bg-red-100",
      border: "border-red-300",
      text: "text-red-700",
      dot: "bg-red-500"
    },
  };

  const style = config[status] || config.Offline;

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${style.bg} ${style.border} ${style.text}`}>
      <span className={`w-2 h-2 rounded-full ${style.dot} ${status === 'Active' ? 'animate-pulse' : ''}`}></span>
      {status}
    </span>
  );
}