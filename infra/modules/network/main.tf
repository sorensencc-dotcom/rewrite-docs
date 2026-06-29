resource "aws_vpc" "cic" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_subnet" "cic" {
  vpc_id            = aws_vpc.cic.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-east-1a"
}

output "subnet_id" {
  value = aws_subnet.cic.id
}
