import { resolve } from "node:path";
import { defineConfig } from "vite";

/** IIFE bundle: quick drop-in global `window.QuickSpin` + `[data-quickspin]` init. */
export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, "src/sdk/index.ts"),
      name: "QuickSpin",
      formats: ["iife"],
      fileName: () => "quickspin.iife.js",
    },
  },
});