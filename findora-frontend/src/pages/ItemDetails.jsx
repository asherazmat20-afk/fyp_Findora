import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { motion, AnimatePresence } from "framer-motion";
import PageTransition from "../components/PageTransition";
import UiLoader from "../components/UiLoader";
import UiToast from "../components/UiToast";
import { apiFetch } from "../utils/apiClient";
import { getSession } from "../utils/auth";
import ReporterContact, { phoneTelHref } from "../components/ReporterContact";
import OwnerVerificationModal from "../components/OwnerVerificationModal";
import { ClaimProofSummary } from "../components/OwnerVerificationPanel";
import { claimStatusLabel, submitOwnerVerification } from "../utils/ownerVerification";

function ItemDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userName, token, userId } = getSession();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [coords, setCoords] = useState([31.5204, 74.3587]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [toast, setToast] = useState("");
  const [sending, setSending] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const res = await apiFetch(`/api/items/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Item not found");
        setItem(data);

        if (data?.location) {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
              data.location
            )}`
          );
          const geoData = await geoRes.json();
          if (geoData?.length > 0) {
            setCoords([parseFloat(geoData[0].lat), parseFloat(geoData[0].lon)]);
          }
        }
      } catch (error) {
        console.error(error);
        showToast("Failed to load item");
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  const handleContactOwner = async () => {
    if (!item?.user?._id) {
      showToast("Owner info not available");
      return;
    }

    if (!token) {
      showToast("Please login first");
      return;
    }

    try {
      setSending(true);
      const res = await apiFetch(`/api/notifications/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          senderId: userId,
          receiverId: item.user._id,
          message: `${userName || "Someone"} is interested in your item: ${item.title}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send notification");
      }

      navigate(`/chat/${item.user._id}`);
    } catch (error) {
      console.error(error);
      showToast(error.message || "Failed to contact owner");
    } finally {
      setSending(false);
    }
  };

  const isListingOwner =
    item && (String(item.user?._id) === String(userId) || String(item.user) === String(userId));

  const canRequestVerification =
    item &&
    !isListingOwner &&
    item.status === "verified" &&
    (!item.claim?.status || item.claim.status === "none" || item.claim.status === "rejected");

  const handleVerifySubmit = async (payload) => {
    if (!token) {
      showToast("Please login first");
      return;
    }
    setVerifyLoading(true);
    try {
      const data = await submitOwnerVerification(item._id, payload);
      setItem(data.item);
      setVerifyOpen(false);
      showToast("Ownership verification submitted");
    } catch (err) {
      showToast(err.message || "Submission failed");
    } finally {
      setVerifyLoading(false);
    }
  };

  if (loading) return <UiLoader text="Loading item details..." />;

  if (!item) {
    return (
      <PageTransition>
        <div className="text-center mt-20 text-red-500">Item not found</div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg border p-5 sm:p-6">
          <img
            src={item.image || "https://dummyimage.com/700x400/e5e7eb/6b7280"}
            onClick={() => item.image && setSelectedImage(item.image)}
            alt={item.title}
            className="w-full h-72 object-cover rounded-xl mb-5 cursor-pointer"
          />

          <div className="flex flex-wrap justify-between items-start gap-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-blue-700">{item.title}</h2>
            <span
              className={`px-3 py-1 rounded-full text-xs capitalize ${
                item.type === "lost"
                  ? "bg-rose-100 text-rose-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {item.type}
            </span>
          </div>

          <p className="text-slate-700 mt-3">{item.description}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 text-sm text-slate-600">
            <p><b>Category:</b> {item.category}</p>
            <p><b>Location:</b> {item.location}</p>
            <p><b>Date:</b> {item.date}</p>
            <p><b>Time:</b> {item.time}</p>
            <p><b>Status:</b> {item.status || "reported"}</p>
          </div>

          <div className="mt-4">
            <ReporterContact user={item.user} />
          </div>

          {item.claim?.status && item.claim.status !== "none" ? (
            <div className="mt-4">
              <ClaimProofSummary claim={item.claim} />
            </div>
          ) : null}

          {claimStatusLabel(item.claim) ? (
            <p className="mt-3 text-sm font-medium text-violet-700">
              {claimStatusLabel(item.claim)}
            </p>
          ) : null}

          <div className="mt-6 rounded-xl overflow-hidden border">
            <MapContainer center={coords} zoom={13} style={{ height: "300px", width: "100%" }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={coords}>
                <Popup>{item.location}</Popup>
              </Marker>
            </MapContainer>
          </div>

          <div className="mt-6 space-y-3">
            {canRequestVerification ? (
              <button
                type="button"
                onClick={() => setVerifyOpen(true)}
                className="w-full py-3 rounded-xl text-white font-semibold bg-violet-600 hover:bg-violet-700"
              >
                Verify I am the owner
              </button>
            ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {phoneTelHref(item.user?.phone) ? (
              <a
                href={phoneTelHref(item.user?.phone)}
                className="py-3 rounded-xl text-center text-white font-semibold bg-blue-600 hover:bg-blue-700"
              >
                Call owner
              </a>
            ) : null}
            <button
              onClick={handleContactOwner}
              disabled={sending}
              className={`py-3 rounded-xl text-white font-semibold ${
                sending ? "bg-slate-400" : "bg-green-600 hover:bg-green-700"
              } ${item.user?.phone?.trim() ? "" : "sm:col-span-2"}`}
            >
              {sending ? "Please wait..." : "Message in app"}
            </button>
          </div>
          </div>
        </div>
      </div>

      <OwnerVerificationModal
        open={verifyOpen}
        onClose={() => setVerifyOpen(false)}
        onSubmit={handleVerifySubmit}
        loading={verifyLoading}
        itemTitle={item.title}
      />

      <AnimatePresence>
        {selectedImage && (
          <motion.div
            className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4"
            onClick={() => setSelectedImage(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <img
              src={selectedImage}
              alt="full"
              className="max-w-[92%] max-h-[92%] rounded-lg shadow-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <UiToast message={toast} />
    </PageTransition>
  );
}

export default ItemDetails;