import { AnimatePresence, motion } from "framer-motion";

function UiToast({ message }) {
  return (
    <AnimatePresence>
      {message ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg z-[100]"
        >
          {message}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default UiToast;