import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Lightning CSS compiles the shared @custom-media breakpoints from
  // @cckarchev/shared/breakpoints.css, which media queries need since they
  // cannot read custom properties.
  css: {
    transformer: "lightningcss",
    lightningcss: {
      cssModules: {
        pattern: "[local]_[hash]",
      },
      drafts: {
        customMedia: true,
      },
    },
  },
  build: {
    cssMinify: "lightningcss",
  },
  test: {
    restoreMocks: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
