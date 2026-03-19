import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function serveStatic(app) {
  const distPath = path.resolve(__dirname, "../dist/public");
  if (!fs.existsSync(distPath)) {
    console.warn("No dist/public folder found — run build first");
    return;
  }
  app.use(express.static(distPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
