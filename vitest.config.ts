import { fileURLToPath, URL } from "url";
import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";
import { configDefaults } from "vitest/config";

export default defineWorkersConfig({
	test: {
		exclude: [...configDefaults.exclude, ".direnv/**"],
		poolOptions: {
			workers: {
				wrangler: { configPath: "./wrangler.jsonc" },
			},
		},
	},
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
});
