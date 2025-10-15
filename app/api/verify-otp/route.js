import { NextResponse } from 'next/server';
import { connect } from '../_utils/db';
import User from '../../../models/User';
export async function POST(req) {
  await connect();
  const { email, otp } = await req.json();
  if (!email || !otp) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  const user = await User.findOne({ email });
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!user.otp || user.otp.code !== String(otp)) return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
  if (new Date() > new Date(user.otp.expiresAt)) return NextResponse.json({ error: 'OTP expired' }, { status: 400 });
  user.isVerified = true; user.otp = null; await user.save();
  return NextResponse.json({ ok: true });
}
