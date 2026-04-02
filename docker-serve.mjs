import express from "express";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createProxyMiddleware } from "http-proxy-middleware";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const PORT = process.env.PORT || 3000;
const API_URL = process.env.API_URL || "http://localhost:3001";

// Create Express app
const app = express();
const frontendDist = join(__dirname, "artifacts/opencode-evolved/dist");

// Serve static frontend files
app.use(express.static(frontendDist));

// Proxy API requests to backend service
app.use("/api", createProxyMiddleware({
  target: API_URL,
  changeOrigin: true,
  ws: true,
  logger: console,
  onProxyRes: (proxyRes, req, res) => {
    proxyRes.headers["Access-Control-Allow-Origin"] = "*";
    proxyRes.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, PATCH, OPTIONS";
    proxyRes.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization";
  },
}));

// SPA fallback for all non-API routes
app.get("*", (_req, res) => {
  res.sendFile(join(frontendDist, "index.html"));
});

// Error handling middleware
app.use((err, _req, res, _next) => {
  console.error("Error:", err);
  res.status(500).json({ 
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined
  });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ OpenCode Evolved Frontend + Proxy listening on port ${PORT}`);
  console.log(`📡 API URL: ${API_URL}`);
  console.log(`🌐 Frontend: http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/healthz`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received, shutting down gracefully...");
  process.exit(0);
});
