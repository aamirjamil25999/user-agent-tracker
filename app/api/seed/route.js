
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { connect } from '../_utils/db';
import User from '../../../models/User';
import Visit from '../../../models/Visit';

export async function GET() {
  await connect();

  // Agar pehle se 10+ agents hain to skip
  const count = await User.countDocuments({ role: 'agent' });
  if (count >= 10) {
    return NextResponse.json({ ok: true, message: 'Agents already seeded' });
  }

  // 10 agents as Users
  const agents = [];
  for (let i = 1; i <= 10; i++) {
    const passwordHash = await bcrypt.hash('password123', 10);
    agents.push({
      name: `Agent ${i}`,
      email: `agent${i}@example.com`,
      passwordHash,
      role: 'agent',
      isVerified: true,
    });
  }
  const created = await User.insertMany(agents);

  // 1–2 visits today per agent
  const visits = [];
  const today = new Date();
  for (const agent of created) {
    const count = Math.random() > 0.5 ? 2 : 1;
    for (let j = 0; j < count; j++) {
      const start = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        9 + Math.floor(Math.random() * 8), // hour 9..16
        Math.floor(Math.random() * 60)     // minutes 0..59
      );
      const end = new Date(start.getTime() + (30 + Math.floor(Math.random() * 90)) * 60000); // 30..120 min
      visits.push({ agentId: agent._id, site: `Client ${Math.floor(Math.random() * 50) + 1}`, startTime: start, endTime: end });
    }
  }
  await Visit.insertMany(visits);

  return NextResponse.json({ ok: true, message: '10 agents (users) + visits seeded' });
}