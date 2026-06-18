import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const input = process.env.TILDA_INPUT;
  const outDir = process.env.TILDA_OUT_DIR;

  if (!input || !outDir) {
    throw new Error("TILDA_INPUT and TILDA_OUT_DIR are required for Tilda inline build");
  }

  return {
    base: "./",
    mode,
    plugins: [
      react(),
      tailwindcss({ important: "#root" }),
      viteSingleFile({ removeViteModuleLoader: true }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@intech-atom/in1": path.resolve(__dirname, "../api/src/lib/in1AllowableStress.ts"),
      },
    },
    define: {
      "import.meta.env.VITE_HANDBOOK_DATA": JSON.stringify(""),
      "import.meta.env.VITE_EMBED_GUARD": JSON.stringify("false"),
    },
    build: {
      outDir: path.resolve(__dirname, outDir),
      emptyOutDir: true,
      cssCodeSplit: false,
      rollupOptions: {
        input: path.resolve(__dirname, input),
      },
    },
  };
});
