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

echo "✅ MCP server working correctly with all expected tools"