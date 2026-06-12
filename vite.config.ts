import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";

const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [
    react(),
    tailwindcss(),
    visualizer({
      filename: "dist/bundle-report.html",
      gzipSize: true,
      brotliSize: true,
      template: "treemap",
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            if (id.includes("leaflet")) return "vendor-leaflet";
            if (id.includes("framer-motion")) return "vendor-motion";
            if (id.includes("gsap")) return "vendor-gsap";
            if (id.includes("react-router")) return "vendor-router";
            if (id.includes("lucide-react")) return "vendor-lucide";
            if (id.includes("@supabase")) return "vendor-supabase";
            if (id.includes("zustand")) return "vendor";
            // React, react-dom, scheduler, and react-is share a single
            // chunk because they are all pulled in by every route.
            return "vendor";
          }
          return undefined;
        },
      },
    },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // Polling avoids ENOSPC on environments with a low native watcher limit.
      usePolling: true,
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
    // The Android WebView defaults to Referrer-Policy
    // "strict-origin-when-cross-origin", which strips the path off any
    // cross-origin request and surfaces a "strict-origin-when-cross-origin
    // on local testing" hint in the Chrome devtools console. Send an
    // explicit header from the dev server so the WebView uses the same
    // policy on every response.
    headers: {
      "Referrer-Policy": "no-referrer-when-downgrade",
    },
  },
}));
