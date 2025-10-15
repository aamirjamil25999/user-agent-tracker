import { NextResponse } from 'next/server';
import { connect } from '../_utils/db';
import Session from '../../../models/Session';
import { verifyToken } from '../_utils/auth';
export async function POST(req) {
  await connect();
  const { authorization } = req.headers;
  if (!authorization) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const token = authorization.replace('Bearer ', '');
  let payload;
  try { payload = verifyToken(token); } catch(e) { return NextResponse.json({ error: 'Invalid token' }, { status: 401 }); }
  const session = await Session.findById(payload.sessionId);
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  session.logoutTime = new Date();
  await session.save();
  return NextResponse.json({ ok: true });
}
