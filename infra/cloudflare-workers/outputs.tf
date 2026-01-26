output "worker_script_name" {
  value = cloudflare_workers_script.app.script_name
}

output "workers_dev_enabled" {
  value = var.workers_dev_enabled
}

output "workers_route_pattern" {
  value = var.route_pattern
}

output "worker_url" {
  value = local.worker_url
}
