import mongoose from 'mongoose';
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type:String, unique:true },
  passwordHash: String,
  isVerified: { type:Boolean, default:false },
  otp: { code: String, expiresAt: Date }
}, { timestamps: true });
export default mongoose.models.User || mongoose.model('User', UserSchema);
