// app/api/reports/agents/route.js
import { NextResponse } from "next/server";
import { connect } from "../../_utils/db";
import Session from "../../../../models/Session";
import Visit from "../../../../models/Visit";
import User from "../../../../models/User";
import { verifyToken } from "../../_utils/auth";

export async function GET(req) {
  await connect();

  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date") || new Date().toISOString().slice(0, 10);
  const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
  const dayEnd = new Date(dayStart.getTime() + 24 * 3600 * 1000);

  const authHeader = req.headers.get("authorization");
  if (!authHeader)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let userData;
  try {
    userData = verifyToken(authHeader.replace(/^Bearer\s+/i, ""));
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  // ✅ Logged-in user
  const user = await User.findOne({ email: userData.email }).lean();
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  // ✅ Get today's sessions & visits for logged-in user
  const sessions = await Session.find({
    userId: user._id,
    $or: [
      { loginTime: { $gte: dayStart, $lt: dayEnd } },
      { logoutTime: { $gte: dayStart, $lt: dayEnd } },
    ],
  }).lean();

  const visits = await Visit.find({
    agentId: user._id,
    startTime: { $gte: dayStart, $lt: dayEnd },
  }).lean();

  // 🧠 Calculate working/inactivity time
  let workingMs = 0;
  let inactivityMs = 0;

  const clamp = (t) => {
    if (!(t instanceof Date)) t = new Date(t);
    return Math.min(Math.max(t.getTime(), dayStart.getTime()), dayEnd.getTime());
  };

  for (const s of sessions) {
    const login = new Date(s.loginTime);
    const logout = s.logoutTime ? new Date(s.logoutTime) : new Date();
    const ms = Math.max(0, clamp(logout) - clamp(login));
    workingMs += ms;

    for (const log of s.inactivityLogs || []) {
      const ia = clamp(new Date(log.startTime));
      const ib = clamp(new Date(log.endTime || log.startTime));
      if (ib > ia) inactivityMs += ib - ia;
    }
  }

  const realUser = {
    agentId: String(user._id),
    name: user.name,
    email: user.email,
    sessions: sessions.length || 0,
    visits: visits.length || 0,
    workingHours: +(workingMs / 3600000).toFixed(2),
    inactiveHours: +(inactivityMs / 3600000).toFixed(2),
    activeHours: +((workingMs - inactivityMs) / 3600000).toFixed(2),
    status: "Active",
  };

  // 🧩 Add 10 dummy offline agents
  const dummyAgents = Array.from({ length: 10 }).map((_, i) => ({
    agentId: `dummy-${i + 1}`,
    name: `Agent ${i + 1}`,
    email: `agent${i + 1}@company.com`,
    sessions: Math.floor(Math.random() * 4) + 1,
    visits: Math.floor(Math.random() * 2) + 1,
    workingHours: +(Math.random() * 6 + 2).toFixed(2),
    inactiveHours: +(Math.random() * 1.5).toFixed(2),
    activeHours: +(Math.random() * 5).toFixed(2),
    status: "Offline",
  }));

  // 🧾 Merge: Real user always on top
  const allAgents = [realUser, ...dummyAgents];

  return NextResponse.json({
    ok: true,
    date: dateStr,
    agents: allAgents,
  });
}