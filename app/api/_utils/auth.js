import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "change-me";

// 🔹 Generate JWT Token
export function signJWT(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "8h" });
}

// 🔹 Verify JWT Token
export function verifyJWT(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    console.error("❌ Invalid Token:", err.message);
    return null;
  }
}

// ✅ Optional backward compatibility (for older imports)
export const signToken = signJWT;
export const verifyToken = verifyJWT;