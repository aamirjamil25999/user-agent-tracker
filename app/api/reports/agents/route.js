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
  const dateStr =
    searchParams.get("date") || new Date().toISOString().slice(0, 10);
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

  // ✅ Fetch all registered users
  const users = await User.find().lean();

  const clamp = (t) => {
    if (!(t instanceof Date)) t = new Date(t);
    return Math.min(Math.max(t.getTime(), dayStart.getTime()), dayEnd.getTime());
  };

  const allAgents = [];

  // ✅ Loop through all users to compute stats
  for (const user of users) {
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

    let workingMs = 0;
    let inactivityMs = 0;

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

    // ✅ Status Logic
    const isCurrentUser = user.email === userData.email;
    const status = isCurrentUser ? "Active" : "Offline";

    allAgents.push({
      agentId: String(user._id),
      name: user.name,
      email: user.email,
      sessions: sessions.length || 0,
      visits: visits.length || 0,
      workingHours: +(workingMs / 3600000).toFixed(2),
      inactiveHours: +(inactivityMs / 3600000).toFixed(2),
      activeHours: +((workingMs - inactivityMs) / 3600000).toFixed(2),
      status,
    });
  }

  // ✅ Return only real users (no dummy data)
  return NextResponse.json({
    ok: true,
    date: dateStr,
    agents: allAgents,
  });
}