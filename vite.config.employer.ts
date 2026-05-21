import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";

// Vite config for the standalone Employer Portal
// Deploy this to a separate Vercel project (e.g. employer-dist.vercel.app)
//
// Vercel project settings:
//   Build Command:  npx vite build --config vite.config.employer.ts
//   Output Directory: employer-dist
//   Install Command: npm install
export default defineConfig({
  build: {
    outDir: "employer-dist",
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, "employer.html"),
    },
  },
  server: {
    host: "::",
    port: 8081,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    // Rename employer.html → index.html in output so Vercel SPA rewrites work
    {
      name: "rename-employer-html",
      closeBundle() {
        const outDir = path.resolve(__dirname, "employer-dist");
        const src = path.join(outDir, "employer.html");
        const dest = path.join(outDir, "index.html");
        if (fs.existsSync(src)) {
          fs.renameSync(src, dest);
        }
        // Ensure vercel.json with SPA rewrites survives rebuilds
        fs.writeFileSync(
          path.join(outDir, "vercel.json"),
          JSON.stringify({ rewrites: [{ source: "/(.*)", destination: "/index.html" }] }, null, 2) + "\n"
        );
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
