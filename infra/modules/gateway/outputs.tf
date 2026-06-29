output "gateway_url" {
  value = aws_lb.gateway.dns_name
}
