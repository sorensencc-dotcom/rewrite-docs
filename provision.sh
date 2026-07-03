#!/bin/bash
node infra/seals/deterministic-infra.js
terraform init
terraform apply -auto-approve
