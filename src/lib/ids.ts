/**
 * Generates a reasonably unique client-side id (`prefix-<epoch ms>`).
 *
 * @param prefix - Short entity prefix such as `v` or `g`.
 * @returns Id string, e.g. `v-1730000000000`.
 * @example
 * ```ts
 * newId('v'); // => 'v-1730000000000'
 * ```
 */
export function newId(prefix: string): string {
  return `${prefix}-${Date.now()}`;
}
