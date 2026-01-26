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

locals {
  durable_object_binding = [{
    name       = var.durable_object_binding_name
    type       = "durable_object_namespace"
    class_name = var.durable_object_class_name
  }]

  plain_text_bindings = [
    for key, value in var.plain_text_env : {
      name = key
      type = "plain_text"
      text = value
    }
  ]

  secret_text_bindings = [
    for key, value in var.secret_text_env : {
      name = key
      type = "secret_text"
      text = value
    }
  ]

  worker_bindings = concat(
    local.durable_object_binding,
    local.plain_text_bindings,
    local.secret_text_bindings,
  )

  route_url       = var.route_pattern != null ? format("https://%s", trimspace(replace(var.route_pattern, "/*", ""))) : null
  workers_dev_url = var.workers_dev_subdomain != null ? format("https://%s.%s.workers.dev", var.worker_name, var.workers_dev_subdomain) : null
  worker_url      = local.route_url != null ? local.route_url : local.workers_dev_url
}

resource "cloudflare_workers_script" "app" {
  account_id          = var.account_id
  script_name         = var.worker_name
  content_file        = var.worker_content_file
  content_sha256      = filesha256(var.worker_content_file)
  main_module         = var.worker_main_module
  compatibility_date  = var.compatibility_date
  compatibility_flags = var.compatibility_flags
  bindings            = local.worker_bindings

  migrations = {
    new_sqlite_classes = [var.durable_object_class_name]
  }

  dynamic "assets" {
    for_each = var.assets_directory == null ? [] : [var.assets_directory]
    content {
      directory = assets.value
    }
  }
}

resource "cloudflare_workers_script_subdomain" "app" {
  count = var.workers_dev_enabled ? 1 : 0

  account_id       = var.account_id
  script_name      = cloudflare_workers_script.app.script_name
  enabled          = true
  previews_enabled = var.workers_dev_previews_enabled
}

resource "cloudflare_workers_route" "app" {
  count = var.zone_id != null && var.route_pattern != null ? 1 : 0

  zone_id = var.zone_id
  pattern = var.route_pattern
  script  = cloudflare_workers_script.app.script_name
}
