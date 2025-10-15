// app/api/ping/route.js
import { NextResponse } from 'next/server';
import { connect } from '../_utils/db';
import Session from '../../../models/Session';
import { verifyToken } from '../_utils/auth';

export async function POST(req) {
  await connect();
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = authHeader.replace(/^Bearer\s+/i, '');
  let payload;
  try {
    payload = verifyToken(token);
  } catch (e) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const session = await Session.findById(payload.sessionId);
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

  // Already logged out? return idempotent info
  if (session.logoutTime) {
    return NextResponse.json({ ok: true, status: 'already_logged_out', logoutTime: session.logoutTime });
  }

  const now = new Date();
  const lastPing = session.lastPing || session.loginTime || now;
  const gapMs = now - lastPing;
  const gapMin = gapMs / 60000;

  if (gapMin >= 5) {
    if (!Array.isArray(session.inactivityLogs)) session.inactivityLogs = [];
    session.inactivityLogs.push({ startTime: lastPing, endTime: now });
    session.logoutTime = now;
    await session.save();
    return NextResponse.json({
      ok: true,
      status: 'auto_logged_out',
      inactivity: { startTime: lastPing, endTime: now, minutes: +gapMin.toFixed(2) },
      logoutTime: now
    });
  }

  session.lastPing = now;
  await session.save();
  return NextResponse.json({ ok: true, status: 'active', now });
}