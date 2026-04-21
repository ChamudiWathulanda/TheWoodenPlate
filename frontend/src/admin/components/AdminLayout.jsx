import React, { useEffect, useState } from "react";
import AdminNavbar from "./AdminNavbar";
import AdminSidebar from "./AdminSidebar";

const AdminLayout = ({ children }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (!mobileSidebarOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileSidebarOpen]);

  return (
    <div className="fixed inset-0 overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.16),_transparent_28%),linear-gradient(180deg,_#fffaf2_0%,_#f8fafc_42%,_#eef2ff_100%)]">
      <div className="flex h-full flex-col overflow-visible">
        <AdminNavbar
          onMenuClick={() => setMobileSidebarOpen((current) => !current)}
          isMobileSidebarOpen={mobileSidebarOpen}
        />

        <div className="relative flex flex-1 overflow-hidden px-3 pb-3 pt-2 md:px-4 md:pb-4">
          <div className="flex w-full overflow-hidden rounded-[2rem] border border-white/60 bg-white/55 shadow-[0_20px_60px_rgba(15,23,42,0.12)] backdrop-blur-sm">
            <AdminSidebar />

            <main className="flex-1 overflow-y-auto bg-transparent p-4 md:p-6 xl:p-8">
              {children}
            </main>
          </div>

          <div
            className={`absolute inset-0 z-40 bg-slate-950/35 backdrop-blur-[1px] transition-opacity duration-300 lg:hidden ${
              mobileSidebarOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
            }`}
            onClick={() => setMobileSidebarOpen(false)}
          />

          <div
            className={`absolute bottom-0 left-0 top-0 z-50 w-[min(20rem,calc(100vw-1.5rem))] transition-transform duration-300 ease-out lg:hidden ${
              mobileSidebarOpen ? "translate-x-0" : "-translate-x-[110%]"
            }`}
          >
            <div className="h-full overflow-hidden rounded-[2rem] border border-white/20 bg-[linear-gradient(180deg,_#111827_0%,_#1f2937_38%,_#7c2d12_140%)] shadow-2xl">
              <AdminSidebar mobile onNavigate={() => setMobileSidebarOpen(false)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
