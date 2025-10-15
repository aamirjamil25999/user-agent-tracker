"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

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

  // ✅ Download JSON
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

  // ✅ Download CSV
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-slate-100 p-8">
      {/* ---------------- HEADER SECTION ---------------- */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
        <div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-fuchsia-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
            Activity Dashboard
          </h1>
          <p className="text-slate-400 mt-1">
            Real-time user & agent performance overview
          </p>
        </div>

        {/* ✅ FILTERS + DOWNLOAD BUTTONS */}
        <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 mt-2">
          <Quick label="7d" active={days === 7} onClick={() => setDays(7)} />
          <Quick label="14d" active={days === 14} onClick={() => setDays(14)} />
          <Quick label="30d" active={days === 30} onClick={() => setDays(30)} />
          <div className="flex gap-2">
            <NeonButton onClick={downloadJSON}>📄 Download JSON</NeonButton>
            <NeonButton onClick={downloadCSV}>📊 Download CSV</NeonButton>
          </div>
        </div>
      </div>

      {/* ---------------- TODAY'S REPORT ---------------- */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.6)]"
      >
        <h2 className="text-2xl font-bold mb-4">
          Today ({today?.date || "—"})
        </h2>
        {!today ? (
          <p className="text-slate-400">Loading…</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card title="Sessions" value={today.sessionsCount} />
            <Card title="Visits" value={today.visitsCount} />
            <Card title="Working (h)" value={today.totalWorkingHours} />
            <Card title="Inactive (h)" value={today.totalInactivityHours} />
            <Card title="Active (h)" value={today.totalActiveHours} />
          </div>
        )}
      </motion.div>

      {/* ---------------- WEEKLY SUMMARY ---------------- */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mt-10 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.6)]"
      >
        <h3 className="text-xl font-semibold mb-3">
          Weekly Summary (Last {days} Days)
        </h3>
        {!weekly ? (
          <p className="text-slate-400">Loading…</p>
        ) : (
          <div className="overflow-auto rounded-lg">
            <table className="min-w-full text-sm border-collapse">
              <thead className="bg-white/10">
                <tr>
                  <Th>Date</Th>
                  <Th>Sessions</Th>
                  <Th>Visits</Th>
                  <Th>Working (h)</Th>
                  <Th>Inactive (h)</Th>
                  <Th>Active (h)</Th>
                </tr>
              </thead>
              <tbody>
                {weekly.days.map((d) => (
                  <tr
                    key={d.date}
                    className="odd:bg-white/0 even:bg-white/[0.04] hover:bg-white/[0.08] transition"
                  >
                    <Td>{d.date}</Td>
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
      </motion.div>

      {/* ---------------- AGENTS PERFORMANCE ---------------- */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="mt-10 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.6)]"
      >
        <h3 className="text-xl font-semibold mb-3">
          Agents Performance (Today)
        </h3>
        {!agents ? (
          <p className="text-slate-400">Loading…</p>
        ) : (
          <div className="overflow-auto rounded-lg">
            <table className="min-w-full text-sm border-collapse">
              <thead className="bg-white/10">
                <tr>
                  <Th>Agent</Th>
                  <Th>Sessions</Th>
                  <Th>Visits</Th>
                  <Th>Working (h)</Th>
                  <Th>Inactive (h)</Th>
                  <Th>Active (h)</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {agents.agents.map((a) => (
                  <tr
                    key={a.agentId}
                    className="odd:bg-white/0 even:bg-white/[0.04] hover:bg-white/[0.08] transition"
                  >
                    <Td>{a.name}</Td>
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
      </motion.div>
    </div>
  );
}

/* ---------- small ui helpers ---------- */
function Card({ title, value }) {
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.03 }}
      className="rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.03] p-4 text-center"
    >
      <p className="text-slate-400 text-sm">{title}</p>
      <p className="mt-1 text-2xl font-bold text-fuchsia-300">{value}</p>
    </motion.div>
  );
}

function Quick({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm border ${
        active
          ? "border-fuchsia-400 text-fuchsia-300 bg-fuchsia-500/10"
          : "border-white/15 text-slate-300 hover:bg-white/10"
      }`}
    >
      {label}
    </button>
  );
}

/* ✅ Updated NeonButton with black text */
function NeonButton({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-lg text-sm font-semibold text-black bg-gradient-to-r from-fuchsia-300 via-violet-300 to-cyan-300 hover:from-fuchsia-200 hover:to-cyan-200 transition shadow-md hover:shadow-lg"
    >
      {children}
    </button>
  );
}

function Th({ children }) {
  return (
    <th className="text-left text-slate-200 text-sm font-semibold py-2 px-3 border-b border-white/10">
      {children}
    </th>
  );
}

function Td({ children }) {
  return (
    <td className="py-2 px-3 text-slate-100 border-b border-white/10">
      {children}
    </td>
  );
}

function Badge({ status }) {
  const map = {
    Active: "bg-emerald-500/20 text-emerald-300",
    Idle: "bg-amber-500/20 text-amber-300",
    Offline: "bg-rose-500/20 text-rose-300",
  };
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${map[status]}`}
    >
      {status}
    </span>
  );
}