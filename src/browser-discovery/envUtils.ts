/**
 * Check if an environment variable is "truthy" (starts with '1', 't', or 'T')
 * @param value Environment variable value
 * @returns True if the value is truthy
 */
export function isTruthy(value: string | undefined): boolean {
  if (!value) return false;
  const firstChar = value.charAt(0).toLowerCase();
  return firstChar === '1' || firstChar === 't';
}