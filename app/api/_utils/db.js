import mongoose from 'mongoose';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://aamirjamil259999:aamir%40123@testing.so85ftf.mongodb.net/testing123?retryWrites=true&w=majority';
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}
export async function connect() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    if (!MONGODB_URI) throw new Error('MONGODB_URI not defined');
    cached.promise = mongoose.connect(MONGODB_URI).then(m=>m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
