#!/bin/bash

# Local publish script - builds, packs, and installs the server locally
# This simulates the NPM publishing workflow for local testing

set -e

echo "📦 Local publish: Building and installing @ratiofu/mcp-puppeteer"
echo "=============================================================="

# Uninstall any existing version
echo "Uninstalling existing version (if any)..."
npm uninstall -g @ratiofu/mcp-puppeteer 2>/dev/null || echo "No existing version found"

# Clean up any existing tarball
rm -f ratiofu-mcp-puppeteer-*.tgz

# Build the project
echo "Building project..."
pnpm run build

# Create fresh package
echo "Creating package..."
npm pack

# Install the fresh package globally
echo "Installing fresh package..."
TARBALL=$(ls ratiofu-mcp-puppeteer-*.tgz | head -1)
npm install -g "./$TARBALL"

echo "✅ Local publish complete!"
