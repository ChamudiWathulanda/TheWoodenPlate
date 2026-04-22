import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import AdminLayout from "../../components/AdminLayout";

const API_BASE = "http://localhost:8000";

const formatDateTime = (value) => {
  if (!value) return "\u2014";
  return new Date(value).toLocaleString();
};

const statusStyles = {
  pending: "bg-amber-50 text-amber-700",
  sent: "bg-emerald-50 text-emerald-700",
  failed: "bg-rose-50 text-rose-700",
  queued: "bg-amber-50 text-amber-700",
  processing: "bg-sky-50 text-sky-700",
  completed: "bg-emerald-50 text-emerald-700",
  completed_with_errors: "bg-orange-50 text-orange-700",
  failed_campaign: "bg-rose-50 text-rose-700",
};

const ViewEmailCampaign = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const token = localStorage.getItem("admin_token");

  const [campaign, setCampaign] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        setLoading(true);

        const response = await fetch(`${API_BASE}/api/admin/email-campaigns/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error("Failed to load campaign");

        const result = await response.json();
        setCampaign(result.data?.campaign || null);
        setLogs(result.data?.logs || []);
      } catch (error) {
        toast.error("Failed to load campaign details");
        navigate("/admin/email-campaigns");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCampaign();
    }
  }, [id, navigate, token]);

  const summary = useMemo(() => {
    return logs.reduce(
      (acc, log) => {
        acc[log.status] = (acc[log.status] || 0) + 1;
        return acc;
      },
      { pending: 0, sent: 0, failed: 0 }
    );
  }, [logs]);

  return (
    <AdminLayout>
      <div className="space-y-6 py-8">
        <div className="rounded-xl border border-gray-200 bg-gray-100 px-6 py-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Campaign Details</h1>
              <p className="mt-1 text-sm text-gray-600">
                Review the campaign content and subscriber delivery logs.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/admin/email-campaigns")}
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-800 transition hover:bg-gray-50"
            >
              Back to Campaigns
            </button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-gray-600 shadow-sm">
            Loading campaign...
          </div>
        ) : !campaign ? null : (
          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-6">
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{campaign.subject}</h2>
                      <p className="mt-1 text-sm text-gray-500">{campaign.heading || "No custom heading"}</p>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        statusStyles[campaign.status] || statusStyles.failed_campaign
                      }`}
                    >
                      {campaign.status.replaceAll("_", " ")}
                    </span>
                  </div>
                </div>

                <div className="space-y-5 p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <InfoCard label="Recipients" value={campaign.total_recipients} />
                    <InfoCard label="Sent" value={campaign.sent_count} />
                    <InfoCard label="Failed" value={campaign.failed_count} />
                    <InfoCard label="Created By" value={campaign.creator?.name || "\u2014"} />
                    <InfoCard label="Queued At" value={formatDateTime(campaign.queued_at)} />
                    <InfoCard label="Finished At" value={formatDateTime(campaign.sent_at)} />
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Message Body</p>
                    <div className="whitespace-pre-line rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 text-sm leading-7 text-gray-900">
                      {campaign.body}
                    </div>
                  </div>

                  {(campaign.cta_label || campaign.cta_url) && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <InfoCard label="CTA Label" value={campaign.cta_label || "\u2014"} />
                      <InfoCard label="CTA URL" value={campaign.cta_url || "\u2014"} />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Delivery Logs</h2>
                    <p className="mt-1 text-sm text-gray-500">Track which subscribers received this campaign.</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <StatPill label="Pending" value={summary.pending} tone="amber" />
                    <StatPill label="Sent" value={summary.sent} tone="emerald" />
                    <StatPill label="Failed" value={summary.failed} tone="rose" />
                  </div>
                </div>
              </div>

              <div className="max-h-[42rem] overflow-y-auto p-6">
                {logs.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
                    No delivery logs found for this campaign yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {logs.map((log) => (
                      <div key={log.id} className="rounded-2xl border border-gray-200 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-gray-900">{log.email}</p>
                            <p className="mt-1 text-xs text-gray-400">
                              Subscriber active: {log.subscriber?.is_active ? "Yes" : "No"}
                            </p>
                          </div>
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              statusStyles[log.status] || statusStyles.pending
                            }`}
                          >
                            {log.status}
                          </span>
                        </div>

                        <div className="mt-3 grid grid-cols-1 gap-3 text-sm text-gray-600 md:grid-cols-2">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-gray-400">Sent At</p>
                            <p className="mt-1">{formatDateTime(log.sent_at)}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-gray-400">Updated At</p>
                            <p className="mt-1">{formatDateTime(log.updated_at)}</p>
                          </div>
                        </div>

                        {log.error_message && (
                          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            {log.error_message}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

const InfoCard = ({ label, value }) => (
  <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
    <p className="mt-2 break-words text-sm font-semibold text-gray-900">{value}</p>
  </div>
);

const StatPill = ({ label, value, tone }) => {
  const tones = {
    amber: "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
  };

  return (
    <div className={`rounded-xl px-3 py-2 text-center font-semibold ${tones[tone]}`}>
      <p className="text-[11px] uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-sm">{value}</p>
    </div>
  );
};

export default ViewEmailCampaign;
