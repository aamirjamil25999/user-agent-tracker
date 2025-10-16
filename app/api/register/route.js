import { NextResponse } from "next/server";
import { connect } from "../_utils/db";
import User from "../../../models/User";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    await connect();
    const { name, email, password } = await req.json();

    // 🔹 Check existing user
    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    // 🔹 Hash password securely
    const passwordHash = await bcrypt.hash(password, 10);

    // 🔹 Generate OTP
    const code = Math.floor(100000 + Math.random() * 900000);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    // 🔹 Save user (unverified initially)
    await User.create({
      name,
      email,
      passwordHash,
      otp: { code, expiresAt },
      isVerified: false,
    });

    // 🔹 Email transporter (Gmail + App Password)
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE, // gmail
      host: process.env.EMAIL_HOST,       // smtp.gmail.com
      port: process.env.EMAIL_PORT,       // 465
      secure: true,                       // true for SSL
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 🔹 Send OTP
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Your OTP Code - User Verification",
      text: `Hi ${name || ""},\n\nYour OTP is ${code}. It expires in 5 minutes.\n\nThank you,\nAgent Activity Tracker`,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log("✅ OTP mail sent to:", email);
    } catch (mailErr) {
      console.error("❌ Mail send error:", mailErr.message);
      return NextResponse.json({ error: "Failed to send OTP email" }, { status: 500 });
    }

    return NextResponse.json({ message: "OTP sent to your email" }, { status: 200 });
  } catch (err) {
    console.error("❌ Registration error:", err.message);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}