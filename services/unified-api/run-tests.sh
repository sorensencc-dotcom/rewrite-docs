#!/bin/sh
set -e

echo "Building..."
npm run build

echo "Starting server..."
npm start &
SERVER_PID=$!

echo "Waiting for server to start..."
sleep 3

echo "Running tests..."
npm test
TEST_RESULT=$?

echo "Stopping server..."
kill $SERVER_PID 2>/dev/null || true

exit $TEST_RESULT
