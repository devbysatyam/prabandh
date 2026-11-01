/** Assert a value is defined (narrowing it) without a non-null assertion. */
export function requireDefined<T>(value: T | undefined | null): T {
  if (value === undefined || value === null) throw new Error('Expected value to be defined');
  return value;
}
