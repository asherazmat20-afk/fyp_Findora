import { apiFetch } from "./apiClient";

export const submitOwnerVerification = async (itemId, payload) => {
  const res = await apiFetch(`/api/items/${itemId}/claim-request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Verification failed");
  return data;
};

export const claimStatusLabel = (claim) => {
  if (!claim || claim.status === "none") return null;
  const map = {
    requested: "Verification pending",
    approved: "Owner verified",
    rejected: "Verification rejected",
    returned: "Item returned",
  };
  return map[claim.status] || claim.status;
};
