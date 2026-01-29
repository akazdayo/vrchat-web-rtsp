variable "do_token" {
  type      = string
  sensitive = true
}

variable "region" {
  type    = string
  default = "sgp1"
}

variable "droplet_size" {
  type    = string
  default = "s-1vcpu-1gb"
}

variable "ssh_public_key" {
  type      = string
  sensitive = true
  default   = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIIDAd7QIGpjLBZhmLofUd9D+uMoXajBjt/Nz1spgArXy"
}

variable "ssh_key_name" {
  type    = string
  default = "vrchat-rtsp-web"
}

variable "custom_image_url" {
  type    = string
  default = "https://github.com/hraban/nixos-images/releases/download/latest/nixos-digitalocean-x86_64-linux.qcow.gz"
}

variable "droplet_name" {
  type    = string
  default = "app"
}

variable "vpc_uuid" {
  type    = string
  default = null
}
