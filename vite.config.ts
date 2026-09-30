import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tanstackStart({ server: { entry: "server" } }), react(), tailwindcss()],
  resolve: { tsconfigPaths: true },
  server: { host: "127.0.0.1", port: 5173 },
});
