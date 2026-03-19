/** Parses a positive integer route param. Returns null if invalid. */
export const parseRouteId = (raw: string | undefined): number | null => {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
};
