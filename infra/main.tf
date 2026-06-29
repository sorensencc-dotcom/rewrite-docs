terraform {
  required_version = ">= 1.5.0"
}

provider "aws" {
  region = var.region
}

module "network" {
  source = "./modules/network"
}

module "nodepool" {
  source = "./modules/nodepool"
  subnet_id = module.network.subnet_id
}

module "gateway" {
  source = "./modules/gateway"
  subnet_id = module.network.subnet_id
}
