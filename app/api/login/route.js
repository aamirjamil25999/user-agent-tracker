import { NextResponse } from "next/server";
import { connect } from "../_utils/db";
import User from "../../../models/User";
import bcrypt from "bcryptjs";
import { signJWT } from "../_utils/auth";

export async function POST(req) {
  await connect();
  const { email, password } = await req.json();

  const user = await User.findOne({ email });
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match)
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });

  // ✅ Include email in JWT payload
  const token = signJWT({
    userId: user._id,
    email: user.email, // 👈 important
  });

  return NextResponse.json({
    ok: true,
    token,
    user: { id: user._id, name: user.name, email: user.email },
  });
}