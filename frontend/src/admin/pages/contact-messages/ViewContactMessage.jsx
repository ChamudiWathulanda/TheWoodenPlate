import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import AdminLayout from "../../components/AdminLayout";

const API_BASE = "http://localhost:8000";

const formatDateTime = (value) => {
  if (!value) return "\u2014";
  return new Date(value).toLocaleString();
};

const ViewContactMessage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const token = localStorage.getItem("admin_token");

  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sendingReply, setSendingReply] = useState(false);
  const [replyForm, setReplyForm] = useState({
    reply_subject: "",
    reply_message: "",
  });

  useEffect(() => {
    const fetchMessage = async () => {
      try {
        setLoading(true);

        const res = await fetch(`${API_BASE}/api/admin/contact-messages/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch message");

        const result = await res.json();
        const data = result.data || null;

        setMessage(data);
        setReplyForm({
          reply_subject: data?.reply_subject || "Reply from The Wooden Plate",
          reply_message: data?.reply_message || "",
        });
      } catch (error) {
        toast.error("Failed to load contact message");
        navigate("/admin/contact-messages");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchMessage();
    }
  }, [id, navigate, token]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setReplyForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleReplySubmit = async (event) => {
    event.preventDefault();

    if (!replyForm.reply_message.trim()) {
      toast.error("Please enter a reply message");
      return;
    }

    try {
      setSendingReply(true);

      const res = await fetch(`${API_BASE}/api/admin/contact-messages/${id}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reply_subject: replyForm.reply_subject,
          reply_message: replyForm.reply_message,
        }),
      });

      if (!res.ok) throw new Error("Failed to send reply");

      const result = await res.json();
      const updatedMessage = result.data || message;
      setMessage(updatedMessage);
      setReplyForm((prev) => ({
        ...prev,
        reply_subject: updatedMessage.reply_subject || prev.reply_subject,
        reply_message: updatedMessage.reply_message || prev.reply_message,
      }));
      toast.success("Reply sent successfully");
    } catch (error) {
      toast.error("Failed to send reply");
    } finally {
      setSendingReply(false);
    }
  };

  const Field = ({ label, value }) => (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900">
        {value || "\u2014"}
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <div className="w-full py-8">
        <div className="mb-6 rounded-xl border border-gray-200 bg-gray-100 px-6 py-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Message Details</h1>
              <p className="mt-1 text-sm text-gray-600">Read the inquiry and send a reply email to the customer.</p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/admin/contact-messages")}
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-800 transition hover:bg-gray-50"
            >
              Back to Messages
            </button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-gray-600 shadow-sm">
            Loading message...
          </div>
        ) : !message ? null : (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 p-6">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-semibold text-gray-900">{message.name}</h2>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      message.is_read ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {message.is_read ? "Read" : "Unread"}
                  </span>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      message.replied_at ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {message.replied_at ? "Replied" : "Awaiting reply"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-600">{message.email}</p>
              </div>

              <div className="space-y-6 p-6">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <Field label="Received At" value={formatDateTime(message.created_at)} />
                  <Field label="Read At" value={formatDateTime(message.read_at)} />
                  <Field label="Replied At" value={formatDateTime(message.replied_at)} />
                  <Field label="Replied By" value={message.repliedBy?.name} />
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Customer Message</p>
                  <div className="min-h-48 whitespace-pre-line rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 text-sm leading-7 text-gray-900">
                    {message.message}
                  </div>
                </div>

                {message.reply_message && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Last Reply Sent</p>
                    <div className="whitespace-pre-line rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm leading-7 text-emerald-950">
                      {message.reply_message}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900">Reply by Email</h2>
                <p className="mt-1 text-sm text-gray-600">
                  This reply will be sent directly to <span className="font-medium">{message.email}</span>.
                </p>
              </div>

              <form onSubmit={handleReplySubmit} className="space-y-5 p-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Email Subject</label>
                  <input
                    type="text"
                    name="reply_subject"
                    value={replyForm.reply_subject}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Reply from The Wooden Plate"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Reply Message</label>
                  <textarea
                    name="reply_message"
                    value={replyForm.reply_message}
                    onChange={handleChange}
                    rows={12}
                    className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Write your reply to the customer here..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={sendingReply}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sendingReply ? "Sending reply..." : "Send Reply Email"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ViewContactMessage;
