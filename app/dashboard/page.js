"use client";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [report, setReport] = useState(null);
  const [weekly, setWeekly] = useState(null);
  const [agents, setAgents] = useState(null);
  const [days, setDays] = useState(7);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    if (!token) return;
    loadToday();
    loadWeekly(days);
    loadAgents();
  }, [token, days]);

  const loadToday = async () => {
    const res = await fetch("/api/reports", {
      headers: { Authorization: "Bearer " + token },
    });
    const j = await res.json();
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
    const j = await res.json();
    if (res.ok) setWeekly(j);
  };

  const loadAgents = async () => {
    const d = new Date().toISOString().slice(0, 10);
    const res = await fetch(`/api/reports/agents?date=${d}`, {
      headers: { Authorization: "Bearer " + token },
    });
    const j = await res.json();
    if (res.ok) setAgents(j);
  };

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

  const today = report?.report;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-cyan-50 text-gray-900">
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">
                <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 bg-clip-text text-transparent">
                  Activity Dashboard
                </span>
              </h1>
              <p className="text-gray-600 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Real-time performance metrics
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex gap-2 bg-white rounded-xl p-1.5 border border-gray-200 shadow-sm">
                <Quick label="7d" active={days === 7} onClick={() => setDays(7)} />
                <Quick label="14d" active={days === 14} onClick={() => setDays(14)} />
                <Quick label="30d" active={days === 30} onClick={() => setDays(30)} />
              </div>
              <div className="flex gap-2">
                <NeonButton onClick={downloadJSON}>📄 JSON</NeonButton>
                <NeonButton onClick={downloadCSV}>📊 CSV</NeonButton>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Report */}
        <div className="mb-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
                📊 Today's Overview
              </h2>
              <span className="px-4 py-1.5 bg-purple-100 rounded-full text-sm font-semibold border border-purple-200 text-purple-700">
                {today?.date || "—"}
              </span>
            </div>
            
            {!today ? (
              <div className="flex justify-center py-8">
                <div className="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <Card title="Sessions" value={today.sessionsCount} icon="🎯" />
                <Card title="Visits" value={today.visitsCount} icon="👥" />
                <Card title="Working" value={`${today.totalWorkingHours}h`} icon="⏰" />
                <Card title="Inactive" value={`${today.totalInactivityHours}h`} icon="⏸️" />
                <Card title="Active" value={`${today.totalActiveHours}h`} icon="⚡" />
              </div>
            )}
          </div>
        </div>

        {/* Weekly Summary */}
        <div className="mb-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900">
              📈 Weekly Summary
              <span className="px-3 py-1 bg-cyan-100 rounded-full text-sm font-semibold border border-cyan-200 text-cyan-700">
                Last {days} Days
              </span>
            </h3>
            
            {!weekly ? (
              <div className="flex justify-center py-8">
                <div className="w-10 h-10 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <Th>📅 Date</Th>
                      <Th>🎯 Sessions</Th>
                      <Th>👥 Visits</Th>
                      <Th>⏰ Working (h)</Th>
                      <Th>⏸️ Inactive (h)</Th>
                      <Th>⚡ Active (h)</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {weekly.days.map((d) => (
                      <tr
                        key={d.date}
                        className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                      >
                        <Td bold>{d.date}</Td>
                        <Td>{d.sessions}</Td>
                        <Td>{d.visits}</Td>
                        <Td>{d.totalWorkingHours}</Td>
                        <Td>{d.totalInactivityHours}</Td>
                        <Td>{d.totalActiveHours}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Agents Performance */}
        <div>
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900">
              👨‍💼 Agents Performance
              <span className="px-3 py-1 bg-pink-100 rounded-full text-sm font-semibold border border-pink-200 text-pink-700">
                Today
              </span>
            </h3>
            
            {!agents ? (
              <div className="flex justify-center py-8">
                <div className="w-10 h-10 border-3 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-700/50">
                    <tr>
                      <Th>👤 Agent</Th>
                      <Th>🎯 Sessions</Th>
                      <Th>👥 Visits</Th>
                      <Th>⏰ Working (h)</Th>
                      <Th>⏸️ Inactive (h)</Th>
                      <Th>⚡ Active (h)</Th>
                      <Th>📍 Status</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {agents.agents.map((a) => (
                      <tr
                        key={a.agentId}
                        className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                      >
                        <Td bold>{a.name}</Td>
                        <Td>{a.sessions}</Td>
                        <Td>{a.visits}</Td>
                        <Td>{a.workingHours}</Td>
                        <Td>{a.inactiveHours}</Td>
                        <Td>{a.activeHours}</Td>
                        <Td>
                          <Badge status={a.status} />
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
  );
}

/* Components */
function Card({ title, value, icon }) {
  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200 hover:border-purple-300 hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-2">
        <p className="text-gray-600 text-sm font-medium">{title}</p>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">
        {value}
      </p>
    </div>
  );
}

function Quick({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
        active
          ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md"
          : "bg-transparent text-gray-900 hover:bg-gray-100 font-bold"
      }`}
    >
      {label}
    </button>
  );
}

function NeonButton({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-lg font-bold text-sm bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 text-gray-900 hover:from-purple-500 hover:via-pink-500 hover:to-cyan-500 transition-all shadow-md hover:shadow-lg"
    >
      {children}
    </button>
  );
}

function Th({ children }) {
  return (
    <th className="text-left text-gray-700 font-bold py-3 px-4 border-b border-gray-200">
      {children}
    </th>
  );
}

function Td({ children, bold }) {
  return (
    <td className={`py-3 px-4 ${bold ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
      {children}
    </td>
  );
}

function Badge({ status }) {
  const config = {
    Active: "bg-green-500/20 border-green-400/50 text-green-300",
    Idle: "bg-yellow-500/20 border-yellow-400/50 text-yellow-300",
    Offline: "bg-red-500/20 border-red-400/50 text-red-300",
  };
  
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${config[status] || config.Offline}`}>
      <span className={`w-2 h-2 rounded-full ${status === 'Active' ? 'bg-green-400' : status === 'Idle' ? 'bg-yellow-400' : 'bg-red-400'}`}></span>
      {status}
    </span>
  );
}