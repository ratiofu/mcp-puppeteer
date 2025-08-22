# Implementation Plan

- [x] 1. Update TypeScript configuration for build output
  - Modify `tsconfig.json` to perform proper type checking
  - Configure target as ES2022 with NodeNext module resolution
  - Use esbuild for bundling
  - _Requirements: 4.1, 4.2_

- [x] 2. Update package.json dependencies and scripts
  - Remove `express` and `@types/express` from dependencies
  - Remove `ts-node` from dependencies
  - Move `@modelcontextprotocol/sdk` from devDependencies to dependencies
  - Add `nodemon` and `concurrently` to devDependencies
  - Update scripts for build, start, dev, and inspector workflows
  - _Requirements: 3.1, 3.2, 5.1, 5.2, 5.3_

- [x] 3. Rewrite index.ts to use pipe transport
  - Replace Express server setup with StdioServerTransport initialization
  - Use existing CLI implementation pattern from `src/cli.ts` as reference
  - Remove HTTP session management and SSE transport code
  - Implement single-session browser management
  - Add proper error handling for browser connection failures
  - _Requirements: 1.1, 1.2, 1.3, 7.1, 7.2_

- [x] 4. Remove unused CLI file
  - Delete `src/cli.ts` since its functionality is now in the main server
  - _Requirements: 1.2_

- [x] 5. Create restart-inspector script functionality
  - Implement shell script logic to kill existing inspector processes
  - Add sleep delay and restart logic for seamless development workflow
  - _Requirements: 5.3_

- [x] 6. Test the pipe transport implementation
  - Build the project using `pnpm run build`
  - Test server startup with `pnpm start`
  - Confirm no HTTP ports are opened during operation
  - _Requirements: 2.1, 2.2, 4.3_

- [x] 7. Test development workflow
  - Test `pnpm run dev` for auto-recompile and restart
  - Verify inspector auto-restart functionality works
  - Confirm file watching triggers proper rebuilds
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 8. Update README.md documentation
  - Remove references to HTTP server and SSE transport
  - Update setup instructions to use build + start workflow
  - Update testing instructions to use MCP Inspector with compiled server
  - Add development workflow documentation
  - _Requirements: 6.1, 6.2, 6.3_
  