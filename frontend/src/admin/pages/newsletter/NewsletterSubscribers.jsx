import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import AdminLayout from "../../components/AdminLayout";

const API_BASE = "http://localhost:8000";

const formatDateTime = (value) => {
  if (!value) return "\u2014";
  return new Date(value).toLocaleString();
};

const NewsletterSubscribers = () => {
  const token = localStorage.getItem("admin_token");
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    const fetchSubscribers = async () => {
      try {
        setLoading(true);

        const response = await fetch(`${API_BASE}/api/admin/newsletter-subscribers`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch subscribers");

        const result = await response.json();
        setSubscribers(result.data || []);
      } catch (error) {
        toast.error("Failed to load newsletter subscribers");
        setSubscribers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscribers();
  }, [token]);

  const activeCount = useMemo(
    () => subscribers.filter((subscriber) => subscriber.is_active).length,
    [subscribers]
  );

  const inactiveCount = subscribers.length - activeCount;

  const handleToggleStatus = async (subscriber) => {
    try {
      setTogglingId(subscriber.id);

      const response = await fetch(
        `${API_BASE}/api/admin/newsletter-subscribers/${subscriber.id}/toggle-status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to update subscriber");

      const result = await response.json();
      const updated = result.data;

      setSubscribers((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );

      toast.success(updated.is_active ? "Subscriber activated" : "Subscriber deactivated");
    } catch (error) {
      toast.error("Failed to update subscriber");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="flex-1 py-8">
        <div className="w-full px-4 md:px-8">
          <div className="mb-6 rounded-xl border border-gray-200 bg-gray-100 px-6 py-5 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Newsletter Subscribers</h1>
                <p className="mt-1 text-sm text-gray-600">
                  View and manage customers who joined the newsletter.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white px-4 py-3 text-sm shadow-sm ring-1 ring-gray-200">
                  <span className="font-semibold text-gray-900">{activeCount}</span> active
                </div>
                <div className="rounded-xl bg-white px-4 py-3 text-sm shadow-sm ring-1 ring-gray-200">
                  <span className="font-semibold text-gray-900">{inactiveCount}</span> inactive
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-5 py-4">
              <p className="text-sm font-medium text-gray-900">
                Subscriber List <span className="font-normal text-gray-400">({subscribers.length})</span>
              </p>
            </div>

            {loading ? (
              <div className="p-8 text-sm text-gray-600">Loading subscribers...</div>
            ) : subscribers.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <p className="font-semibold text-gray-900">No newsletter subscribers yet</p>
                <p className="mt-1 text-sm text-gray-500">
                  New subscriptions from the customer home page will appear here.
                </p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full border-separate border-spacing-0">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                      <th className="border-r border-gray-200 px-4 py-3">Email</th>
                      <th className="border-r border-gray-200 px-4 py-3">Status</th>
                      <th className="border-r border-gray-200 px-4 py-3">Subscribed At</th>
                      <th className="border-r border-gray-200 px-4 py-3">Unsubscribed At</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-gray-700">
                    {subscribers.map((subscriber) => (
                      <tr key={subscriber.id} className="hover:bg-gray-50">
                        <td className="border-r border-t border-gray-200 px-4 py-3 font-medium text-gray-900">
                          {subscriber.email}
                        </td>
                        <td className="border-r border-t border-gray-200 px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              subscriber.is_active
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {subscriber.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="border-r border-t border-gray-200 px-4 py-3">
                          {formatDateTime(subscriber.subscribed_at || subscriber.created_at)}
                        </td>
                        <td className="border-r border-t border-gray-200 px-4 py-3">
                          {formatDateTime(subscriber.unsubscribed_at)}
                        </td>
                        <td className="border-t border-gray-200 px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(subscriber)}
                            disabled={togglingId === subscriber.id}
                            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                              subscriber.is_active
                                ? "bg-gray-100 text-gray-800 hover:bg-gray-200"
                                : "bg-emerald-600 text-white hover:bg-emerald-700"
                            } disabled:cursor-not-allowed disabled:opacity-60`}
                          >
                            {togglingId === subscriber.id
                              ? "Updating..."
                              : subscriber.is_active
                              ? "Deactivate"
                              : "Activate"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default NewsletterSubscribers;
