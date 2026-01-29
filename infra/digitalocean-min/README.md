# DigitalOcean Droplet (Minimal Terraform)

This module provisions a single DigitalOcean droplet with the smallest possible configuration.

## Usage

```hcl
module "droplet" {
	source = "./infra/digitalocean-min"

	do_token     = var.do_token
	ssh_key_name = var.ssh_key_name

	region        = "sgp1"
	droplet_size  = "s-1vcpu-1gb"
	droplet_name  = "app"
	custom_image_url = "https://github.com/hraban/nixos-images/releases/download/latest/nixos-digitalocean-x86_64-linux.qcow.gz"
}
```

## Variables

- `do_token`: DigitalOcean API token.
- `ssh_key_name`: Existing SSH key name.
- `region`: DigitalOcean region (default: `sgp1`).
- `droplet_size`: Droplet size slug (default: `s-1vcpu-1gb`).
- `droplet_name`: Droplet name (default: `app`).
- `custom_image_url`: Custom image URL (default: NixOS DigitalOcean qcow image).

## Outputs

- `droplet_id`: Droplet ID.
- `droplet_name`: Droplet name.
- `droplet_ipv4`: Public IPv4 address.
