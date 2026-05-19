import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageTransition from "../components/PageTransition";
import UiLoader from "../components/UiLoader";
import UiToast from "../components/UiToast";
import { apiFetch } from "../utils/apiClient";
import { getSession } from "../utils/auth";

function Notifications() {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [clearing, setClearing] = useState(false);

  const { userId, token } = getSession();
  const navigate = useNavigate();
  const foundItemAlerts = notifs.filter((n) => n.type === "found_item_alert");
  const otherNotifications = notifs.filter((n) => n.type !== "found_item_alert");

  const openNotification = (notif) => {
    if (notif.type === "found_item_alert" && notif.itemId) {
      navigate(`/item/${notif.itemId}`);
      return;
    }

    if (notif.sender) {
      navigate(`/chat/${notif.sender}`);
    }
  };

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await apiFetch(`/api/notifications/me`);

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load notifications");

        setNotifs(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        setToast(error.message || "Failed to fetch notifications");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifs();
  }, [userId, token]);

  const handleClearNotifications = async () => {
    if (!token || clearing || notifs.length === 0) return;

    try {
      setClearing(true);
      const res = await apiFetch(`/api/notifications/clear`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to clear notifications");

      setNotifs([]);
      setToast("Notifications cleared");
    } catch (error) {
      console.error(error);
      setToast(error.message || "Failed to clear notifications");
    } finally {
      setClearing(false);
    }
  };

  if (loading) return <UiLoader text="Loading notifications..." />;

  return (
    <PageTransition>
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between gap-3 mb-5">
            <h2 className="text-2xl font-bold text-violet-700">Notifications</h2>
            <button
              onClick={handleClearNotifications}
              disabled={clearing || notifs.length === 0}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                clearing || notifs.length === 0
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-rose-500 text-white hover:bg-rose-600"
              }`}
            >
              {clearing ? "Clearing..." : "Clear Notifications"}
            </button>
          </div>

          {notifs.length === 0 ? (
            <div className="bg-white border border-dashed rounded-xl p-8 text-center text-slate-500">
              No notifications yet.
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-emerald-700">Found Item Alerts</h3>
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                    {foundItemAlerts.length}
                  </span>
                </div>

                {foundItemAlerts.length === 0 ? (
                  <div className="bg-white border border-dashed rounded-xl p-5 text-sm text-slate-500">
                    No found-item alerts yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {foundItemAlerts.map((n) => (
                      <div
                        key={n._id}
                        onClick={() => openNotification(n)}
                        className="bg-emerald-50 p-4 rounded-xl shadow-sm border border-emerald-100 cursor-pointer hover:bg-emerald-100/60"
                      >
                        <p className="text-slate-700">{n.message}</p>
                        <p className="text-xs text-emerald-700 mt-2">Open item details</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(n.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-violet-700">Other Notifications</h3>
                  <span className="text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded-full">
                    {otherNotifications.length}
                  </span>
                </div>

                {otherNotifications.length === 0 ? (
                  <div className="bg-white border border-dashed rounded-xl p-5 text-sm text-slate-500">
                    No other notifications yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {otherNotifications.map((n) => (
                      <div
                        key={n._id}
                        onClick={() => openNotification(n)}
                        className="bg-white p-4 rounded-xl shadow-sm border cursor-pointer hover:bg-slate-50"
                      >
                        <p className="text-slate-700">{n.message}</p>
                        <p className="text-xs text-violet-700 mt-2">
                          {n.sender ? "Open chat" : "Notification"}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(n.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <UiToast message={toast} />
    </PageTransition>
  );
}

export default Notifications;