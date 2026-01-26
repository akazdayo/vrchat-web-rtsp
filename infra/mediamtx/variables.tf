variable "do_token" {
	type = string
}

variable "region" {
	type		= string
	default = "sgp1"
}

variable "droplet_size" {
	type		= string
	default = "s-1vcpu-1gb"
}

variable "droplet_image" {
	type		= string
	default = "ubuntu-22-04-x64"
}

variable "ssh_key_fingerprint" {
	type		= string
	default = null
	nullable = true
}

variable "ssh_key_name" {
	type		= string
	default = null
	nullable = true
}

variable "mediamtx_image" {
	type		= string
	default = "mediamtx:latest"
}

variable "mediamtx_container_rtsp_port" {
	type		= number
	default = 8554
}

variable "mediamtx_rtsp_port" {
	type		= number
	default = 8554
}

variable "droplet_name" {
	type		= string
	default = "mediamtx"
}
