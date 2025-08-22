#!/bin/bash

# Local cleanup script - removes locally installed package and artifacts

echo "🧹 Cleaning up local installation..."

# Uninstall the package
npm uninstall -g @ratiofu/mcp-puppeteer 2>/dev/null || echo "Package not installed"

# Remove any tarballs
rm -f ratiofu-mcp-puppeteer-*.tgz

echo "✅ Cleanup complete!"