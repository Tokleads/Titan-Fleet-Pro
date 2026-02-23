import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

function getDistPath(): string {
  if (process.env.NODE_ENV === "production") {
    return path.resolve(process.cwd(), "dist", "public");
  }
  
  try {
    if (typeof __dirname !== "undefined") {
      return path.resolve(__dirname, "public");
    }
  } catch {
  }
  
  try {
    const currentFilePath = fileURLToPath(import.meta.url);
    const currentDir = path.dirname(currentFilePath);
    return path.resolve(currentDir, "public");
  } catch {
  }
  
  return path.resolve(process.cwd(), "dist", "public");
}

export function serveStatic(app: Express) {
  const distPath = getDistPath();
  
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use("/assets", express.static(path.join(distPath, "assets"), {
    maxAge: "1y",
    immutable: true,
  }));

  app.use("/videos", express.static(path.join(distPath, "videos"), {
    maxAge: "1d",
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.mp4')) {
        res.setHeader('Content-Type', 'video/mp4');
      }
    },
  }));

  app.use(express.static(distPath, {
    maxAge: 0,
    etag: true,
    lastModified: true,
  }));

  app.use("*", (_req, res) => {
    res.set({
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    });
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
