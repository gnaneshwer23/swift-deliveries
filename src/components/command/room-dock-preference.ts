/** Tab-local preference for the Quiet Studio Aria dock, keyed by mission. */

const STORAGE_PREFIX = "dx-aria-dock-minimized:";

export function ariaDockStorageKey(missionId: string): string {
  return `${STORAGE_PREFIX}${missionId}`;
}

export function readAriaDockMinimized(
  missionId: string,
  storage: Pick<Storage, "getItem"> | null,
): boolean {
  if (!storage) return false;
  try {
    return storage.getItem(ariaDockStorageKey(missionId)) === "1";
  } catch {
    return false;
  }
}

export function writeAriaDockMinimized(
  missionId: string,
  minimized: boolean,
  storage: Pick<Storage, "setItem" | "removeItem"> | null,
): void {
  if (!storage) return;
  const key = ariaDockStorageKey(missionId);
  try {
    if (minimized) storage.setItem(key, "1");
    else storage.removeItem(key);
  } catch {
    // Private browsing can reject sessionStorage. The dock still toggles for this view.
  }
}

export function browserSessionStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}
