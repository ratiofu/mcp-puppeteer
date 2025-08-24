/**
 * Safely convert any thrown value to a concise string message.
 * - Prefers Error.message when available
 * - Falls back to JSON.stringify, then String()
 */
export function errorToString(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err; // keep raw string without extra quotes
  if (err === null || err === undefined) return String(err);
  try {
    // For plain objects or arrays, provide JSON; otherwise fall back to String()
    const json = JSON.stringify(err);
    if (json && json !== '{}') return json;
  } catch {
    // ignore JSON errors
  }
  return String(err);
}
