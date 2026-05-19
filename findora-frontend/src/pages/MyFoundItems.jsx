import { useEffect, useState } from "react";
import PageTransition from "../components/PageTransition";
import UiLoader from "../components/UiLoader";
import UiToast from "../components/UiToast";
import { apiFetch } from "../utils/apiClient";
import { getSession } from "../utils/auth";

function MyFoundItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  const { userId } = getSession();

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await apiFetch(`/api/items`);
        const data = await res.json();

        const myFound = Array.isArray(data)
          ? data.filter(
              (item) =>
                (item.user?._id === userId || item.user === userId) &&
                item.type?.toLowerCase() === "found"
            )
          : [];

        setItems(myFound);
      } catch (error) {
        console.error(error);
        setToast("Failed to load found items");
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [userId]);

  if (loading) return <UiLoader text="Loading your found items..." />;

  return (
    <PageTransition>
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-5 text-emerald-700">My Found Items</h2>

          {items.length === 0 ? (
            <div className="bg-white border border-dashed rounded-xl p-8 text-center text-slate-500">
              No found items yet.
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-5">
              {items.map((item) => (
                <div key={item._id} className="bg-white rounded-xl shadow-sm border p-4">
                  <img
                    src={item.image || "https://dummyimage.com/300"}
                    alt={item.title}
                    className="w-full h-40 object-cover rounded-lg mb-3"
                  />
                  <h3 className="font-bold">{item.title}</h3>
                  <p className="text-sm text-slate-600">{item.description}</p>
                  <p className="text-xs text-slate-500 mt-2 capitalize">
                    Status: {item.status || "pending"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <UiToast message={toast} />
    </PageTransition>
  );
}

export default MyFoundItems;