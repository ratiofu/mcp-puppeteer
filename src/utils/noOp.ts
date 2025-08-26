// biome-ignore lint/suspicious/noExplicitAny: utility function needs to accept any arguments
// biome-ignore lint/correctness/noUnusedFunctionParameters: args only exist to easily accept any arbitrary function type declaration
export function noOp(...args: any[]): any {
  // empty on purpose
}
