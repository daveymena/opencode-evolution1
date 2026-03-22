import app from "./app";
import { logger } from "./lib/logger";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "@workspace/db";
import path from "path";
import fs from "fs";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const isProd = process.env.NODE_ENV === "production";
const migrationsFolder = isProd 
  ? path.join(process.cwd(), "lib/db/drizzle") 
  : path.join(process.cwd(), "../../lib/db/drizzle");

async function startServer() {
  try {
    if (fs.existsSync(migrationsFolder)) {
      logger.info({ migrationsFolder }, "Running database migrations...");
      await migrate(db, { migrationsFolder });
      logger.info("Database migrations completed successfully.");
    } else {
      logger.warn({ migrationsFolder }, "Migrations folder not found. Skipping auto-migration.");
    }
  } catch (error) {
    logger.error({ error }, "Failed to run database migrations");
  }

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port }, "Server listening");
  });
}

startServer();
