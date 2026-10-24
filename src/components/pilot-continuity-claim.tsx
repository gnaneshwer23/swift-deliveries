import { useEffect } from "react";
import { claimStoredPilotRequest } from "@/lib/pilot/continuity";

/** Attaches a same-browser enquiry to the signed-in account when the email matches. */
export function PilotContinuityClaim() {
  useEffect(() => {
    void claimStoredPilotRequest();
  }, []);
  return null;
}
