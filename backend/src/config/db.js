import mongoose from "mongoose";
import { ENV } from "./env.js";

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = {
    conn: null,
    promise: null,
  };
}

export const connectDB = async () => {
  if (cached.conn) return cached.conn;
  if (!cached.promise) cached.promise = mongoose.connect(ENV.MONGO_URI);

  try {
    cached.conn = await cached.promise;
    console.log("✅ Connected to DB SUCCESSFULLY");
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    console.error("❌ Error connecting to MONGODB:", error);
    throw error;
  }
};
