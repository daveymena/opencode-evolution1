import express from "express";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { fork } from "child_process";
import { createProxyMiddleware } from "http-proxy-middleware";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const PORT = process.env.PORT || 3000;
const API_PORT = process.env.API_PORT || 3001;

// 1. Spawn the backend API Server
console.log("Starting backend API server...");
const apiProcess = fork(join(__dirname, "artifacts/api-server/dist/index.mjs"), [], {
  env: {
    ...process.env,
    PORT: API_PORT,
    NODE_ENV: "production"
  }
});

apiProcess.on("error", (err) => {
  console.error("Failed to start API server:", err);
});

apiProcess.on("exit", (code) => {
  console.log(`API server exited with code ${code}`);
});

// 2. Start the Frontend Server & Proxy
const app = express();
const frontendDist = join(__dirname, "artifacts/opencode-evolved/dist/public");

app.use(express.static(frontendDist));

app.use("/api", createProxyMiddleware({
  target: `http://localhost:${API_PORT}`,
  changeOrigin: true,
}));

// SPA fallback
app.get("/*splat", (_req, res) => {
  res.sendFile(join(frontendDist, "index.html"));
});

app.listen(PORT, () => {
  console.log(`OpenCode Evolved Frontend + Proxy serving on port ${PORT}`);
});

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  apiProcess.kill("SIGTERM");
  process.exit(0);
});
