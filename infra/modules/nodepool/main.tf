resource "aws_instance" "nodepool" {
  ami           = "ami-123456"
  instance_type = "m5.large"
  subnet_id     = var.subnet_id
}

output "nodepool_id" {
  value = aws_instance.nodepool.id
}
