import vinext from "vinext";
import { defineConfig } from "vite";

/**
 * OctoTV runs on Vinext (Next.js App Router on Vite) with the Cloudflare
 * Workers runtime. Configuration is intentionally self-contained: nothing here
 * depends on the retired ChatGPT Sites hosting manifest.
 */
export default defineConfig(async ({ command }) => {
  const { cloudflare } = await import("@cloudflare/vite-plugin");

  const localBindings = {
    main: "./worker/index.ts",
    compatibility_date: "2026-05-15",
    compatibility_flags: ["nodejs_compat"],
    d1_databases: [
      {
        binding: "DB",
        database_name: "octotv-db",
        // Local development placeholder. Production uses the real D1 id.
        database_id: "00000000-0000-4000-8000-000000000000",
      },
    ],
    r2_buckets: [
      {
        binding: "BUCKET",
        bucket_name: "octotv-media",
      },
    ],
  };

  return {
    server: {
      port: 5173,
    },
    plugins: [
      vinext(),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        inspectorPort: false,
        config: localBindings,
      }),
    ],
  };
});
