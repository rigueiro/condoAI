/**
 * Build a locale-prefixed path for auth pages and other full navigations.
 * Prefer this over hand-rolled `/${locale}/...` strings.
 */
export function localeHref(
  locale: string,
  path: string,
  query?: Record<string, string>,
): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const base = `/${locale}${normalized === "/" ? "" : normalized}`;

  if (!query) return base;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== "") params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}
