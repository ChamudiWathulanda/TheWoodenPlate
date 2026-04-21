import React, { useEffect, useState } from "react";
import { useCustomerAuth } from "../../contexts/CustomerAuthContext";

const initialFormState = {
  name: "",
  email: "",
  phone: "",
  otp: "",
};

const CustomerAuthModal = ({
  isOpen,
  onClose,
  onSuccess,
  title = "Continue",
  description = "Log in or create an account to continue.",
}) => {
  const { login, register, sendOTP, verifyOTP } = useCustomerAuth();
  const [step, setStep] = useState("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(initialFormState);

  useEffect(() => {
    if (!isOpen) {
      setStep("email");
      setLoading(false);
      setError("");
      setForm(initialFormState);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleCheckEmail = async () => {
    if (!form.email.trim()) {
      setError("Please enter your email.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const loginResult = await login({ email: form.email.trim() });

      if (loginResult.success) {
        onSuccess?.();
      } else {
        setStep("register");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setError("Please fill all fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const registerResult = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      });

      if (!registerResult.success && !registerResult.message?.includes("already")) {
        setError(registerResult.message || "Registration failed.");
        return;
      }

      const otpResult = await sendOTP({ email: form.email.trim() });

      if (!otpResult.success) {
        setError(otpResult.message || "Failed to send OTP.");
        return;
      }

      setStep("otp");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!form.otp.trim()) {
      setError("Please enter the OTP.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await verifyOTP({
        email: form.email.trim(),
        otp: form.otp.trim(),
      });

      if (!result.success) {
        setError(result.message || "Invalid OTP.");
        return;
      }

      onSuccess?.();
    } catch {
      setError("Failed to verify OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-[#8B5A2B]/50 bg-[#1A110D] p-6 shadow-2xl md:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-[#E7D2B6] md:text-2xl">{title}</h3>
            <p className="mt-2 text-sm text-[#BFA58A]">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-2xl text-[#BFA58A] transition hover:text-[#E7D2B6]"
          >
            x
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-700/50 bg-red-900/30 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {step === "email" && (
          <div className="space-y-4">
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email Address"
              className="w-full rounded-xl border border-[#8B5A2B]/40 bg-black/25 px-4 py-3 text-[#E7D2B6] placeholder:text-[#BFA58A]/60 focus:outline-none focus:ring-2 focus:ring-[#C98A5A]/60"
            />
            <button
              type="button"
              onClick={handleCheckEmail}
              disabled={loading}
              className="w-full rounded-full bg-gradient-to-r from-[#C98A5A] to-[#D7B38A] py-3 font-bold text-[#0F0A08] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Checking..." : "Continue"}
            </button>
          </div>
        )}

        {step === "register" && (
          <div className="space-y-4">
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Your Name"
              className="w-full rounded-xl border border-[#8B5A2B]/40 bg-black/25 px-4 py-3 text-[#E7D2B6] placeholder:text-[#BFA58A]/60 focus:outline-none focus:ring-2 focus:ring-[#C98A5A]/60"
            />
            <input
              name="email"
              type="email"
              value={form.email}
              disabled
              className="w-full rounded-xl border border-[#8B5A2B]/40 bg-black/40 px-4 py-3 text-[#E7D2B6]/60 focus:outline-none"
            />
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Phone Number"
              className="w-full rounded-xl border border-[#8B5A2B]/40 bg-black/25 px-4 py-3 text-[#E7D2B6] placeholder:text-[#BFA58A]/60 focus:outline-none focus:ring-2 focus:ring-[#C98A5A]/60"
            />
            <button
              type="button"
              onClick={handleRegister}
              disabled={loading}
              className="w-full rounded-full bg-gradient-to-r from-[#C98A5A] to-[#D7B38A] py-3 font-bold text-[#0F0A08] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Creating Account..." : "Create Account & Verify"}
            </button>
            <button
              type="button"
              onClick={() => setStep("email")}
              className="w-full py-2 text-sm text-[#BFA58A] transition hover:text-[#E7D2B6]"
            >
              Back
            </button>
          </div>
        )}

        {step === "otp" && (
          <div className="space-y-4">
            <p className="text-sm text-[#BFA58A]">
              We sent a 6-digit OTP to <span className="text-[#E7D2B6]">{form.email}</span>
            </p>
            <input
              name="otp"
              value={form.otp}
              onChange={handleChange}
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              className="w-full rounded-xl border border-[#8B5A2B]/40 bg-black/25 px-4 py-3 text-center text-xl tracking-widest text-[#E7D2B6] placeholder:text-[#BFA58A]/60 focus:outline-none focus:ring-2 focus:ring-[#C98A5A]/60"
            />
            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={loading}
              className="w-full rounded-full bg-gradient-to-r from-[#C98A5A] to-[#D7B38A] py-3 font-bold text-[#0F0A08] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify & Continue"}
            </button>
            <button
              type="button"
              onClick={() => setStep("register")}
              className="w-full py-2 text-sm text-[#BFA58A] transition hover:text-[#E7D2B6]"
            >
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerAuthModal;
