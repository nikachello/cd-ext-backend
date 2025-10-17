import dotenv from "dotenv";
dotenv.config();

export const PORT = process.env.PORT || 3005;

if (!process.env.DATABASE_URL) {
  console.warn("⚠️  DATABASE_URL is missing");
}
