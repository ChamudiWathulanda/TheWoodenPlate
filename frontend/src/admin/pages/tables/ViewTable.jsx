import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import toast from "react-hot-toast";

const ViewTable = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [table, setTable] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("admin_token");

  useEffect(() => {
    const fetchTable = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `http://localhost:8000/api/admin/tables/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch table");

        const result = await response.json();
        setTable(result.data || result);
      } catch (err) {
        toast.error("Failed to load table");
        navigate("/admin/tables");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchTable();
  }, [id, navigate, token]);

  const Field = ({ label, value }) => (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold text-gray-500">{label}</p>
      <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900">
        {value || "—"}
      </div>
    </div>
  );

  return (
    <AdminLayout>
      {/* Full Width Wrapper */}
      <div className="w-full">
        {/* Header */}
        <div className="mb-6">
          <div className="w-full rounded-xl border border-gray-200 bg-gray-100 px-6 py-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Table Details
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                View table information
              </p>
            </div>

            <button
              onClick={() => navigate("/admin/tables")}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg
                         bg-white hover:bg-gray-50 border border-gray-200
                         text-gray-800 text-sm font-medium transition cursor-pointer"
            >
              ← Back to Tables
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="w-full rounded-2xl border border-gray-200 bg-white shadow-sm p-6 text-gray-600">
            Loading table...
          </div>
        ) : !table ? null : (
          <div className="w-full rounded-2xl border border-gray-200 bg-white shadow-sm">
            {/* Top Bar */}
            <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center gap-4">
              {/* Title Section */}
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-xl font-semibold text-gray-900">
                  Table #{table.table_number}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {table.chair_count} chairs
                </p>

                <div className="mt-2 flex items-center justify-center md:justify-start gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      table.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {table.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/admin/tables/${table.id}/edit`)}
                  className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition cursor-pointer"
                >
                  Edit Table
                </button>
              </div>
            </div>

            {/* Details Grid */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Table Number" value={table.table_number} />
                <Field label="Chair Count" value={`${table.chair_count} chairs`} />
                <Field label="Status" value={table.is_active ? "Active" : "Inactive"} />
                <Field
                  label="Reservations"
                  value={`${table.reservations_count || 0} reservations`}
                />

                <div className="md:col-span-2">
                  <Field
                    label="Notes"
                    value={table.notes || "No notes available"}
                  />
                </div>

                {table.created_at && (
                  <Field
                    label="Created At"
                    value={new Date(table.created_at).toLocaleString()}
                  />
                )}

                {table.updated_at && (
                  <Field
                    label="Updated At"
                    value={new Date(table.updated_at).toLocaleString()}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ViewTable;
