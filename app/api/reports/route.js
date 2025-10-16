
import { NextResponse } from "next/server";
import { connect } from "../_utils/db";
import Session from "../../../models/Session";
import Visit from "../../../models/Visit";
import { verifyToken } from "../_utils/auth";
import User from "../../../models/User";

export async function GET(req) {
  await connect();

  const authHeader = req.headers.get("authorization");
  if (!authHeader)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let userData;
  try {
    userData = verifyToken(authHeader.replace(/^Bearer\s+/i, ""));
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  // ---- Get today’s date range (local time, not UTC) ----
  const now = new Date();
  const localDateStr = now.toLocaleDateString("en-CA"); // YYYY-MM-DD in local tz
  const dayStart = new Date(`${localDateStr}T00:00:00`);
  const dayEnd = new Date(dayStart.getTime() + 24 * 3600 * 1000);

  // ---- Fetch sessions for the logged-in user ----
  const user = await User.findOne({ email: userData.email }).lean();
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

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

  // ---- Calculate working / inactivity time ----
  let workingMs = 0,
    inactivityMs = 0;

  const clamp = (t) =>
    Math.min(Math.max(t.getTime(), dayStart.getTime()), dayEnd.getTime());

  for (const s of sessions) {
    const login = new Date(s.loginTime);
    const logout = s.logoutTime ? new Date(s.logoutTime) : new Date();
    workingMs += Math.max(0, clamp(logout) - clamp(login));

    for (const log of s.inactivityLogs || []) {
      const ia = clamp(new Date(log.startTime));
      const ib = clamp(new Date(log.endTime || log.startTime));
      if (ib > ia) inactivityMs += ib - ia;
    }
  }

  const totalWorkingHours = +(workingMs / 3600000).toFixed(2);
  const totalInactivityHours = +(inactivityMs / 3600000).toFixed(2);
  const totalActiveHours = +(
    (workingMs - inactivityMs) /
    3600000
  ).toFixed(2);

  const report = {
    date: localDateStr,
    sessionsCount: sessions.length,
    visitsCount: visits.length,
    totalWorkingHours,
    totalInactivityHours,
    totalActiveHours,
  };

  return NextResponse.json({ ok: true, report });
}