// app/api/reports/agents/route.js
import { NextResponse } from 'next/server';
import { connect } from '../../_utils/db';
import Session from '../../../../models/Session';
import Visit from '../../../../models/Visit';
import User from '../../../../models/User';
import { verifyToken } from '../../_utils/auth';

export async function GET(req) {
  await connect();

  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get('date') || new Date().toISOString().slice(0,10);
  const dayStart = new Date(dateStr + 'T00:00:00.000Z');
  const dayEnd = new Date(dayStart.getTime() + 24*3600*1000);

  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try { verifyToken(authHeader.replace(/^Bearer\s+/i,'')); }
  catch { return NextResponse.json({ error: 'Invalid token' }, { status: 401 }); }

  // Get all verified users as "agents"
  const agents = await User.find({ isVerified: true }).select('_id name email').lean();

  // Today’s sessions & visits
  const sessions = await Session.find({
    userId: { $in: agents.map(a => a._id) },
    $or: [
      { loginTime:  { $gte: dayStart, $lt: dayEnd } },
      { logoutTime: { $gte: dayStart, $lt: dayEnd } }
    ]
  }).lean();

  const visits = await Visit.find({
    startTime: { $gte: dayStart, $lt: dayEnd }
  }).lean();

  const perAgent = new Map(agents.map(a => [String(a._id), {
    agentId: String(a._id), name: a.name, email: a.email,
    sessions: 0, workingMs: 0, inactivityMs: 0, visits: 0
  }]));

  const clamp = (t) => Math.min(Math.max(t.getTime(), dayStart.getTime()), dayEnd.getTime());

  for (const s of sessions) {
    const a = perAgent.get(String(s.userId));
    if (!a) continue;
    a.sessions += 1;

    const login = s.loginTime ? new Date(s.loginTime) : null;
    const logout = s.logoutTime ? new Date(s.logoutTime) : null;
    const endT = logout || new Date();
    const ms = Math.max(0, clamp(endT) - clamp(login || new Date()));
    a.workingMs += ms;

    for (const log of s.inactivityLogs || []) {
      const ia = clamp(new Date(log.startTime));
      const ib = clamp(new Date(log.endTime || log.startTime));
      if (ib > ia) a.inactivityMs += (ib - ia);
    }
  }

  for (const v of visits) {
    // If your Visit is tied to User instead of Agent model, adjust key accordingly
    // Here Visit.agentId is an ObjectId that may reference User; if not, skip
    const key = String(v.agentId);
    if (perAgent.has(key)) perAgent.get(key).visits += 1;
  }

  const rows = Array.from(perAgent.values()).map(r => ({
    ...r,
    activeHours: +((r.workingMs - r.inactivityMs)/3600000).toFixed(2),
    inactiveHours: +(r.inactivityMs/3600000).toFixed(2),
    workingHours: +(r.workingMs/3600000).toFixed(2),
    status: r.workingMs === 0 ? 'Offline' : (r.inactivityMs / r.workingMs > 0.2 ? 'Idle' : 'Active')
  }));

  return NextResponse.json({ ok: true, date: dateStr, agents: rows });
}