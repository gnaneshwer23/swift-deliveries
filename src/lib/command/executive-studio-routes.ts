/** Stitch executive dispatch accents — Portfolio, Advanced routes, mission dossiers only. */
export function isExecutiveStudioRoute(pathname: string): boolean {
  return (
    pathname.startsWith("/command/portfolio") ||
    pathname.startsWith("/command/projects") ||
    pathname.startsWith("/command/capabilities") ||
    pathname.startsWith("/command/programmes") ||
    pathname.startsWith("/command/supervised") ||
    pathname.startsWith("/command/missions") ||
    pathname.startsWith("/command/product-memory")
  );
}
