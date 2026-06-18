import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const input = process.env.TILDA_INPUT;
  const outDir = process.env.TILDA_OUT_DIR;

  if (!input || !outDir) {
    throw new Error("TILDA_INPUT and TILDA_OUT_DIR are required for Tilda build");
  }

  return {
    base: "./",
    mode,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@intech-atom/in1": path.resolve(__dirname, "../api/src/lib/in1AllowableStress.ts"),
      },
    },
    define: {
      "import.meta.env.VITE_HANDBOOK_DATA": JSON.stringify("./data/pnae-steel-properties.json"),
      "import.meta.env.VITE_EMBED_GUARD": JSON.stringify("true"),
    },
    build: {
      outDir: path.resolve(__dirname, outDir),
      emptyOutDir: true,
      rollupOptions: {
        input: path.resolve(__dirname, input),
      },
    },
  };
});
