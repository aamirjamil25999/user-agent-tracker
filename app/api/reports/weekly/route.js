// app/api/reports/weekly/route.js
import { NextResponse } from 'next/server';
import { connect } from '../../_utils/db';
import Session from '../../../../models/Session';
import Visit from '../../../../models/Visit';
import { verifyToken } from '../../_utils/auth';

function floorYMD(date) {
  const d = new Date(date);
  d.setHours(0,0,0,0);
  return d;
}
function ymd(d){ return new Date(d).toISOString().slice(0,10); }

export async function GET(req) {
  await connect();

  const { searchParams } = new URL(req.url);
  const end = searchParams.get('end') ? new Date(searchParams.get('end')) : new Date(); // inclusive
  const start = searchParams.get('start')
    ? new Date(searchParams.get('start'))
    : new Date(end.getTime() - 6*24*3600*1000); // default last 7 days

  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let payload;
  try { payload = verifyToken(authHeader.replace(/^Bearer\s+/i,'')); }
  catch { return NextResponse.json({ error: 'Invalid token' }, { status: 401 }); }

  const startDay = floorYMD(start);
  const endDay = floorYMD(end);
  const endNext = new Date(endDay.getTime() + 24*3600*1000); // exclusive

  // Fetch all sessions & visits in range
  const sessions = await Session.find({
    $or: [
      { loginTime: { $gte: startDay, $lt: endNext } },
      { logoutTime: { $gte: startDay, $lt: endNext } }
    ]
  }).lean();

  const visits = await Visit.find({
    startTime: { $gte: startDay, $lt: endNext }
  }).lean();

  // Bucket per day
  const dayMap = {};
  for (let d = new Date(startDay); d < endNext; d = new Date(d.getTime()+24*3600*1000)) {
    dayMap[ymd(d)] = { date: ymd(d), sessions: 0, visits: 0, workingMs: 0, inactivityMs: 0 };
  }

  const clamp = (t) => Math.min(Math.max(t.getTime(), startDay.getTime()), endNext.getTime());

  for (const s of sessions) {
    const login = s.loginTime ? new Date(s.loginTime) : null;
    const logout = s.logoutTime ? new Date(s.logoutTime) : null;
    const endT = logout || new Date(); // still open → count until now
    const a = clamp(login || new Date());
    const b = clamp(endT);
    const ms = Math.max(0, b - a);

    // split into days
    let cur = new Date(a);
    while (cur < b) {
      const dayKey = ymd(cur);
      const dayEnd = new Date(cur); dayEnd.setHours(23,59,59,999);
      const segEnd = new Date(Math.min(b.getTime(), dayEnd.getTime()+1));
      const segMs = segEnd - cur;
      dayMap[dayKey] && (dayMap[dayKey].workingMs += segMs);
      dayMap[dayKey] && (dayMap[dayKey].sessions += 1);
      cur = new Date(segEnd);
    }

    // inactivity sum per day
    for (const log of s.inactivityLogs || []) {
      const ia = clamp(new Date(log.startTime));
      const ib = clamp(new Date(log.endTime || log.startTime));
      if (ib <= ia) continue;
      let x = new Date(ia);
      while (x < ib) {
        const dayKey = ymd(x);
        const dayEnd = new Date(x); dayEnd.setHours(23,59,59,999);
        const segEnd = new Date(Math.min(ib.getTime(), dayEnd.getTime()+1));
        const segMs = segEnd - x;
        dayMap[dayKey] && (dayMap[dayKey].inactivityMs += segMs);
        x = new Date(segEnd);
      }
    }
  }

  for (const v of visits) {
    const key = ymd(v.startTime);
    if (dayMap[key]) dayMap[key].visits += 1;
  }

  const days = Object.values(dayMap).map(d => ({
    date: d.date,
    sessions: d.sessions,
    visits: d.visits,
    totalWorkingHours: +(d.workingMs / 3600000).toFixed(2),
    totalInactivityHours: +(d.inactivityMs / 3600000).toFixed(2),
    totalActiveHours: +((d.workingMs - d.inactivityMs) / 3600000).toFixed(2),
  }));

  return NextResponse.json({ ok: true, range: { start: ymd(startDay), end: ymd(endDay) }, days });
}