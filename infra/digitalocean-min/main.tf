terraform {
  required_version = ">= 1.6"

  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.74"
    }
  }
}

provider "digitalocean" {
  token = var.do_token
}

resource "digitalocean_custom_image" "nixos" {
  name    = "nixos-digitalocean"
  url     = var.custom_image_url
  regions = [var.region]
}

module "droplet" {
  source  = "terraform-do-modules/droplet/digitalocean"
  version = "1.0.1"

  name         = var.droplet_name
  region       = var.region
  droplet_size = var.droplet_size
  image_name   = digitalocean_custom_image.nixos.id
  ssh_keys = {
    default = {
      name       = var.ssh_key_name
      public_key = var.ssh_public_key
    }
  }
  vpc_uuid = var.vpc_uuid

  enable_firewall = true
  inbound_rules = [
    {
      protocol      = "tcp"
      allowed_ports = "22"
      allowed_ip    = ["0.0.0.0/0", "::/0"]
    },
    {
      protocol      = "tcp"
      allowed_ports = "80"
      allowed_ip    = ["0.0.0.0/0", "::/0"]
    },
    {
      protocol      = "tcp"
      allowed_ports = "443"
      allowed_ip    = ["0.0.0.0/0", "::/0"]
    },
    {
      protocol      = "tcp"
      allowed_ports = "8554"
      allowed_ip    = ["0.0.0.0/0", "::/0"]
    },
  ]
}
