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
  const dayStart = new Date(dateStr + "T00:00:00.000Z");
  const dayEnd = new Date(dayStart.getTime() + 24 * 3600 * 1000);

  const authHeader = req.headers.get("authorization");
  if (!authHeader)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let decoded;
  try {
    decoded = verifyToken(authHeader.replace(/^Bearer\s+/i, ""));
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  // ✅ Current logged-in user email
  const currentEmail = decoded.email;

  // All verified users
  const agents = await User.find({ isVerified: true }).select("_id name email").lean();

  // Fetch today's sessions and visits
  const sessions = await Session.find({
    userId: { $in: agents.map((a) => a._id) },
    $or: [
      { loginTime: { $gte: dayStart, $lt: dayEnd } },
      { logoutTime: { $gte: dayStart, $lt: dayEnd } },
    ],
  }).lean();

  const visits = await Visit.find({
    startTime: { $gte: dayStart, $lt: dayEnd },
  }).lean();

  const perAgent = new Map(
    agents.map((a) => [
      String(a._id),
      {
        agentId: String(a._id),
        name: a.name,
        email: a.email,
        sessions: 0,
        visits: 0,
        workingHours: 0,
        activeHours: 0,
        inactiveHours: 0,
        status: "Offline", // Default
      },
    ])
  );

  // Calculate session & visit counts
  for (const s of sessions) {
    const a = perAgent.get(String(s.userId));
    if (!a) continue;
    a.sessions += 1;
  }

  for (const v of visits) {
    const key = String(v.agentId);
    if (perAgent.has(key)) perAgent.get(key).visits += 1;
  }

  // ✅ Now mark the logged-in user's status = "Active"
  for (const a of perAgent.values()) {
    if (a.email === currentEmail) {
      a.status = "Active";
    } else {
      a.status = "Offline";
    }
  }

  const rows = Array.from(perAgent.values());
  return NextResponse.json({ ok: true, date: dateStr, agents: rows });
}