import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="max-w-6xl mx-auto px-6 py-10 grid md:grid-cols-3 gap-8">

        {/* Logo + About */}
        <div>
          <h2 className="text-2xl font-bold text-white">Findora</h2>
          <p className="mt-2 text-sm">
            Smart Lost & Found platform helping people reconnect with their belongings.
          </p>
        </div>

        {/* Links */}
        <div>
          <h3 className="text-white font-semibold mb-2">Quick Links</h3>
          <ul className="space-y-1 text-sm">
            <li><Link to="/" className="hover:text-white">Home</Link></li>
            <li><Link to="/search" className="hover:text-white">Search</Link></li>
            <li><Link to="/report-lost" className="hover:text-white">Report Lost</Link></li>
            <li><Link to="/report-found" className="hover:text-white">Report Found</Link></li>
          </ul>
        </div>

        {/* Info */}
        <div>
          <h3 className="text-white font-semibold mb-2">Contact</h3>
          <p className="text-sm">Email: support@findora.com</p>
          <p className="text-sm">Location: Pakistan</p>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-gray-700 text-center py-4 text-sm">
        © 2026 Findora. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;