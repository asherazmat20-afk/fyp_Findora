import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ACCENT = {
  blue: {
    btn: "bg-blue-600 hover:bg-blue-700",
    outline: "border-blue-200 text-blue-700 hover:bg-blue-50",
    file: "file:bg-blue-100 file:text-blue-700",
  },
  emerald: {
    btn: "bg-emerald-600 hover:bg-emerald-700",
    outline: "border-emerald-200 text-emerald-700 hover:bg-emerald-50",
    file: "file:bg-emerald-100 file:text-emerald-700",
  },
};

const readFilePreview = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const dataUrlToFile = (dataUrl, filename = "camera-capture.jpg") => {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] || "image/jpeg";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], filename, { type: mime });
};

export default function ImageCaptureUpload({
  label = "Item photo (optional but recommended)",
  accent = "blue",
  inputKey = 0,
  preview = null,
  onSelect,
  onClear,
}) {
  const theme = ACCENT[accent] || ACCENT.blue;
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const closeCamera = useCallback(() => {
    stopCamera();
    setCameraOpen(false);
    setCameraError("");
  }, [stopCamera]);

  const emitSelection = useCallback(
    async (file) => {
      if (!file) return;
      const previewUrl = await readFilePreview(file);
      onSelect?.({ file, preview: previewUrl });
    },
    [onSelect]
  );

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await emitSelection(file);
    e.target.value = "";
  };

  const startCamera = async () => {
    setCameraError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      cameraInputRef.current?.click();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOpen(true);
    } catch {
      cameraInputRef.current?.click();
    }
  };

  useEffect(() => {
    if (!cameraOpen || !videoRef.current || !streamRef.current) return undefined;

    const video = videoRef.current;
    video.srcObject = streamRef.current;
    video.play().catch(() => {
      setCameraError("Could not start camera preview.");
    });

    return undefined;
  }, [cameraOpen]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const captureFromCamera = async () => {
    const video = videoRef.current;
    if (!video?.videoWidth) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    const file = dataUrlToFile(dataUrl);
    closeCamera();
    await emitSelection(file);
  };

  return (
    <motion.div layout className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      <motion.div layout className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${theme.btn}`}
        >
          Upload file
        </button>
        <button
          type="button"
          onClick={startCamera}
          className={`px-4 py-2 rounded-lg text-sm font-medium border ${theme.outline}`}
        >
          Take photo
        </button>
        {preview && onClear ? (
          <button
            type="button"
            onClick={onClear}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            Remove
          </button>
        ) : null}
      </motion.div>

      <input
        key={`file-${inputKey}`}
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        key={`camera-${inputKey}`}
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      <AnimatePresence mode="wait">
        {preview ? (
          <motion.img
            key="preview"
            src={preview}
            alt="Selected item"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="w-full h-52 object-cover rounded-xl border"
          />
        ) : (
          <motion.div
            key="placeholder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-gray-400 text-sm gap-1"
          >
            <span>No image selected</span>
            <span className="text-xs text-gray-400">Upload a file or use your camera</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {cameraOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
            onClick={closeCamera}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div layout className="p-4 border-b">
                <h3 className="font-semibold text-gray-800">Take a photo</h3>
                <p className="text-sm text-gray-500 mt-1">Position the item in frame, then capture</p>
              </motion.div>

              <div className="bg-black aspect-[4/3] relative">
                <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
              </div>

              {cameraError ? (
                <p className="px-4 py-2 text-sm text-red-600">{cameraError}</p>
              ) : null}

              <div className="p-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeCamera}
                  className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={captureFromCamera}
                  className={`px-4 py-2 rounded-lg text-white ${theme.btn}`}
                >
                  Capture
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
