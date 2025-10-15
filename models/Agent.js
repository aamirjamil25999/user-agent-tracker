import mongoose from 'mongoose';
const AgentSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  assignedVisits: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Visit' }]
});
export default mongoose.models.Agent || mongoose.model('Agent', AgentSchema);
