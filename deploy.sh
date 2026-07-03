#!/bin/bash
node deployment/seals/deterministic-seal.js
kubectl apply -f deployment/k8s/
