import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import PageTransition from "../components/PageTransition";
import UiLoader from "../components/UiLoader";
import UiToast from "../components/UiToast";
import { apiFetch, parseApiJson } from "../utils/apiClient";

function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyUserId, setBusyUserId] = useState(null);
  const [toast, setToast] = useState("");

  const token = sessionStorage.getItem("token");
  const role = sessionStorage.getItem("role");
  const currentUserId = sessionStorage.getItem("userId");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  const requestHeaders = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token]
  );

  const handleUnauthorized = useCallback(() => {
    sessionStorage.clear();
    navigate("/admin-login");
  }, [navigate]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      if (!token || role !== "admin") {
        navigate("/admin-login");
        return;
      }

      const res = await apiFetch(`/api/admin/users`, { headers: requestHeaders });

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }

      const data = await parseApiJson(res);
      if (!res.ok) throw new Error(data.error || "Failed to load users");

      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [handleUnauthorized, navigate, requestHeaders, role, token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const deleteUser = async (user) => {
    const confirmed = window.confirm(
      `Delete "${user.fullName}" (${user.email})?\n\nThis removes their account, reports, messages, and notifications permanently.`
    );
    if (!confirmed) return;

    const previous = users;
    setBusyUserId(user._id);
    setUsers((prev) => prev.filter((u) => u._id !== user._id));

    try {
      const res = await apiFetch(`/api/admin/users/${user._id}`, {
        method: "DELETE",
        headers: requestHeaders,
      });

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }

      const data = await parseApiJson(res);
      if (!res.ok) throw new Error(data.error || "Delete failed");

      showToast("User removed");
    } catch (err) {
      setUsers(previous);
      showToast(err.message || "Delete failed");
    } finally {
      setBusyUserId(null);
    }
  };

  const filteredUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.fullName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q)
    );
  }, [users, searchTerm]);

  const stats = useMemo(
    () => ({
      total: users.length,
      regular: users.filter((u) => u.role === "user").length,
      admins: users.filter((u) => u.role === "admin").length,
    }),
    [users]
  );

  if (loading) return <UiLoader text="Loading users..." />;

  return (
    <PageTransition>
      <motion.div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50 p-6">
        <motion.div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <motion.div>
              <h2 className="text-3xl font-extrabold text-red-600">User Management</h2>
              <p className="text-slate-500 mt-1">
                Review accounts and remove suspicious or fraudulent users
              </p>
            </motion.div>
            <Link
              to="/admin"
              className="inline-flex justify-center px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-sm font-medium"
            >
              Back to moderation
            </Link>
          </motion.div>

          {error ? (
            <motion.div className="mb-6 bg-red-100 text-red-700 px-4 py-3 rounded-lg">{error}</motion.div>
          ) : null}

          <motion.div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: "Total users", value: stats.total },
              { label: "Members", value: stats.regular },
              { label: "Admins", value: stats.admins },
            ].map((card) => (
              <motion.div
                key={card.label}
                whileHover={{ y: -2 }}
                className="bg-white border rounded-xl shadow-sm p-4"
              >
                <p className="text-xs text-slate-500">{card.label}</p>
                <p className="text-2xl font-bold text-slate-800">{card.value}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div className="bg-white border rounded-xl p-4 shadow-sm mb-6">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or role..."
              className="w-full px-4 py-2 border rounded-lg"
            />
          </motion.div>

          <motion.div className="bg-white border rounded-xl shadow-sm overflow-hidden">
            <motion.div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Name</th>
                    <th className="text-left px-4 py-3 font-medium">Email</th>
                    <th className="text-left px-4 py-3 font-medium">Role</th>
                    <th className="text-left px-4 py-3 font-medium">Reports</th>
                    <th className="text-left px-4 py-3 font-medium">Joined</th>
                    <th className="text-right px-4 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                        No users match your search
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const isSelf = String(user._id) === String(currentUserId);
                      const isAdminUser = user.role === "admin";
                      const canDelete = !isSelf && !isAdminUser;

                      return (
                        <tr key={user._id} className="border-t hover:bg-slate-50/80">
                          <td className="px-4 py-3 font-medium text-slate-800">{user.fullName}</td>
                          <td className="px-4 py-3 text-slate-600">{user.email}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                                isAdminUser
                                  ? "bg-red-100 text-red-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {user.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{user.reportCount ?? 0}</td>
                          <td className="px-4 py-3 text-slate-500">
                            {user.createdAt
                              ? new Date(user.createdAt).toLocaleDateString()
                              : "—"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {canDelete ? (
                              <button
                                type="button"
                                disabled={busyUserId === user._id}
                                onClick={() => deleteUser(user)}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
                              >
                                {busyUserId === user._id ? "Removing..." : "Delete user"}
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400">
                                {isSelf ? "You" : "Protected"}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>

      <UiToast message={toast} />
    </PageTransition>
  );
}

export default AdminUsers;
