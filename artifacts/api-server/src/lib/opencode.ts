import { execFile } from "child_process";
import { promisify } from "util";
import { db, messagesTable, projectsTable } from "@workspace/db";
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
      timeout: 10000,
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
      message: "OpenCode is not installed or not in PATH.",
    };
  }
}

export async function runOpenCodeQuery(
  userMessage: string,
  projectId: number
): Promise<string> {
  const [project] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, projectId));

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
    const args = ["run", prompt];
    if (project?.model) {
      args.push("-m", project.model);
    }
    
    // Add optimization flags
    args.push("--format", "json");
    args.push("--log-level", "ERROR");

    const { stdout, stderr } = await execFileAsync(
      "opencode",
      args,
      {
        timeout: 120000,
        maxBuffer: 1024 * 1024 * 50, // 50MB for large plan outputs
      }
    );

    if (stderr) {
      logger.warn({ stderr }, "OpenCode stderr output");
    }

    if (stdout.trim().startsWith("{")) {
       try {
         const parsed = JSON.parse(stdout);
         return parsed.response || parsed.content || stdout.trim();
       } catch (e) {
         return stdout.trim();
       }
    }

    return stdout.trim() || "OpenCode completed without output.";
  } catch (err: unknown) {
    const error = err as { message?: string; stderr?: string; stdout?: string };
    logger.error({ 
      err: error.message, 
      stderr: error.stderr, 
      stdout: error.stdout 
    }, "OpenCode execution failed");

    if (error.stdout && error.stdout.trim()) {
      return error.stdout.trim();
    }

    throw new Error(`OpenCode failed (stderr: ${error.stderr ?? "none"}): ${error.message ?? "unknown error"}`);
  }
}
