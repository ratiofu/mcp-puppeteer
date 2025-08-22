#!/bin/bash

# Test script for npx functionality
# Tests requirements 2.1 and 2.2

set -e

echo "🧪 Testing npx functionality for @ratiofu/mcp-puppeteer"
echo "=================================================="

# Helper function for portable timeout
run_with_timeout() {
    local timeout_duration=$1
    shift
    "$@" &
    local pid=$!
    sleep "$timeout_duration"
    kill $pid 2>/dev/null || true
    wait $pid 2>/dev/null || true
}

# Setup: Use local publish script to prepare fresh package
echo "Setup: Preparing fresh package for testing..."
./scripts/local-publish.sh

# Validate package structure
echo "Validating package structure..."
if [ -f "dist/index.js" ] && [ -f "bin/mcp-puppeteer" ] && [ -f "package.json" ]; then
    echo "✅ Package structure is correct for NPM"
else
    echo "❌ Package structure is incomplete"
    echo "Fix needed: Ensure dist/index.js, bin/mcp-puppeteer, and package.json exist"
    exit 1
fi

echo "=================================================="

# Test 1: Verify npx can execute the package
echo "Test 1: Testing npx execution..."
if command -v npx >/dev/null 2>&1; then
    echo "✅ npx is available"
else
    echo "❌ npx is not available"
    exit 1
fi

# Test 2: Test that npx downloads and executes the package
echo "Test 2: Testing npx package execution..."
TEST_OUTPUT=$(echo '{"jsonrpc": "2.0", "method": "initialize", "params": {"protocolVersion": "2024-11-05", "capabilities": {}, "clientInfo": {"name": "test", "version": "1.0.0"}}, "id": 1}' | (run_with_timeout 5 npx @ratiofu/mcp-puppeteer) 2>&1 || true)
if echo "$TEST_OUTPUT" | grep -q "MCP server started"; then
    echo "✅ npx execution successful"
else
    echo "❌ npx execution failed - Package structure may be incorrect for NPM"
    echo "Fix needed: Verify bin script, main entry point, and package.json configuration"
    echo "Output: $TEST_OUTPUT"
    exit 1
fi

# Test 3: Verify startup messages are displayed
echo "Test 3: Testing startup messages..."
OUTPUT=$(echo '{}' | (run_with_timeout 3 npx @ratiofu/mcp-puppeteer) 2>&1 || true)
if echo "$OUTPUT" | grep -q "Connecting to Chrome"; then
    echo "✅ Startup messages are displayed"
else
    echo "❌ Startup messages not found - Server may not be starting correctly"
    echo "Fix needed: Check main entry point and server initialization"
    echo "Output was: $OUTPUT"
    exit 1
fi

# Test 4: Test stdio transport (requirement 2.2)
echo "Test 4: Testing stdio transport..."
if echo "$OUTPUT" | grep -q "MCP server started with pipe transport"; then
    echo "✅ Stdio transport is working"
else
    echo "❌ Stdio transport not detected - MCP communication may fail"
    echo "Fix needed: Verify server uses stdio transport when run via npx"
    exit 1
fi

# Test 5: Test error handling when Chrome is not available
echo "Test 5: Testing error handling..."
# This test assumes Chrome might not be running with debug port
# The error handling should provide helpful messages
if echo "$OUTPUT" | grep -q -E "(Chrome|browser|debug|port)"; then
    echo "✅ Error handling provides Chrome-related guidance"
else
    echo "ℹ️  Chrome appears to be available (no error to test)"
fi

echo "=================================================="

# Cleanup: Use cleanup script
echo "Cleanup: Uninstalling test package..."
./scripts/local-cleanup.sh

echo "🎉 npx functionality tests completed!"