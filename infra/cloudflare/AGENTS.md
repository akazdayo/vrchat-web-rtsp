# CLOUDFLARE INFRA KNOWLEDGE BASE

## OVERVIEW
`infra/cloudflare` manages Cloudflare-side infrastructure; worker code deploy remains Wrangler-owned.

## STRUCTURE
```text
cloudflare/
├── main.tf            # Provider + resources
├── variables.tf       # Input contract
├── outputs.tf         # Exported identifiers
├── README.md          # Operator workflow
└── cf-terraforming.sh # Resource import helper
```

## WHERE TO LOOK
| Task | Location | Notes |
|---|---|---|
| Provider/resources | `main.tf` | custom domain + Turnstile widget |
| Inputs | `variables.tf` | account, zone, service, hostname |
| Outputs | `outputs.tf` | domain/service/widget identifiers |
| Operational workflow | `README.md` | env vars + terraform sequence |
| Existing import helper | `cf-terraforming.sh` | baseline resource sync |

## CONVENTIONS
- Terraform version floor is `>= 1.6`; provider is `cloudflare/cloudflare` `~> 5.16`.
- Defaults align with `wrangler.jsonc` worker service/hostname values.
- Apply order assumes worker service already exists (`pnpm run deploy` once).
- Terraform scope here is infra bindings; Durable Object script lifecycle stays in Wrangler.

## ANTI-PATTERNS
- Do not attempt worker script deployment from this Terraform module.
- Do not commit `.terraform` directories or state artifacts.
- Do not change hostname/service variables without checking `wrangler.jsonc` route parity.
- Do not rotate Turnstile domain settings without syncing app env/site key rollout.

## NOTES
- Keep this module limited to Cloudflare-side bindings and widgets.
- Validate worker route/domain parity before `terraform apply`.
