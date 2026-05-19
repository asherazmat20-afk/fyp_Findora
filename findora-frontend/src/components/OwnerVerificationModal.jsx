import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function OwnerVerificationModal({
  open,
  onClose,
  onSubmit,
  loading,
  itemTitle = "this item",
}) {
  const [proofDescription, setProofDescription] = useState("");
  const [identifyingDetails, setIdentifyingDetails] = useState("");
  const [proofImage, setProofImage] = useState(null);
  const [preview, setPreview] = useState(null);

  const reset = () => {
    setProofDescription("");
    setIdentifyingDetails("");
    setProofImage(null);
    setPreview(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result;
      setProofImage(base64);
      setPreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      proofDescription: proofDescription.trim(),
      identifyingDetails: identifyingDetails.trim(),
      proofImage,
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4"
          onClick={handleClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-5 max-h-[90vh] overflow-y-auto"
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 12, opacity: 0 }}
          >
            <h3 className="text-xl font-bold text-slate-800">Verify ownership</h3>
            <p className="text-sm text-slate-500 mt-1 mb-4">
              Prove you own <span className="font-medium">{itemTitle}</span>. The listing owner and
              admin will review your submission.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  How can you prove ownership? *
                </label>
                <textarea
                  rows={4}
                  value={proofDescription}
                  onChange={(e) => setProofDescription(e.target.value)}
                  placeholder="e.g. serial number, unique scratches, contents of wallet, purchase receipt details..."
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  required
                  minLength={15}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Identifying details (optional)
                </label>
                <input
                  type="text"
                  value={identifyingDetails}
                  onChange={(e) => setIdentifyingDetails(e.target.value)}
                  placeholder="Color, brand, IMEI last 4 digits..."
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Proof photo (optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImage}
                  className="w-full text-sm"
                />
                {preview && (
                  <img
                    src={preview}
                    alt="Proof preview"
                    className="mt-2 h-32 w-full object-cover rounded-lg border"
                  />
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || proofDescription.trim().length < 15}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm disabled:opacity-60"
                >
                  {loading ? "Submitting..." : "Submit verification"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
