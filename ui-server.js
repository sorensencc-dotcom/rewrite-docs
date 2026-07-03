// ui-server.js - Express server for React dashboard
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3002;

// Serve static files (built React app)
app.use(express.static(path.join(__dirname, "build")));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Metrics endpoint
app.get("/metrics", (req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
    service: "cic-ui",
    status: "ok"
  });
});

// Serve React app for all other routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.listen(PORT, () => {
  console.log(`CIC UI Dashboard listening on port ${PORT}`);
  console.log(`Open http://localhost:${PORT}`);
});
