// Run with: node scripts/seed.mjs
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Agent from '../models/Agent.js';
import Visit from '../models/Visit.js';

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://aamirjamil259999:aamir%40123@testing.so85ftf.mongodb.net/testing123?retryWrites=true&w=majority';

async function main() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear old data safely
    await mongoose.connection.db.dropCollection('agents').catch(() => {});
    await mongoose.connection.db.dropCollection('visits').catch(() => {});

    const agents = [];
    for (let i = 1; i <= 10; i++) {
      agents.push({
        name: `Agent ${i}`,
        email: `agent${i}@example.com`,
        phone: '9000000' + String(100 + i),
      });
    }

    const createdAgents = await Agent.insertMany(agents);

    const visits = [];
    const today = new Date();

    createdAgents.forEach((agent) => {
      const count = Math.random() > 0.5 ? 2 : 1;
      for (let j = 0; j < count; j++) {
        const start = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          9 + Math.floor(Math.random() * 8),
          Math.floor(Math.random() * 60)
        );
        const end = new Date(
          start.getTime() + (20 + Math.floor(Math.random() * 120)) * 60000
        );
        visits.push({
          agentId: agent._id,
          site: 'Site ' + (Math.floor(Math.random() * 20) + 1),
          startTime: start,
          endTime: end,
        });
      }
    });

    const createdVisits = await Visit.insertMany(visits);

    // Attach visits to agents
    for (const v of createdVisits) {
      await Agent.findByIdAndUpdate(v.agentId, {
        $push: { assignedVisits: v._id },
      });
    }

    console.log('✅ Seeded agents and visits successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during seed:', err);
    process.exit(1);
  }
}

main();
