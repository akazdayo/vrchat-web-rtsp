output "droplet_id" {
	value = digitalocean_droplet.mediamtx.id
}

output "droplet_name" {
	value = digitalocean_droplet.mediamtx.name
}

output "droplet_ipv4" {
	value = digitalocean_droplet.mediamtx.ipv4_address
}

output "firewall_id" {
	value = digitalocean_firewall.mediamtx.id
}
