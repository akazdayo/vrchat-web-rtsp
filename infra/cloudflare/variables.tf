variable "cloudflare_api_token" {
  type        = string
  sensitive   = true
  description = "Cloudflare API token with Workers and Zone permissions."
}

variable "cloudflare_account_id" {
  type        = string
  description = "Cloudflare account ID that owns the Worker."
}

variable "cloudflare_zone_id" {
  type        = string
  description = "Cloudflare zone ID that hosts the custom domain."
}

variable "worker_service" {
  type        = string
  description = "Workers service name to bind to the custom domain."
  default     = "vrchat-web-rtsp"
}

variable "worker_hostname" {
  type        = string
  description = "Custom domain hostname for the Worker."
  default     = "rtsp.odango.app"
}
