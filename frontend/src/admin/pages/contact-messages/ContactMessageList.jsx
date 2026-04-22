import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AdminLayout from "../../components/AdminLayout";

const API_BASE = "http://localhost:8000";

const formatDateTime = (value) => {
  if (!value) return "\u2014";
  return new Date(value).toLocaleString();
};

const ContactMessageList = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("admin_token");

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);

        const res = await fetch(`${API_BASE}/api/admin/contact-messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch messages");

        const result = await res.json();
        setMessages(result.data || []);
      } catch (error) {
        toast.error("Failed to load contact messages");
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [token]);

  const totalPages = useMemo(
    () => Math.ceil(messages.length / itemsPerPage) || 1,
    [messages.length, itemsPerPage]
  );

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMessages = messages.slice(startIndex, startIndex + itemsPerPage);

  const unreadCount = useMemo(
    () => messages.filter((message) => !message.is_read).length,
    [messages]
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleItemsPerPageChange = (event) => {
    setItemsPerPage(Number(event.target.value));
    setCurrentPage(1);
  };

  return (
    <AdminLayout>
      <div className="flex-1 py-8">
        <div className="w-full px-4 md:px-8">
          <div className="mb-6 rounded-xl border border-gray-200 bg-gray-100 px-6 py-5 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Contact Messages</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Review customer inquiries and reply from the admin panel.
                </p>
              </div>

              <div className="rounded-xl bg-white px-4 py-3 text-sm shadow-sm ring-1 ring-gray-200">
                <span className="font-semibold text-gray-900">{messages.length}</span> total
                <span className="mx-2 text-gray-300">|</span>
                <span className="font-semibold text-amber-600">{unreadCount}</span> unread
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
              <p className="text-sm font-medium text-gray-900">
                Inbox <span className="font-normal text-gray-400">({messages.length})</span>
              </p>

              {messages.length > 0 && (
                <select
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                </select>
              )}
            </div>

            {loading ? (
              <div className="p-8 text-sm text-gray-600">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <p className="font-semibold text-gray-900">No contact messages yet</p>
                <p className="mt-1 text-sm text-gray-500">
                  Customer inquiries will appear here after they use the Contact Us form.
                </p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full border-separate border-spacing-0">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                      <th className="border-r border-gray-200 px-4 py-3">Customer</th>
                      <th className="border-r border-gray-200 px-4 py-3">Email</th>
                      <th className="border-r border-gray-200 px-4 py-3">Message</th>
                      <th className="border-r border-gray-200 px-4 py-3">Status</th>
                      <th className="border-r border-gray-200 px-4 py-3">Received</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-gray-700">
                    {paginatedMessages.map((message) => (
                      <tr key={message.id} className="hover:bg-gray-50">
                        <td className="border-r border-t border-gray-200 px-4 py-3">
                          <div className="font-semibold text-gray-900">{message.name}</div>
                          <div className="mt-1 text-xs text-gray-500">#{message.id}</div>
                        </td>
                        <td className="border-r border-t border-gray-200 px-4 py-3">{message.email}</td>
                        <td className="border-r border-t border-gray-200 px-4 py-3">
                          <p className="max-w-md truncate">{message.message}</p>
                        </td>
                        <td className="border-r border-t border-gray-200 px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                message.is_read
                                  ? "bg-blue-50 text-blue-700"
                                  : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              {message.is_read ? "Read" : "Unread"}
                            </span>
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                message.replied_at
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {message.replied_at ? "Replied" : "Pending reply"}
                            </span>
                          </div>
                        </td>
                        <td className="border-r border-t border-gray-200 px-4 py-3">
                          {formatDateTime(message.created_at)}
                        </td>
                        <td className="border-t border-gray-200 px-4 py-3">
                          <div className="flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => navigate(`/admin/contact-messages/${message.id}`)}
                              className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
                            >
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && messages.length > 0 && (
              <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row">
                <p className="text-sm text-gray-600">
                  Showing <span className="font-semibold text-gray-900">{startIndex + 1}</span> to{" "}
                  <span className="font-semibold text-gray-900">
                    {Math.min(startIndex + itemsPerPage, messages.length)}
                  </span>{" "}
                  of <span className="font-semibold text-gray-900">{messages.length}</span> messages
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled
                    className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white"
                  >
                    {currentPage} / {totalPages}
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ContactMessageList;
