/**
 * "Explain as we go": short notes on why each step matters. On by default for learners
 * (from their onboarding answers); anyone can switch it on or off. Kept in this browser only.
 */
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { explainByDefault } from "@/lib/pilot-mission/first-project";
import { myProfileQuery } from "@/lib/profile-queries";

const KEY = "dx-explain-mode";
const EVENT = "dx-explain-mode-change";

function stored(): boolean | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(KEY);
    return v === "on" ? true : v === "off" ? false : null;
  } catch {
    return null;
  }
}

export function useExplainMode(): { on: boolean; set: (on: boolean) => void } {
  const profile = useQuery(myProfileQuery);
  const [choice, setChoice] = useState<boolean | null>(null);
  useEffect(() => {
    setChoice(stored());
    const sync = () => setChoice(stored());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  const set = useCallback((on: boolean) => {
    let persisted = false;
    try {
      window.localStorage.setItem(KEY, on ? "on" : "off");
      persisted = true;
    } catch {
      /* Optional preference: without storage the switch still works for this visit. */
    }
    setChoice(on);
    // Other tabs and components re-read storage; only tell them when it was saved.
    if (persisted) window.dispatchEvent(new Event(EVENT));
  }, []);
  const on = choice ?? explainByDefault(profile.data?.goal, profile.data?.role);
  return { on, set };
}
