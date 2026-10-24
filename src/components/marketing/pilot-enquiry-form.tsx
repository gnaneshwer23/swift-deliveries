import { useEffect, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { EMPTY_BRIEF, type ProductBrief } from "@/lib/marketing/product-resources";
import { submitPilotEnquiry } from "@/lib/pilot/enquiry.functions";
import { CONSENT_STATEMENT, PILOT_PLAN_LABELS, type PilotPlan } from "@/lib/pilot/model";
import {
  hasPilotBrief,
  loadPilotBrief,
  savePilotBrief,
  savePilotClaim,
  savePilotPlan,
} from "@/lib/pilot/storage";

const FIELDS: { key: keyof ProductBrief; label: string; required?: boolean }[] = [
  { key: "product", label: "Product or working title" },
  { key: "audience", label: "Who is it for?", required: true },
  { key: "problem", label: "Product question", required: true },
  { key: "objective", label: "Outcome to investigate", required: true },
  { key: "constraints", label: "Constraints and non-goals" },
  { key: "evidence", label: "Evidence you can supply" },
];

export function PilotEnquiryForm({ plan }: { plan: PilotPlan }) {
  const [brief, setBrief] = useState<ProductBrief>(EMPTY_BRIEF);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [consent, setConsent] = useState(false);
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [restored, setRestored] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  useEffect(() => {
    savePilotPlan(plan);
    const stored = loadPilotBrief();
    if (stored && hasPilotBrief(stored)) {
      setBrief(stored);
      setRestored(true);
    }
  }, [plan]);

  function updateBrief(key: keyof ProductBrief, value: string) {
    setBrief((current) => {
      const next = { ...current, [key]: value };
      savePilotBrief(next);
      return next;
    });
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const result = await submitPilotEnquiry({
        data: {
          plan,
          contactName: name,
          contactEmail: email,
          organisation,
          brief,
          consent,
          companyWebsite,
        },
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      if (result.claimToken) {
        savePilotClaim({
          token: result.claimToken,
          reference: result.reference,
          plan: result.plan,
        });
      }
      savePilotBrief(brief);
      setReference(result.reference);
    } catch {
      setError("We could not save your request. Nothing was confirmed. Try again later.");
    } finally {
      setSubmitting(false);
    }
  }

  if (reference) {
    return (
      <div className="psi-enquiry-result" role="status">
        <p className="dxl-eyebrow">Request received</p>
        <h2>Your reference is {reference}</h2>
        <p>
          Selected offer: <strong>{PILOT_PLAN_LABELS[plan]}</strong>. An authorised person can see
          this request and record what happens next. This confirmation does not promise a reply
          time, a start date, or a paid pilot.
        </p>
        <p>
          Creating an account is free and does not activate the pilot. If you use the same browser
          and the same email, the chosen offer and brief stay with your setup.
        </p>
        <div className="psi-actions">
          <Link to="/signup" className="dxl-btn dxl-btn-primary">
            Create a free account
          </Link>
          <Link to="/pricing" className="dxl-btn dxl-btn-ghost">
            Back to offers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form className="psi-brief-builder" onSubmit={(event) => void onSubmit(event)}>
      <p className="psi-label">Pilot enquiry · {PILOT_PLAN_LABELS[plan]}</p>
      {restored ? (
        <p className="journey-status">
          Your brief from this browser is filled in. It is stored on this device, not in the page
          address.
        </p>
      ) : (
        <p className="psi-fine-print">
          You can write the brief here. It is kept in this browser until you submit, and it is not
          added to the URL.
        </p>
      )}
      <div className="psi-field">
        <label htmlFor="pilot-name">Your name</label>
        <input
          id="pilot-name"
          className="psi-text-input"
          autoComplete="name"
          value={name}
          maxLength={80}
          required
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div className="psi-field">
        <label htmlFor="pilot-email">Email</label>
        <input
          id="pilot-email"
          className="psi-text-input"
          type="email"
          autoComplete="email"
          value={email}
          maxLength={200}
          required
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      <div className="psi-field">
        <label htmlFor="pilot-org">Organisation (optional)</label>
        <input
          id="pilot-org"
          className="psi-text-input"
          autoComplete="organization"
          value={organisation}
          maxLength={120}
          onChange={(event) => setOrganisation(event.target.value)}
        />
      </div>
      {FIELDS.map((field) => (
        <div className="psi-field" key={field.key}>
          <label htmlFor={`pilot-${field.key}`}>
            {field.label}
            {field.required ? <span aria-hidden="true"> *</span> : null}
          </label>
          <textarea
            id={`pilot-${field.key}`}
            value={brief[field.key]}
            rows={field.key === "product" ? 1 : 3}
            maxLength={field.key === "product" ? 200 : 2000}
            required={field.required}
            onChange={(event) => updateBrief(field.key, event.target.value)}
          />
        </div>
      ))}
      <div className="psi-honeypot" aria-hidden="true">
        <label htmlFor="pilot-website">Website</label>
        <input
          id="pilot-website"
          tabIndex={-1}
          autoComplete="off"
          value={companyWebsite}
          onChange={(event) => setCompanyWebsite(event.target.value)}
        />
      </div>
      <label className="psi-consent" htmlFor="pilot-consent">
        <input
          id="pilot-consent"
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          required
        />
        <span>{CONSENT_STATEMENT}</span>
      </label>
      {error ? (
        <p className="psi-form-error" role="alert">
          {error}
        </p>
      ) : null}
      <button type="submit" className="dxl-btn dxl-btn-primary" disabled={submitting || !consent}>
        {submitting ? "Saving request…" : "Submit pilot enquiry"}
      </button>
      <p className="psi-fine-print">
        Account creation remains separate and does not turn this offer on. No payment is taken here.
      </p>
    </form>
  );
}
