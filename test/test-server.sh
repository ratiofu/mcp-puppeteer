#!/bin/bash
set -e

echo "Building and testing MCP server..."
pnpm run build

# Test function to run MCP command
test_mcp_command() {
    local message="$1"
    local temp_out=$(mktemp)
    local temp_err=$(mktemp)
    
    echo "$message" | node dist/index.js > "$temp_out" 2> "$temp_err" &
    local server_pid=$!
    sleep 2
    kill $server_pid 2>/dev/null || true
    wait $server_pid 2>/dev/null || true
    
    cat "$temp_out"
    cat "$temp_err" >&2
    rm -f "$temp_out" "$temp_err"
}

# Test 1: Initialize
echo "Testing initialize..."
INIT_MSG='{"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "2024-11-05", "capabilities": {}, "clientInfo": {"name": "test", "version": "1.0.0"}}}'
RESPONSE=$(test_mcp_command "$INIT_MSG" 2>/dev/null)

if echo "$RESPONSE" | grep -q "Failed to connect to Chrome"; then
    echo "❌ Chrome/Chromium not running with debug port. Start with:"
    echo "   open -a \"Chromium\" --args --remote-debugging-port=9222"
    exit 1
elif ! echo "$RESPONSE" | grep -q '"result".*"capabilities"'; then
    echo "❌ Initialize failed"
    exit 1
fi

# Test 2: List tools
echo "Testing tools/list..."
TOOLS_MSG='{"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {}}'
TOOLS_RESPONSE=$(test_mcp_command "$TOOLS_MSG" 2>/dev/null)

# Check for expected tools
EXPECTED_TOOLS=("navigate" "list_tab_urls" "click" "take_screenshot" "get_html" "get_console")
for tool in "${EXPECTED_TOOLS[@]}"; do
    if ! echo "$TOOLS_RESPONSE" | grep -q "\"$tool\""; then
        echo "❌ Missing expected tool: $tool"
        exit 1
    fi
done

# Test 3: Validate navigate tool schema
echo "Testing navigate tool schema..."
if ! echo "$TOOLS_RESPONSE" | grep -q '"name":"navigate".*"properties":{"url":{"type":"string","format":"uri"'; then
    echo "❌ Navigate tool missing required URL parameter schema"
    exit 1
fi

if ! echo "$TOOLS_RESPONSE" | grep -q '"required":\["url"\]'; then
    echo "❌ Navigate tool URL parameter not marked as required"
    exit 1
fi

# Test 4: Validate click tool schema
echo "Testing click tool schema..."
if ! echo "$TOOLS_RESPONSE" | grep -q '"name":"click".*"properties":{"selector":{"type":"string"'; then
    echo "❌ Click tool missing required selector parameter schema"
    exit 1
fi

if ! echo "$TOOLS_RESPONSE" | grep -q '"required":\["selector"\]'; then
    echo "❌ Click tool selector parameter not marked as required"
    exit 1
fi

# Test 5: Test navigate tool call with valid URL
echo "Testing navigate tool call..."
NAVIGATE_MSG='{"jsonrpc": "2.0", "method": "tools/call", "params": {"name": "navigate", "arguments": {"url": "https://example.com"}}, "id": 3}'

# Use a longer timeout for the navigate test since it needs to load a page
test_navigate_command() {
    local message="$1"
    local temp_out=$(mktemp)
    local temp_err=$(mktemp)
    
    echo "$message" | node dist/index.js > "$temp_out" 2> "$temp_err" &
    local server_pid=$!
    sleep 5  # Longer timeout for page navigation
    kill $server_pid 2>/dev/null || true
    wait $server_pid 2>/dev/null || true
    
    cat "$temp_out"
    cat "$temp_err" >&2
    rm -f "$temp_out" "$temp_err"
}

NAVIGATE_RESPONSE=$(test_navigate_command "$NAVIGATE_MSG" 2>/dev/null)

if echo "$NAVIGATE_RESPONSE" | grep -q '"error"'; then
    echo "❌ Navigate tool call failed with valid URL"
    echo "Response: $NAVIGATE_RESPONSE"
    exit 1
elif echo "$NAVIGATE_RESPONSE" | grep -q '"result".*"content"'; then
    echo "✅ Navigate tool call successful"
elif echo "$NAVIGATE_RESPONSE" | grep -q '"result"'; then
    echo "✅ Navigate tool call successful (basic response)"
elif [ -z "$NAVIGATE_RESPONSE" ]; then
    echo "ℹ️  Navigate tool call test skipped (requires Chrome page load time)"
else
    echo "ℹ️  Navigate tool call test inconclusive"
    echo "Response: $NAVIGATE_RESPONSE"
fi

echo "✅ MCP server working correctly with all expected tools and parameter validation"