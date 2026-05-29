# DIGITALOCEAN INFRA KNOWLEDGE BASE

## OVERVIEW
`infra/digitalocean-min` provisions the droplet/firewall layer and delegates runtime services to `nix/`.

## STRUCTURE
```text
digitalocean-min/
├── main.tf      # Custom image + droplet + firewall
├── variables.tf # Input variables
├── outputs.tf   # Droplet outputs
├── README.md    # Module usage
└── nix/         # Host/service runtime definitions
```

## WHERE TO LOOK
| Task | Location | Notes |
|---|---|---|
| Provider/module/resources | `main.tf` | custom image + droplet module + firewall |
| Inputs | `variables.tf` | token, SSH key, region, size, image URL |
| Outputs | `outputs.tf` | droplet id/name/ipv4 |
| Usage contract | `README.md` | expected module wiring |
| Service runtime subtree | `nix/` | MediaMTX + Caddy NixOS config |

## CONVENTIONS
- Terraform version floor is `>= 1.6`; provider is `digitalocean/digitalocean` `~> 2.74`.
- Droplet provisioning uses pinned module `terraform-do-modules/droplet/digitalocean` `1.0.1`.
- Firewall rules intentionally expose 22/80/443/8554; service configs assume those ports.
- Nix service behavior is defined in `nix/`; keep Terraform and Nix changes coordinated.

## ANTI-PATTERNS
- Do not hardcode API tokens or SSH secrets in Terraform files.
- Do not change firewall ports without corresponding MediaMTX/Caddy validation.
- Do not update module version blindly without reviewing schema/output changes.
- Do not bypass `nix/` when making runtime service behavior changes.

## NOTES
- Terraform here manages host shape and network exposure, not app runtime behavior.
- Runtime service edits belong in `nix/AGENTS.md` scope.
