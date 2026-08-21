import { connectDB } from "../config/db.js";

const databaseMiddleware = async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
};

export default databaseMiddleware;
