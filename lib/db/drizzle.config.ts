import { defineConfig } from "drizzle-kit";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  schema: [
    "./src/schema/users.ts",
    "./src/schema/projects.ts",
    "./src/schema/userApiKeys.ts",
    "./src/schema/messages.ts",
    "./src/schema/files.ts",
  ],
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
