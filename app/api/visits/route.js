import { NextResponse } from "next/server";
import { connect } from "../_utils/db";
import Visit from "../../../models/Visit";
import { verifyToken } from "../_utils/auth";

export async function POST(req) {
  await connect();

  const authHeader = req.headers.get("authorization");
  if (!authHeader)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let payload;
  try {
    payload = verifyToken(authHeader.replace("Bearer ", ""));
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const { site, startTime, endTime } = await req.json();

  if (!site)
    return NextResponse.json({ error: "Site name required" }, { status: 400 });

  const visit = await Visit.create({
    agentId: payload.userId,
    site,
    startTime: startTime ? new Date(startTime) : new Date(),
    endTime: endTime ? new Date(endTime) : new Date(),
  });

  return NextResponse.json({ ok: true, visit });
}