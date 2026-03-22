import { execFile } from "child_process";
import { promisify } from "util";
import { db, messagesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

const execFileAsync = promisify(execFile);

export async function checkOpenCodeStatus(): Promise<{
  available: boolean;
  version: string | null;
  message: string;
}> {
  try {
    const { stdout } = await execFileAsync("opencode", ["--version"], {
      timeout: 5000,
    });
    return {
      available: true,
      version: stdout.trim() || null,
      message: "OpenCode is available",
    };
  } catch {
    return {
      available: false,
      version: null,
      message: "OpenCode is not installed or not in PATH. Install it with: npm install -g opencode-ai",
    };
  }
}

export async function runOpenCodeQuery(
  userMessage: string,
  projectId: number
): Promise<string> {
  const history = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.projectId, projectId))
    .orderBy(messagesTable.createdAt);

  const historyContext = history
    .slice(-10)
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");

  const prompt = historyContext
    ? `${historyContext}\nUSER: ${userMessage}`
    : userMessage;

  try {
    const { stdout, stderr } = await execFileAsync(
      "opencode",
      ["run", prompt],
      {
        timeout: 60000,
        maxBuffer: 1024 * 1024 * 10,
      }
    );

    if (stderr) {
      logger.warn({ stderr }, "OpenCode stderr output");
    }

    return stdout.trim() || "OpenCode completed without output.";
  } catch (err: unknown) {
    const error = err as { message?: string; stderr?: string; stdout?: string };
    logger.error({ err }, "OpenCode execution failed");

    if (error.stdout && error.stdout.trim()) {
      return error.stdout.trim();
    }

    throw new Error(`OpenCode failed: ${error.message ?? "unknown error"}`);
  }
}
