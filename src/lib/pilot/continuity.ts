import { claimPilotRequest } from "@/lib/pilot/enquiry.functions";
import { clearPilotClaim, loadPilotClaim } from "@/lib/pilot/storage";

/** Attaches a same-browser enquiry to the signed-in account when the email matches. */
export async function claimStoredPilotRequest(): Promise<void> {
  const claim = loadPilotClaim();
  if (!claim) return;
  try {
    const result = await claimPilotRequest({ data: { token: claim.token } });
    if (result.ok || result.reason === "email_mismatch" || result.reason === "claimed_by_other") {
      clearPilotClaim();
    }
  } catch {
    /* Keep the token so a later visit can retry a network failure. */
  }
}
