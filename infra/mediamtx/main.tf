terraform {
	required_version = ">= 1.6"

	required_providers {
		digitalocean = {
			source	= "digitalocean/digitalocean"
			version = "~> 2.44"
		}
	}
}

provider "digitalocean" {
	token = var.do_token
}

data "digitalocean_ssh_key" "selected" {
	count = var.ssh_key_name != null ? 1 : 0
	name  = var.ssh_key_name
}

locals {
	ssh_key_selector = var.ssh_key_fingerprint != null ? var.ssh_key_fingerprint : (var.ssh_key_name != null ? data.digitalocean_ssh_key.selected[0].id : null)
}

resource "digitalocean_droplet" "mediamtx" {
	name	= var.droplet_name
	region = var.region
	size	= var.droplet_size
	image	= var.droplet_image

	ssh_keys = local.ssh_key_selector != null ? [local.ssh_key_selector] : []

	lifecycle {
		precondition {
			condition	 = local.ssh_key_selector != null
			error_message = "Set ssh_key_fingerprint or ssh_key_name."
		}
	}

	user_data = <<-EOF
		#cloud-config
		package_update: true
		packages:
		  - docker.io
		  - docker-compose-plugin
		runcmd:
		  - systemctl enable --now docker
		  - docker pull ${var.mediamtx_image}
		  - docker run -d --name mediamtx --restart unless-stopped -p ${var.mediamtx_rtsp_port}:${var.mediamtx_container_rtsp_port} ${var.mediamtx_image}
	EOF
}

resource "digitalocean_firewall" "mediamtx" {
	name	= "${var.droplet_name}-rtsp"
	droplet_ids = [digitalocean_droplet.mediamtx.id]

	inbound_rule {
		protocol		 = "tcp"
		port_range		 = tostring(var.mediamtx_rtsp_port)
		source_addresses = ["0.0.0.0/0", "::/0"]
	}

	outbound_rule {
		protocol		 = "tcp"
		port_range		 = "1-65535"
		destination_addresses = ["0.0.0.0/0", "::/0"]
	}

	outbound_rule {
		protocol		 = "udp"
		port_range		 = "1-65535"
		destination_addresses = ["0.0.0.0/0", "::/0"]
	}
}
