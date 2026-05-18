/**
 * Converts a Spring LocalDateTime value to a Unix timestamp (ms).
 * Handles both the legacy array format [y, mo, d, h, mi, s] and ISO strings.
 */
export function toTimestamp(val) {
  if (!val) return Date.now();
  if (Array.isArray(val)) {
    const [y, mo, d, h = 0, mi = 0, s = 0] = val;
    return new Date(y, mo - 1, d, h, mi, s).getTime();
  }
  const t = new Date(val).getTime();
  return isNaN(t) ? Date.now() : t;
}
