/** Stitch executive dispatch — Studio foyer (B), Portfolio, Advanced routes, mission dossiers. */
export function isExecutiveStudioRoute(pathname: string): boolean {
  return (
    pathname === "/command" ||
    pathname.startsWith("/command/portfolio") ||
    pathname.startsWith("/command/projects") ||
    pathname.startsWith("/command/capabilities") ||
    pathname.startsWith("/command/programmes") ||
    pathname.startsWith("/command/supervised") ||
    pathname.startsWith("/command/missions") ||
    pathname.startsWith("/command/product-memory")
  );
}
