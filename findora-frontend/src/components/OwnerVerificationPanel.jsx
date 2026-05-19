import { useState } from "react";
import { apiFetch } from "../utils/apiClient";

const decisionLabel = (decision) => {
  if (decision === "confirmed") return { text: "Reporter confirmed", className: "text-emerald-600" };
  if (decision === "rejected") return { text: "Reporter rejected", className: "text-rose-600" };
  return { text: "Awaiting reporter", className: "text-amber-600" };
};

export function ClaimProofSummary({ claim, compact = false }) {
  if (!claim || claim.status === "none") return null;

  const reporter = decisionLabel(claim.reporterDecision);

  return (
    <div
      className={`rounded-lg border border-violet-100 bg-violet-50/80 ${
        compact ? "p-2 text-xs" : "p-3 text-sm"
      } space-y-2`}
    >
      <p className="font-semibold text-violet-800">Owner verification</p>
      <p>
        <span className="text-slate-500">Status:</span>{" "}
        <span className="capitalize font-medium">{claim.status}</span>
      </p>
      {claim.proofDescription ? (
        <p>
          <span className="text-slate-500">Proof:</span> {claim.proofDescription}
        </p>
      ) : null}
      {claim.identifyingDetails ? (
        <p>
          <span className="text-slate-500">Details:</span> {claim.identifyingDetails}
        </p>
      ) : null}
      {claim.proofImage ? (
        <a
          href={claim.proofImage}
          target="_blank"
          rel="noreferrer"
          className="inline-block text-blue-600 hover:underline"
        >
          View proof photo
        </a>
      ) : null}
      {claim.requestedBy?.fullName ? (
        <p>
          <span className="text-slate-500">Claimant:</span> {claim.requestedBy.fullName}
        </p>
      ) : null}
      <p className={reporter.className}>{reporter.text}</p>
      {claim.reporterNote ? (
        <p>
          <span className="text-slate-500">Reporter note:</span> {claim.reporterNote}
        </p>
      ) : null}
    </div>
  );
}

export default function OwnerVerificationPanel({ item, onReviewed }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const claim = item?.claim;

  if (!claim || claim.status !== "requested") return null;

  const review = async (action) => {
    setBusy(true);
    try {
      const res = await apiFetch(`/api/items/${item._id}/claim-reporter-review`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Review failed");
      onReviewed?.(data.item);
    } catch (err) {
      onReviewed?.(null, err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-3">
      <p className="text-sm font-semibold text-amber-800">Pending ownership verification</p>
      <ClaimProofSummary claim={claim} compact />
      <textarea
        rows={2}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optional note to claimant or admin..."
        className="w-full px-3 py-2 border rounded-lg text-sm"
      />
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => review("confirm")}
          className="py-2 rounded-lg text-sm text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60"
        >
          Confirm owner
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => review("reject")}
          className="py-2 rounded-lg text-sm text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-60"
        >
          Reject proof
        </button>
      </div>
    </div>
  );
}
