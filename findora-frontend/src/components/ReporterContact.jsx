import { FaPhoneAlt, FaUser } from "react-icons/fa";

export const phoneTelHref = (phone = "") => {
  const cleaned = String(phone).replace(/[^\d+]/g, "");
  return cleaned ? `tel:${cleaned}` : null;
};

export default function ReporterContact({ user, compact = false }) {
  const name = user?.fullName || "Unknown";
  const phone = user?.phone?.trim() || "";
  const tel = phoneTelHref(phone);

  const boxClass =
    "rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 text-sm space-y-1";

  return (
    <div className={boxClass}>
      {!compact ? (
        <p className="text-slate-500 text-xs uppercase tracking-wide">Reporter contact</p>
      ) : null}
      <p className="flex items-center gap-2 text-slate-800 font-medium">
        <FaUser className="text-slate-400 shrink-0" />
        <span className={compact ? "truncate" : ""}>{name}</span>
      </p>
      {phone ? (
        <a
          href={tel}
          className={`inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 underline-offset-2 hover:underline ${
            compact ? "font-medium text-sm" : "font-semibold"
          }`}
          title="Call reporter (works when they are offline)"
        >
          <FaPhoneAlt className="shrink-0" aria-hidden />
          {compact ? phone : `Call ${phone}`}
        </a>
      ) : (
        <p className="text-slate-400 text-xs">
          {compact ? "No phone on file" : "Phone not on file — reporter can add it in Profile"}
        </p>
      )}
      {!compact && phone ? (
        <p className="text-slate-400 text-xs">Tap to call locally, even if they are logged out.</p>
      ) : null}
    </div>
  );
}
