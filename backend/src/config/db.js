import mongoose from "mongoose";
import { ENV } from "./env.js";

// FOR A TRADITIONAL NODE/EXPRESS SERVER
// export const connectDB = async () => {
//   try {
//     await mongoose.connect(ENV.MONGO_URI);
//     console.log("✅ Connected to DB SUCCESSFULLY");
//   } catch (error) {
//     console.log(`❌ Error connecting to MONGODB: ${error}`);
//     process.exit(1);
//   }
// };


// FOR SERVERLESS DEPLOYMENTS like Vercel USE CACHED CONNECTION
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
