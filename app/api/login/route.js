import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { connect } from '../_utils/db';
import User from '../../../models/User';
import Session from '../../../models/Session';
import { signToken } from '../_utils/auth';
export async function POST(req) {
  await connect();
  const { email, password } = await req.json();
  if (!email || !password) return NextResponse.json({ error: 'Missing' }, { status: 400 });
  const user = await User.findOne({ email });
  if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  if (!user.isVerified) return NextResponse.json({ error: 'Email not verified' }, { status: 403 });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  const session = await Session.create({ userId: user._id, loginTime: new Date(), lastPing: new Date() });
  const token = signToken({ userId: user._id, sessionId: session._id });
  return NextResponse.json({ ok: true, token });
}
