output "custom_domain_id" {
  value       = cloudflare_workers_custom_domain.rtsp.id
  description = "Cloudflare custom domain ID for the Worker."
}

output "custom_domain_hostname" {
  value       = cloudflare_workers_custom_domain.rtsp.hostname
  description = "Hostname attached to the Worker service."
}

output "custom_domain_service" {
  value       = cloudflare_workers_custom_domain.rtsp.service
  description = "Worker service name bound to the custom domain."
}

output "turnstile_sitekey" {
  value       = cloudflare_turnstile_widget.main.sitekey
  description = "Turnstile widget sitekey for client-side (VITE_SITE_KEY)"
}

output "turnstile_secret" {
  value       = cloudflare_turnstile_widget.main.secret
  sensitive   = true
  description = "Turnstile widget secret key for server-side (TURNSTILE_SECRET_KEY)"
}
