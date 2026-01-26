variable "cloudflare_api_token" {
  type      = string
  sensitive = true
}

variable "account_id" {
  type = string
}

variable "worker_name" {
  type = string
}

variable "worker_content_file" {
  type    = string
  default = "dist/index.js"
}

variable "worker_main_module" {
  type    = string
  default = "index.js"
}

variable "assets_directory" {
  type     = string
  default  = "dist/assets"
  nullable = true
}

variable "compatibility_date" {
  type = string
}

variable "compatibility_flags" {
  type    = list(string)
  default = []
}

variable "workers_dev_enabled" {
  type    = bool
  default = true
}

variable "workers_dev_previews_enabled" {
  type    = bool
  default = false
}

variable "workers_dev_subdomain" {
  type     = string
  default  = null
  nullable = true
}

variable "zone_id" {
  type     = string
  default  = null
  nullable = true
}

variable "route_pattern" {
  type     = string
  default  = null
  nullable = true
}

variable "durable_object_binding_name" {
  type    = string
  default = "ROOM"
}

variable "durable_object_class_name" {
  type    = string
  default = "Room"
}

variable "plain_text_env" {
  type    = map(string)
  default = {}
}

variable "secret_text_env" {
  type      = map(string)
  default   = {}
  sensitive = true
}
