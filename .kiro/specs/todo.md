- update readme!

- primary guidance:
  * prefer functional code composed of immutable values and pure functions
  * write only the absolute minimum amount of code

- key learnings:
  * must have automated code quality tools that can run swiftly locally

- generally, do not create "Request"-style interfaces for simple method calls (one or two parameters), unless it's a remove API with messaging-style requesting
- prefer purely functional-style programming; avoid use of private class methods that don't access class state (are pure): write them as normal functions and test separately
- update the steering with latest approaches to quality (type check, biome for linting and formatting, testing)
- guidance on using direct invocation of vitest during iterative development to target specific test classes for coverage
- recreate error-paths.test.ts or similar coverage improvements without mocking the entire setup
- disallow `any` in biome and typescript and fix all remaining code issues