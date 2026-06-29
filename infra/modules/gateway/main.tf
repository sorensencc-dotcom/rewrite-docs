resource "aws_lb" "gateway" {
  name               = "cic-gateway"
  internal           = false
  load_balancer_type = "application"
  subnets            = [var.subnet_id]
}

output "gateway_url" {
  value = aws_lb.gateway.dns_name
}
