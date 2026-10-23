import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import svelte from "@astrojs/svelte";

export default defineConfig({
  site: "https://armaanleg3nd.github.io",
  output: "static",
  integrations: [mdx(), svelte()],
  vite: {
    server: {
      allowedHosts: ["zapped.pancake-trench.ts.net"]
    }
  },
  build: {
    assets: "_assets"
  }
});
