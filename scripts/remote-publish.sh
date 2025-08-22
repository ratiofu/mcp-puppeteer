#!/bin/bash

set -e

echo "🚀 Starting NPM publish process..."

# Function to check if output contains warnings (excluding expected dry-run warnings)
has_warnings() {
    local output="$1"
    # Filter out expected dry-run warnings about being logged in
    echo "$output" | grep "npm warn" | grep -v "This command requires you to be logged in.*dry-run" | grep -q "npm warn"
}

# Function to check if output contains errors
has_errors() {
    local output="$1"
    echo "$output" | grep -q "npm ERR!"
}

# Step 1: Initial dry run
echo "📋 Running initial dry run..."
dry_run_output=$(npm publish --dry-run --access public 2>&1)
dry_run_exit_code=$?

if [ $dry_run_exit_code -ne 0 ]; then
    echo "❌ Initial dry run failed with exit code $dry_run_exit_code"
    echo "$dry_run_output"
    exit 1
fi

# Check for warnings in first dry run
if has_warnings "$dry_run_output"; then
    echo "⚠️  Warnings detected in initial dry run. Running npm pkg fix..."
    
    # Step 2: Fix package.json issues
    npm pkg fix
    
    # Step 3: Second dry run after fix
    echo "📋 Running dry run after fixes..."
    second_dry_run_output=$(npm publish --dry-run --access public 2>&1)
    second_dry_run_exit_code=$?
    
    if [ $second_dry_run_exit_code -ne 0 ]; then
        echo "❌ Second dry run failed with exit code $second_dry_run_exit_code"
        echo "$second_dry_run_output"
        exit 1
    fi
    
    # Check if warnings still exist after fix (excluding expected dry-run warnings)
    if has_warnings "$second_dry_run_output"; then
        echo "❌ Warnings still present after npm pkg fix:"
        echo "$second_dry_run_output" | grep "npm warn" | grep -v "This command requires you to be logged in.*dry-run"
        echo ""
        echo "🛑 Publishing aborted due to unresolved warnings."
        echo "Please review and fix the warnings manually before publishing."
        exit 1
    fi
    
    # Check for errors
    if has_errors "$second_dry_run_output"; then
        echo "❌ Errors detected after fixes:"
        echo "$second_dry_run_output" | grep "npm ERR!"
        echo ""
        echo "🛑 Publishing aborted due to errors."
        exit 1
    fi
    
    echo "✅ All warnings resolved after fixes."
else
    echo "✅ No warnings detected in initial dry run."
fi

# Step 4: Actual publish
echo ""
echo "🎯 All checks passed. Publishing to NPM..."
echo "Press Ctrl+C within 2 seconds to cancel..."
sleep 2

npm publish --access public

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Successfully published to NPM!"
    echo "📦 Package: $(npm pkg get name | tr -d '\"')"
    echo "🏷️  Version: $(npm pkg get version | tr -d '\"')"
else
    echo "❌ Publishing failed!"
    exit 1
fi