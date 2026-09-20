import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import seo from "./seo-plugin.js";

export default defineConfig({
  plugins: [react(), seo()],
  worker: { format: "es" },
  build: { target: "es2022" },
  // Transformers.js ships its own ONNX runtime loader; don't pre-bundle it.
  optimizeDeps: { exclude: ["@huggingface/transformers"] },
});
