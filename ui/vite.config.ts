import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import * as path from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: path.resolve(__dirname, "../dist/public"),
    emptyOutDir: true,
  },
  server: {
    port: 5174,
    proxy: {
      "/api": "http://localhost:3333",
      "/sse": "http://localhost:3333",
      "/tools": "http://localhost:3333",
      "/call": "http://localhost:3333",
      "/health": "http://localhost:3333",
    },
  },
});
