variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "eu-west-1"
}

variable "project_name" {
  description = "Short name used to tag/name all resources"
  type        = string
  default     = "domaine-seetloo-booking"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "allowed_ssh_cidr" {
  description = "CIDR block allowed to SSH into the instance (your current public IP/32). Update this and re-apply if your IP changes."
  type        = string
}

variable "root_volume_gb" {
  description = "Root EBS volume size in GB"
  type        = number
  default     = 15
}
