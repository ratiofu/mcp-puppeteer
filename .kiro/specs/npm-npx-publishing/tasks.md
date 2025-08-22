# Implementation Plan

- [x] 1. Update package.json for NPM publishing with scoped name and create bin script
  - Change package name to "@ratiofu/mcp-puppeteer"
  - Add bin field pointing to bin/mcp-puppeteer
  - Add engines field requiring Node.js 22+
  - Update files array to include only dist/, bin/, README.md, LICENSE
  - Create bin/mcp-puppeteer script with proper shebang
  - Implement module import to execute main dist/index.js
  - Set executable permissions on bin script
  - _Requirements: 1.1, 1.2, 4.4, 2.1, 2.2_

- [x] 2. Test bin script functionality with npx
  - Test that bin script works correctly with npx
  - Verify the script properly imports and executes the main server
  - Ensure error handling works as expected
  - _Requirements: 2.1, 2.2_

- [x] 3. Create local NPM testing script and infrastructure
  - Write comprehensive test-npx.sh script with multiple validation scenarios
  - Create local-publish.sh script for automated build, pack, and install workflow
  - Create local-cleanup.sh script for artifact removal and global uninstall
  - Add cross-platform timeout handling for macOS compatibility
  - Add npm scripts (test:npx, local:publish, local:cleanup) to package.json
  - Make all scripts executable and add proper error handling
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 4. Update README with NPM and npx usage instructions
  - Add installation section with npm install command
  - Include MCP client configuration examples using npx
  - Add troubleshooting section for Chrome setup
  - Update existing documentation to reflect NPM usage
  - _Requirements: 4.1, 4.2, 5.1, 5.3_

- [x] 7. Prepare for NPM publishing
  - Verify prepublishOnly script works correctly
  - Test that npm pack creates correct package structure
  - Ensure all metadata is correct for NPM registry
  - Validate package can be published (dry run)
  - _Requirements: 1.3, 1.4, 4.3_