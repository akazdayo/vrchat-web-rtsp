# MediaMTX on DigitalOcean (Terraform)

This module provisions a single DigitalOcean droplet with MediaMTX running in Docker.
It opens only RTSP (`8554/tcp`) via a DigitalOcean firewall.

## Prerequisites

- Terraform v1.6+
- DigitalOcean API token
- Existing DigitalOcean SSH key

## Usage

```hcl
module "mediamtx" {
  source = "./infra/mediamtx"

  do_token               = var.do_token
  region                 = "sgp1"
  droplet_size           = "s-1vcpu-1gb"
  droplet_image          = "ubuntu-22-04-x64"
  ssh_key_fingerprint    = var.ssh_key_fingerprint
  ssh_key_name           = null

  mediamtx_image         = "mediamtx:latest"
  mediamtx_rtsp_port     = 8554
  mediamtx_container_rtsp_port = 8554
}
```

## Variables

- `do_token`: DigitalOcean API token.
- `region`: DigitalOcean region (default: `sgp1`).
- `droplet_size`: Droplet size slug (default: `s-1vcpu-1gb`).
- `droplet_image`: Droplet image slug (default: `ubuntu-22-04-x64`).
- `ssh_key_fingerprint`: Existing SSH key fingerprint.
- `ssh_key_name`: Existing SSH key name (optional alternative to fingerprint, resolved via `digitalocean_ssh_key`).
- `mediamtx_image`: Docker image for MediaMTX.
- `mediamtx_rtsp_port`: Host RTSP port to expose (default: `8554`).
- `mediamtx_container_rtsp_port`: Container RTSP port (default: `8554`).

## Outputs

- `droplet_id`: Droplet ID.
- `droplet_name`: Droplet name.
- `droplet_ipv4`: Public IPv4 address.
- `firewall_id`: Firewall ID.

## Notes

- This module installs Docker via `apt` and runs MediaMTX as a container.
- If you build an image via Nix, push it to a public registry and set `mediamtx_image` accordingly.
