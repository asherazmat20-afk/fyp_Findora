import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PageTransition from "../components/PageTransition";

function Home() {
  const role = sessionStorage.getItem("role");

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight text-slate-900">
                Smart Lost & Found, <span className="text-blue-600">Reimagined</span>
              </h1>
              <p className="mt-4 text-slate-600 text-lg max-w-xl">
                Report, match, and recover items faster with a clean experience, smart filters,
                and secure in-app communication.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/report-lost"
                  className="px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
                >
                  Report Lost Item
                </Link>
                <Link
                  to="/report-found"
                  className="px-5 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition"
                >
                  Report Found Item
                </Link>
                <Link
                  to={role === "admin" ? "/admin" : "/dashboard"}
                  className="px-5 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition"
                >
                  Go to Dashboard
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-lg border p-6"
            >
              <h3 className="text-xl font-bold text-slate-800">Why Findora stands out</h3>
              <ul className="mt-4 space-y-3 text-slate-600">
                <li>• Smart multi-filter search with quick previews</li>
                <li>• Recovery-focused dashboards for users and admins</li>
                <li>• Secure chat for safe item handover coordination</li>
                <li>• Verification workflow for trust and fraud prevention</li>
              </ul>
            </motion.div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-800 mb-8">
            Core Features
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Smart Reporting",
                desc: "Guided multi-step forms with better quality reports.",
              },
              {
                title: "Fast Matching",
                desc: "Find relevant results quickly with filters and confidence hints.",
              },
              {
                title: "Moderation Console",
                desc: "Admins verify, reject, and prioritize reports efficiently.",
              },
            ].map((f) => (
              <div key={f.title} className="bg-white border rounded-2xl p-5 shadow-sm">
                <h3 className="font-bold text-blue-700">{f.title}</h3>
                <p className="text-slate-600 mt-2">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageTransition>
  );
}

export default Home;