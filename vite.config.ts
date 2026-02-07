import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // Prevent "Invalid hook call" issues caused by duplicated React copies
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    // Ensure Vite pre-bundles a single React instance for all deps (Radix, etc.)
    include: ["react", "react-dom"],
  },
}));
