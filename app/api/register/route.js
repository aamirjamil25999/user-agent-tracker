import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { connect } from '../_utils/db';
import User from '../../../models/User';
import { sendOTP } from '../_utils/mail';
export async function POST(req) {
  await connect();
  const { name, email, password } = await req.json();
  if (!name || !email || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  const existing = await User.findOne({ email });
  if (existing) return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
  const passwordHash = await bcrypt.hash(password, 10);
  const otp = Math.floor(100000 + Math.random()*900000).toString();
  const expiresAt = new Date(Date.now() + 1000*60*15);
  const user = await User.create({ name, email, passwordHash, otp: { code: otp, expiresAt } });
  await sendOTP(email, otp);
  return NextResponse.json({ ok: true, message: 'Registered. Check email for OTP.' });
}
