// models/Session.js
import mongoose from 'mongoose';

const InactivitySchema = new mongoose.Schema(
  { startTime: Date, endTime: Date },
  { _id: false }
);

const SessionSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  loginTime:  { type: Date, required: true },
  logoutTime: { type: Date },
  lastPing:   { type: Date },
  inactivityLogs: { type: [InactivitySchema], default: [] },
}, { timestamps: true });

export default mongoose.models.Session || mongoose.model('Session', SessionSchema);