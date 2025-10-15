import mongoose from "mongoose";

const VisitSchema = new mongoose.Schema({
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: "Agent", required: true },
  site: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
});

export default mongoose.models.Visit || mongoose.model("Visit", VisitSchema);