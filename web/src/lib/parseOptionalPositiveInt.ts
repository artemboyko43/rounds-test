export type OptionalPositiveInt =
  | { ok: true; value: number | undefined }
  | { ok: false; error: string };

/** Empty input → `undefined`; otherwise a positive integer. */
export function parseOptionalPositiveInt(raw: string): OptionalPositiveInt {
  const s = raw.trim();
  if (!s) return { ok: true, value: undefined };
  const n = Number(s);
  if (!Number.isInteger(n) || n <= 0) {
    return { ok: false, error: 'Capture interval must be a positive whole number' };
  }
  return { ok: true, value: n };
}
