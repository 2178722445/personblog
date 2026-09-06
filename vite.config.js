import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import editorPlugin from "./server/editor-plugin.js";

export default defineConfig({
  plugins: [vue(), editorPlugin()],
});
