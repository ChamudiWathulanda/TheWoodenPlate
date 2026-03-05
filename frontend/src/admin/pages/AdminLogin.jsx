import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

/**
 * Admin Login Component
 * 
 * Backend API Endpoints:
 * ----------------------
 * POST   /api/admin/login              - Admin login (email, password)
 * POST   /api/admin/logout             - Admin logout (requires token)
 * GET    /api/admin/profile            - Get admin profile (requires token)
 * PUT    /api/admin/profile            - Update admin profile (requires token)
 * GET    /api/admin/dashboard          - Admin dashboard data (requires token)
 * 
 * Customer Management Endpoints (Protected):
 * ------------------------------------------
 * GET    /api/admin/customers          - Get all customers
 * POST   /api/admin/customers          - Create new customer
 * GET    /api/admin/customers/{id}     - Get single customer
 * PUT    /api/admin/customers/{id}     - Update customer
 * DELETE /api/admin/customers/{id}     - Delete customer
 * 
 * Authentication:
 * ---------------
 * - Uses Laravel Sanctum token authentication
 * - Token stored in localStorage as 'admin_token'
 * - User data stored in localStorage as 'admin_user'
 */

const AdminLogin = () => {
  const navigate = useNavigate();

  // state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Email and password are required");
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading("Signing in...");
    
    try {
      const res = await fetch("http://localhost:8000/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      // Read raw response text then attempt to parse JSON.
      const raw = await res.text();
      let data = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch (err) {
        data = null;
      }

      if (!res.ok) {
        // prefer JSON message if present, otherwise show raw text
        throw new Error((data && data.message) || raw || "Login failed");
      }

      // Ensure we received a token
      if (!data || !data.token) {
        throw new Error("Invalid server response: missing token. Check backend logs or inspect response.");
      }

      localStorage.setItem("admin_token", data.token);
      localStorage.setItem("admin_user", JSON.stringify(data.user || {}));
      
      toast.success("Login successful! Redirecting...", { id: loadingToast });
      
      setTimeout(() => {
        navigate("/admin/dashboard", { replace: true });
      }, 500);
    } catch (err) {
      const errorMessage = err.message || "Something went wrong";
      toast.error(errorMessage, { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    // full screen, no scroll
    <div className="fixed inset-0 w-full h-full overflow-hidden">
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#000',
            fontSize: '14px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
          success: {
            iconTheme: {
              primary: '#000',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
          loading: {
            iconTheme: {
              primary: '#6B7280',
              secondary: '#fff',
            },
          },
        }}
      />
      
      <div className="flex w-full h-full">
        {/* LEFT SIDE: 3/4 image */}
        <div className="hidden md:block w-3/4 h-full overflow-hidden">
          <img
            src="/login2.jpg"
            alt="The Wooden Plate"
            className="w-full h-full object-cover"
          />
        </div>

        {/* RIGHT SIDE: 1/4 form area */}
        <div className="w-full md:w-1/4 h-full bg-white flex justify-center overflow-hidden">
          <div className="w-full max-w-sm px-6 pt-10 flex flex-col h-full">
            {/* LOGO */}
            <div className="flex justify-center mb-4">
              <img
                src="/logo.png"
                alt="The Wooden Plate Logo"
                className="h-50 w-50 object-contain"
              />
            </div>

            {/* WELCOME + SUBTITLE */}
            <div className="text-center mb-5">
              <h2 className="text-2xl font-bold text-black">Welcome!</h2>
             
              <p className="text-sm text-gray-600 mt-2">
                Please sign in to continue.
              </p>
            </div>

            {/* FORM */}
            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-black mb-2 text-left"
                >
                  Enter Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  className="block w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm text-black placeholder-gray-400
                             focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-black text-left"
                  >
                    Enter Password
                  </label>
                  <span
                    onClick={() => navigate("/admin/forgot-password")}
                    className="text-xs text-gray-500 hover:text-black cursor-pointer transition-colors"
                  >
                    Forgot password?
                  </span>
                </div>

                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="block w-full rounded-md border border-gray-300 px-4 py-2.5 pr-10 text-sm text-black placeholder-gray-400
                               focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />

                  {/* Password show/hide icon */}
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-100 hover:text-gray-200 transition-colors"
                  >
                    {showPassword ? (
                      // eye-off icon
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      // eye icon
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* REMEMBER ME */}
              <div className="flex items-center justify-start text-sm text-gray-700">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  <span className="ml-2 text-gray-600">Remember me</span>
                </label>
              </div>

              {/* LOGIN BUTTON with shadow + scale on hover */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center rounded-full 
                             bg-black px-4 py-3 text-sm font-semibold text-white 
                             shadow-lg transform transition-all duration-200 ease-out
                             hover:bg-gray-800 hover:shadow-xl hover:scale-[1.02]
                             focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2
                             disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Logging in...
                    </span>
                  ) : (
                    "Log In"
                  )}
                </button>
              </div>
            </form>

            {/* FOOTER */}
            <div className="mt-auto pb-4 text-center text-[11px] text-gray-400">
              © {new Date().getFullYear()} The Wooden Plate. Powered by The
              Wooden Plate.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
