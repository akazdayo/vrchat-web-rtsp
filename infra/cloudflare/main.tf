terraform {
  required_version = ">= 1.6"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.16"
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

resource "cloudflare_workers_custom_domain" "rtsp" {
  account_id = var.cloudflare_account_id
  zone_id    = var.cloudflare_zone_id
  hostname   = var.worker_hostname
  service    = var.worker_service
}

resource "cloudflare_turnstile_widget" "main" {
  account_id = var.cloudflare_account_id
  name       = "VRChat Web RTSP"
  domains    = [var.worker_hostname]
  mode       = "managed"

  bot_fight_mode  = false
  clearance_level = "interactive"
  region          = "world"
}
