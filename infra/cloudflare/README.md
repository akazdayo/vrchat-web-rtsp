# Cloudflare Workers (Terraform)

This configuration manages Cloudflare-side infrastructure for the VRChat Worker.
The Worker script itself remains deployed by Wrangler; Terraform only manages
infrastructure such as the custom domain binding.

## Requirements

- Terraform >= 1.6
- cf-terraforming
- Cloudflare API token with Workers + Zone permissions

## Usage

```bash
cd infra/cloudflare

export CLOUDFLARE_API_TOKEN="your-api-token"
export CLOUDFLARE_ACCOUNT_ID="your-account-id"
export CLOUDFLARE_ZONE_ID="your-zone-id"

export TF_VAR_cloudflare_api_token="$CLOUDFLARE_API_TOKEN"
export TF_VAR_cloudflare_account_id="$CLOUDFLARE_ACCOUNT_ID"
export TF_VAR_cloudflare_zone_id="$CLOUDFLARE_ZONE_ID"

terraform init
./cf-terraforming.sh
terraform plan
terraform apply
```

## Notes

- Defaults are based on `wrangler.jsonc` for `worker_service` and
  `worker_hostname`.
- Ensure the Worker service exists before applying (run `bun run deploy` once
  if it has never been deployed).
- Durable Objects and the Worker script remain managed by Wrangler.
