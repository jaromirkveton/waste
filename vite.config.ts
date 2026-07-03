import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      manifest: {
        name: "Odpady Praha",
        short_name: "Odpady",
        description: "Rychlý přehled kontejnerů na tříděný odpad v Praze",
        theme_color: "#F7F7F7",
        background_color: "#F7F7F7",
        display: "standalone",
        start_url: "/",
        lang: "cs",
        icons: [
          {
            src: "favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
        ],
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
  },
});
