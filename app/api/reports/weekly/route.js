// app/api/reports/weekly/route.js
import { NextResponse } from "next/server";
import { connect } from "../../_utils/db";
import Session from "../../../../models/Session";
import Visit from "../../../../models/Visit";
import { verifyToken } from "../../_utils/auth";

export async function GET(req) {
  await connect();

  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  const auth = req.headers.get("authorization");
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let payload;
  try {
    payload = verifyToken(auth.replace(/^Bearer\s+/i, ""));
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  if (!start || !end) {
    return NextResponse.json({ error: "Start and end dates required" }, { status: 400 });
  }

  const startDate = new Date(start);
  const endDate = new Date(end);
  const days = [];

  // ✅ loop through each day
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dayStart = new Date(d);
    const dayEnd = new Date(d);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const sessions = await Session.find({
      userId: payload.userId,
      $or: [
        { loginTime: { $gte: dayStart, $lt: dayEnd } },
        { logoutTime: { $gte: dayStart, $lt: dayEnd } },
      ],
    }).lean();

    const visits = await Visit.find({
      agentId: payload.userId,
      startTime: { $gte: dayStart, $lt: dayEnd },
    }).lean();

    let workingMs = 0,
      inactiveMs = 0;

    const clamp = (t) => {
      if (!(t instanceof Date)) t = new Date(t);
      return Math.min(Math.max(t.getTime(), dayStart.getTime()), dayEnd.getTime());
    };

    for (const s of sessions) {
      const login = new Date(s.loginTime);
      const logout = s.logoutTime ? new Date(s.logoutTime) : new Date();
      workingMs += Math.max(0, clamp(logout) - clamp(login));

      for (const log of s.inactivityLogs || []) {
        const ia = clamp(new Date(log.startTime));
        const ib = clamp(new Date(log.endTime || log.startTime));
        if (ib > ia) inactiveMs += ib - ia;
      }
    }

    const workingHours = +(workingMs / 3600000).toFixed(2);
    const inactiveHours = +(inactiveMs / 3600000).toFixed(2);
    const activeHours = +(workingHours - inactiveHours).toFixed(2);

    days.push({
      date: dayStart.toISOString().slice(0, 10),
      sessions: sessions.length,
      visits: visits.length,
      totalWorkingHours: workingHours,
      totalInactivityHours: inactiveHours,
      totalActiveHours: activeHours,
    });
  }

  return NextResponse.json({
    ok: true,
    start,
    end,
    days,
  });
}