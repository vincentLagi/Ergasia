/// <reference types="vitest" />
import { fileURLToPath, URL } from "url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import environment from "vite-plugin-environment";
import tailwindcss from "@tailwindcss/vite";
import * as dotenv from "dotenv";
import fs from 'fs';
import path from 'path';

dotenv.config({ path: "../../.env" });

export default defineConfig({
  build: {
    emptyOutDir: true,
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },
  server: {
    // Disabled HTTPS for development to avoid mixed content errors with external API
    // https: {
    //   key: fs.readFileSync(path.resolve(__dirname, 'certs/localhost-key.pem')),
    //   cert: fs.readFileSync(path.resolve(__dirname, 'certs/localhost-cert.pem')),
    // },
    proxy: {
      "/api": {
        target: "http://127.0.0.1:4943",
        changeOrigin: true,
      },
      "/advisor-api": {
        target: "http://130.211.124.157:8002",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/advisor-api/, ""),
      },
      "/face-api": {
        target: "http://130.211.124.157:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/face-api/, ""),
      },
    },
    watch: {
      usePolling: true, // Ensures file changes are detected
    }
  },
  plugins: [
    react(),
    environment("all", { prefix: "CANISTER_" }),
    environment("all", { prefix: "DFX_" }),
    environment("all", { prefix: "REACT_APP_" }),
    tailwindcss(),
    {
      name: 'save-file-middleware',
      configureServer(server) {
        // Save uploaded file to project path
        server.middlewares.use('/api/save-file', (req, res, next) => {
          if (req.method !== 'POST') return next();

          const jobId = String(req.headers['x-job-id'] || '');
          const userId = String(req.headers['x-user-id'] || '');
          const filename = String(req.headers['x-filename'] || 'upload.bin');

          if (!jobId || !userId || !filename) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Missing headers x-job-id, x-user-id, x-filename' }));
            return;
          }

          const baseDir = path.resolve(__dirname, 'src/shared/FreelancerAnswer', jobId, userId);
          fs.mkdirSync(baseDir, { recursive: true });
          const filePath = path.join(baseDir, filename);
          const writeStream = fs.createWriteStream(filePath);

          req.pipe(writeStream);
          writeStream.on('finish', () => {
            const projectRoot = path.resolve(__dirname, '..', '..');
            const relativePath = path
              .relative(projectRoot, filePath)
              .split(path.sep)
              .join('/');
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ path: relativePath }));
          });
          writeStream.on('error', (err) => {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
          });
        });

        // Download a previously saved file by its repo-relative path
        server.middlewares.use('/api/download-file', (req, res, next) => {
          if (req.method !== 'GET') return next();
          try {
            const url = new URL(req.url!, 'http://localhost');
            const relPath = url.searchParams.get('path') || '';
            if (!relPath || relPath.includes('..')) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Invalid path' }));
              return;
            }

            const projectRoot = path.resolve(__dirname, '..', '..');
            const absPath = path.resolve(projectRoot, relPath);
            if (!absPath.startsWith(projectRoot) || !fs.existsSync(absPath)) {
              res.statusCode = 404;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'File not found' }));
              return;
            }

            const filename = path.basename(absPath);
            const stat = fs.statSync(absPath);

            res.setHeader('Content-Type', 'application/octet-stream');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Length', stat.size);

            const readStream = fs.createReadStream(absPath);
            readStream.pipe(res);

            readStream.on('error', (err) => {
              console.error("Stream error:", err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message }));
            });

          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message || 'Unknown error' }));
          }
        });
      },
    },
  ],
  test: {
    environment: "jsdom",
    setupFiles: "src/setupTests.js",
  },
  resolve: {
    alias: {
      declarations: fileURLToPath(
        new URL("../declarations", import.meta.url)
      ),
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
    dedupe: [],
    extensions: [".js", ".jsx", ".ts", ".tsx"],
  },
});
