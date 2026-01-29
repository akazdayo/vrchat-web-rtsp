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

  enable_firewall = false
}
