import mongoose from "mongoose";

// 🕓 For tracking inactivity periods
const InactivitySchema = new mongoose.Schema(
  {
    startTime: { type: Date },
    endTime: { type: Date },
  },
  { _id: false }
);

const SessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    loginTime: { type: Date, required: true },
    logoutTime: { type: Date },
    lastPing: { type: Date, default: Date.now }, // 🔹 for detecting inactivity
    isActive: { type: Boolean, default: true }, // ✅ active = true until logout
    inactivityLogs: { type: [InactivitySchema], default: [] }, // 🔹 logs of inactivity
  },
  { timestamps: true }
);

export default mongoose.models.Session ||
  mongoose.model("Session", SessionSchema);