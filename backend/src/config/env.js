import dotenv from "dotenv";

dotenv.config();

// Helper Function
const getRequiredEnv = (key) => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
};

// Object Export
export const ENV = {
  PORT: getRequiredEnv("PORT"),
  NODE_ENV: getRequiredEnv("NODE_ENV"),
  MONGO_URI: getRequiredEnv("MONGO_URI"),
  CLERK_PUBLISHABLE_KEY: getRequiredEnv("CLERK_PUBLISHABLE_KEY"),
  CLERK_SECRET_KEY: getRequiredEnv("CLERK_SECRET_KEY"),
  CLOUDINARY_CLOUD_NAME: getRequiredEnv("CLOUDINARY_CLOUD_NAME"),
  CLOUDINARY_API_KEY: getRequiredEnv("CLOUDINARY_API_KEY"),
  CLOUDINARY_API_SECRET: getRequiredEnv("CLOUDINARY_API_SECRET"),
  ARCJET_KEY: getRequiredEnv("ARCJET_KEY"),
};
