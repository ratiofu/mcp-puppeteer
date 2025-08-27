# Agent Guide for Puppeteer MCP Server

## Critical Requirements
- Write only the absolute minimum code to meet expected outcomes
- Ask for human approval before adding behavior not explicitly requested
- Work on one task at a time, in the order given
- Prefer functional code with immutable values and pure functions
- Write tests first when feasible

## Important Guidelines
- Use "functional core, imperative shell" architecture
- Use `git mv` for tracked files, `mv` for untracked files (never copy-paste)
- Don't create `*Request` interfaces for simple 1-2 parameter methods (except remote APIs)
- Extract pure methods from classes as separate testable utility functions
- Use `npx vitest <test-file>` for targeted testing during development
- Run `pnpm run quality` only at task completion

## Project Resources
- **[Product Overview](.kiro/steering/product.md)** - What this does and available tools
- **[Technology Stack](.kiro/steering/tech.md)** - Dependencies, build system, and commands  
- **[Project Structure](.kiro/steering/structure.md)** - File organization and patterns