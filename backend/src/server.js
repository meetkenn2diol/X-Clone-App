// IMPORTS
import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import userRoutes from "./routes/user.route.js";
import postRoutes from "./routes/post.route.js";
import commentRoutes from "./routes/comment.route.js";
import notificationRoutes from "./routes/notification.route.js";
import { ENV } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { arcjetMiddleware } from "./middleware/arcjet.middleware.js";

// CONSTANTS
const app = express();

// MIDDLEWARE
app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());
app.use(arcjetMiddleware); //NOTE: arcjet is not invoked directly -missing braces () so that it is not executed immediately. instead it is passed as a reference to the express middleware.

// ROUTES
app.get("/", (req, res) => res.send("Hello from server"));
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/notifications", notificationRoutes);

// ERROR HANDLING MIDDLEWARE
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

//START SERVER
const startServer = async () => {
  try {
    await connectDB();

    // VERCEL doesn't want the server to listen for local development
    // VERCEL provides the PORT so that the app doesn't have to listen for too long
    // so it can handle many requests at once
    // listen for local development
    if (ENV.NODE_ENV !== "production") {
      app.listen(ENV.PORT, () =>
        console.log("✅ Server is up and running on PORT:", ENV.PORT),
      );
    }
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};
startServer();  

// EXPORT FOR VERCEL
export default app;
