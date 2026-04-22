import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AdminLayout from "../../components/AdminLayout";

const API_BASE = "http://localhost:8000";

const formatDateTime = (value) => {
  if (!value) return "\u2014";
  return new Date(value).toLocaleString();
};

const statusStyles = {
  queued: "bg-amber-50 text-amber-700",
  processing: "bg-sky-50 text-sky-700",
  completed: "bg-emerald-50 text-emerald-700",
  completed_with_errors: "bg-orange-50 text-orange-700",
  failed: "bg-rose-50 text-rose-700",
  draft: "bg-gray-100 text-gray-600",
};

const EmailCampaigns = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("admin_token");

  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    heading: "",
    body: "",
    cta_label: "",
    cta_url: "",
  });

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/admin/email-campaigns`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch campaigns");

      const result = await response.json();
      setCampaigns(result.data || []);
    } catch (error) {
      toast.error("Failed to load campaigns");
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const totals = useMemo(() => {
    return campaigns.reduce(
      (acc, campaign) => {
        acc.sent += Number(campaign.sent_count || 0);
        acc.failed += Number(campaign.failed_count || 0);
        return acc;
      },
      { sent: 0, failed: 0 }
    );
  }, [campaigns]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);

      const response = await fetch(`${API_BASE}/api/admin/email-campaigns`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 422 && result.errors) {
          Object.values(result.errors)
            .flat()
            .forEach((message) => toast.error(message));
          return;
        }

        throw new Error(result.message || "Failed to queue campaign");
      }

      toast.success(result.message || "Campaign queued successfully");
      setFormData({
        subject: "",
        heading: "",
        body: "",
        cta_label: "",
        cta_url: "",
      });
      fetchCampaigns();
    } catch (error) {
      toast.error(error.message || "Failed to queue campaign");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 py-8">
        <div className="rounded-xl border border-gray-200 bg-gray-100 px-6 py-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Email Campaigns</h1>
              <p className="mt-1 text-sm text-gray-600">
                Create one campaign and send it to all active newsletter subscribers.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white px-4 py-3 text-sm shadow-sm ring-1 ring-gray-200">
                <span className="font-semibold text-gray-900">{campaigns.length}</span> campaigns
              </div>
              <div className="rounded-xl bg-white px-4 py-3 text-sm shadow-sm ring-1 ring-gray-200">
                <span className="font-semibold text-gray-900">{totals.sent}</span> emails sent
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-5">
              <h2 className="text-lg font-semibold text-gray-900">Create Campaign</h2>
              <p className="mt-1 text-sm text-gray-500">
                Active newsletter subscribers will receive this email when you queue the campaign.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Subject</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Weekend offers from The Wooden Plate"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Heading</label>
                <input
                  type="text"
                  name="heading"
                  value={formData.heading}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="A special update for our regulars"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Message Body</label>
                <textarea
                  name="body"
                  value={formData.body}
                  onChange={handleChange}
                  required
                  rows={10}
                  className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Write the email message that all subscribers should receive..."
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">CTA Button Label</label>
                  <input
                    type="text"
                    name="cta_label"
                    value={formData.cta_label}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Order now"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">CTA Button URL</label>
                  <input
                    type="url"
                    name="cta_url"
                    value={formData.cta_url}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/menu"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
                This campaign will be queued for all active newsletter subscribers. Make sure your mail
                settings and queue worker are running before sending.
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Queueing campaign..." : "Queue Campaign"}
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-5">
              <h2 className="text-lg font-semibold text-gray-900">Campaign History</h2>
              <p className="mt-1 text-sm text-gray-500">
                Review past sends, delivery progress, and any errors.
              </p>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="text-sm text-gray-600">Loading campaigns...</div>
              ) : campaigns.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 px-4 py-10 text-center text-sm text-gray-500">
                  No email campaigns have been created yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {campaigns.map((campaign) => (
                    <button
                      key={campaign.id}
                      type="button"
                      onClick={() => navigate(`/admin/email-campaigns/${campaign.id}`)}
                      className="w-full rounded-2xl border border-gray-200 p-4 text-left transition hover:border-blue-200 hover:bg-blue-50/50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-900">{campaign.subject}</p>
                          <p className="mt-1 text-sm text-gray-500">
                            {campaign.heading || "No custom heading"}
                          </p>
                        </div>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            statusStyles[campaign.status] || statusStyles.draft
                          }`}
                        >
                          {campaign.status.replaceAll("_", " ")}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-3 text-sm text-gray-600">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-400">Recipients</p>
                          <p className="mt-1 font-semibold text-gray-900">{campaign.total_recipients}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-400">Sent</p>
                          <p className="mt-1 font-semibold text-emerald-700">{campaign.sent_count}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-400">Failed</p>
                          <p className="mt-1 font-semibold text-rose-700">{campaign.failed_count}</p>
                        </div>
                      </div>

                      <p className="mt-4 text-xs text-gray-400">
                        Queued: {formatDateTime(campaign.queued_at || campaign.created_at)}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default EmailCampaigns;
