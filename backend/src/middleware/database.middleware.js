import { connectDB } from "../config/db.js";

// Middleware for serverless deployments (Vercel)
const databaseMiddleware = async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
};

export default databaseMiddleware;
