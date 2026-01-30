#!/usr/bin/env bash
set -euo pipefail

: "${CLOUDFLARE_API_TOKEN:?Set CLOUDFLARE_API_TOKEN}"
: "${CLOUDFLARE_ACCOUNT_ID:?Set CLOUDFLARE_ACCOUNT_ID}"

if [[ -n "${CLOUDFLARE_ZONE_ID-}" ]]; then
	unset CLOUDFLARE_ZONE_ID
fi

cf-terraforming generate \
  --resource-type cloudflare_workers_custom_domain \
  --account "${CLOUDFLARE_ACCOUNT_ID}" \
  --token "${CLOUDFLARE_API_TOKEN}" \
  > generated.tf

cf-terraforming import \
  --resource-type cloudflare_workers_custom_domain \
  --account "${CLOUDFLARE_ACCOUNT_ID}" \
  --token "${CLOUDFLARE_API_TOKEN}" \
  --modern-import-block \
  > imports.tf
