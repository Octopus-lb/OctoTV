import vinext from "vinext";
import { defineConfig } from "vite";

/**
 * OctoTV runs on Vinext (Next.js App Router on Vite) with the Cloudflare
 * Workers runtime. Configuration is intentionally self-contained: nothing here
 * depends on the retired ChatGPT Sites hosting manifest.
 */
export default defineConfig(async () => {
  const { cloudflare } = await import("@cloudflare/vite-plugin");

  const localBindings = {
    main: "./worker/index.ts",
    ...(process.env.CLOUDFLARE_ACCOUNT_ID
      ? { account_id: process.env.CLOUDFLARE_ACCOUNT_ID }
      : {}),
    compatibility_date: "2026-05-15",
    compatibility_flags: ["nodejs_compat"],
    d1_databases: [
      {
        binding: "DB",
        database_name: "octotv-db",
        // Local development placeholder. Production uses the real D1 id.
        // Production deploys must provide the existing D1 database ID.
        database_id:
          process.env.CLOUDFLARE_D1_DATABASE_ID ??
          "00000000-0000-4000-8000-000000000000",
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
