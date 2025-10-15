// Run with: node scripts/seed.js
const mongoose = require('mongoose');
const Agent = require('../models/Agent').default;
const Visit = require('../models/Visit').default;

// const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://aamirjamil259999:aamir@123@testing.so85ftf.mongodb.net/?retryWrites=true&w=majority&appName=testing';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://aamirjamil259999:aamir%40123@testing.so85ftf.mongodb.net/testing123?retryWrites=true&w=majority';

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');
  await Agent.deleteMany({});
  await Visit.deleteMany({});

  const agents = [];
  for (let i=1;i<=10;i++){
    agents.push({
      name: 'Agent ' + i,
      email: `agent${i}@example.com`,
      phone: '9000000' + String(100 + i)
    });
  }
  const createdAgents = await Agent.insertMany(agents);
  const visits = [];
  const today = new Date();
  createdAgents.forEach(agent => {
    // 1-2 visits per agent
    const count = Math.random() > 0.5 ? 2 : 1;
    for (let j=0;j<count;j++){
      const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9 + Math.floor(Math.random()*8), Math.floor(Math.random()*60));
      const end = new Date(start.getTime() + (20 + Math.floor(Math.random()*120)) * 60000);
      visits.push({ agentId: agent._id, site: 'Site ' + (Math.floor(Math.random()*20)+1), startTime: start, endTime: end });
    }
  });
  const createdVisits = await Visit.insertMany(visits);
  // attach visits to agents
  for (const v of createdVisits) {
    await Agent.findByIdAndUpdate(v.agentId, { $push: { assignedVisits: v._id } });
  }
  console.log('Seeded agents and visits');
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
