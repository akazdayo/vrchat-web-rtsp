# Cloudflare Workers (Terraform)

This module deploys the TanStack Start Worker to Cloudflare and configures the Room Durable Object binding.

## Prerequisites

- Terraform v1.6+
- Cloudflare API token with Workers access
- Build output from `bun run build`

## Usage

```hcl
module "cloudflare_workers" {
	source = "./infra/cloudflare-workers"

	cloudflare_api_token = var.cloudflare_api_token
	account_id = var.account_id
	worker_name = "vrchat-web-rtsp"
	compatibility_date = "2025-01-01"

	# Adjust these if the build output differs.
	worker_content_file = "dist/index.js"
	worker_main_module = "index.js"
	assets_directory = "dist/assets"

	plain_text_env = {
		VITE_WHIP_ENDPOINT = var.vite_whip_endpoint
		VITE_MEDIAMTX_OUTPUT_URL = var.vite_mediamtx_output_url
		VITE_SITE_KEY = var.vite_site_key
	}

	secret_text_env = {
		TURNSTILE_SECRET_KEY = var.turnstile_secret_key
	}

	# Optional: custom route
	zone_id = var.zone_id
	route_pattern = "example.com/*"
}
```

## Variables

- `cloudflare_api_token`: Cloudflare API token.
- `account_id`: Cloudflare account ID.
- `worker_name`: Workers script name.
- `worker_content_file`: Path to built Worker entry (default: `dist/index.js`).
- `worker_main_module`: Module filename for the Worker entry (default: `index.js`).
- `assets_directory`: Optional assets directory for upload (default: `dist/assets`).
- `compatibility_date`: Workers compatibility date.
- `compatibility_flags`: Optional compatibility flags.
- `workers_dev_enabled`: Enable workers.dev subdomain (default: `true`).
- `workers_dev_previews_enabled`: Enable preview URLs (default: `false`).
- `workers_dev_subdomain`: Optional account subdomain used to compute `worker_url` output.
- `zone_id`: Zone ID for routes (optional).
- `route_pattern`: Route pattern like `example.com/*` (optional).
- `durable_object_binding_name`: Durable Object binding name (default: `ROOM`).
- `durable_object_class_name`: Durable Object class name (default: `Room`).
- `plain_text_env`: Map of plain-text bindings.
- `secret_text_env`: Map of secret bindings.

## Outputs

- `worker_script_name`: Script name.
- `workers_dev_enabled`: Whether workers.dev is enabled.
- `workers_route_pattern`: Route pattern, if provided.
- `worker_url`: Derived URL from route or workers.dev subdomain.

## Notes

- Run `bun run build` before applying Terraform so `worker_content_file` exists.
- Map values from `.env` into `plain_text_env` and `secret_text_env`.
