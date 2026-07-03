#!/bin/bash
git pull
npm install
npm run build
node .cicd/version-bump.js
node .cicd/build-hash.js
node .cicd/release-gate.js
git add .
git commit -m "Deterministic release"
git push --tags
