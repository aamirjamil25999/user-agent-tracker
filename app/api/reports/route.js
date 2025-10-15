// app/api/reports/route.js
import { NextResponse } from 'next/server';
import { connect } from '../_utils/db';
import Session from '../../../models/Session';
import Visit from '../../../models/Visit';
import { verifyToken } from '../_utils/auth';

export async function GET(req) {
  await connect();

  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date') || new Date().toISOString().slice(0, 10);

  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = authHeader.replace(/^Bearer\s+/i, '');
  let payload;
  try { payload = verifyToken(token); }
  catch (e) { return NextResponse.json({ error: 'Invalid token' }, { status: 401 }); }

  const start = new Date(date + 'T00:00:00.000Z');
  const end   = new Date(date + 'T23:59:59.999Z');

  // Sessions for this user on that day
  const sessions = await Session.find({
    userId: payload.userId,
    loginTime: { $gte: start, $lte: end }
  });

  // Visits for this user (agent) on that day
  const visits = await Visit.find({
    agentId: payload.userId,
    startTime: { $gte: start, $lte: end }
  });

  let totalWorkingMs = 0, totalInactivityMs = 0;
  for (const s of sessions) {
    const logout = s.logoutTime || new Date();
    totalWorkingMs += (logout - s.loginTime);
    (s.inactivityLogs || []).forEach(i => {
      totalInactivityMs += (new Date(i.endTime) - new Date(i.startTime));
    });
  }

  const report = {
    date,
    userId: payload.userId,
    sessionsCount: sessions.length,
    visitsCount: visits.length,
    totalWorkingHours: +(totalWorkingMs / 3600000).toFixed(2),
    totalInactivityHours: +(totalInactivityMs / 3600000).toFixed(2),
    totalActiveHours: +((totalWorkingMs - totalInactivityMs) / 3600000).toFixed(2),
    visits: visits.map(v => ({
      site: v.site,
      durationMinutes: +((new Date(v.endTime) - new Date(v.startTime)) / 60000).toFixed(1),
      startTime: v.startTime,
      endTime: v.endTime,
    })),
  };

  return NextResponse.json({ ok: true, report });
}