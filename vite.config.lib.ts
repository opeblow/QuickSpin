import { resolve } from "node:path";
import { defineConfig } from "vite";

/** ESM + CJS bundles of the SDK and the optional React entry. */
export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: true,
    lib: {
      entry: {
        index: resolve(__dirname, "src/sdk/index.ts"),
        react: resolve(__dirname, "src/react/QuickSpinWidget.tsx"),
      },
      formats: ["es", "cjs"],
      fileName: (format, entryName) => {
        const base = entryName === "index" ? "quickspin" : "quickspin-react";
        return format === "es" ? `${base}.js` : `${base}.cjs`;
      },
    },
    rollupOptions: {
      external: ["react", "react-dom", /^react\//, /^react-dom\//],
    },
  },
});