output "instance_public_ip" {
  value = aws_eip.app.public_ip
}

output "ssh_command" {
  value = "ssh -i ${local_sensitive_file.private_key.filename} ec2-user@${aws_eip.app.public_ip}"
}

output "backups_bucket" {
  value = aws_s3_bucket.backups.bucket
}

output "private_key_path" {
  value = local_sensitive_file.private_key.filename
}
