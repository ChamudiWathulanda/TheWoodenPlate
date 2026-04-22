import React, { useState } from "react";
import toast from "react-hot-toast";

const API_BASE = "http://localhost:8000";

const ContactSection = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill all required fields.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(`${API_BASE}/api/public/contact-messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error("Failed to submit message");
      }

      toast.success("Message sent successfully");
      setForm({ name: "", email: "", message: "" });
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact" className="bg-[#0F0A08] py-20 text-[#E7D2B6]">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-extrabold text-[#C98A5A] md:text-5xl">Contact Us</h2>
          <p className="mx-auto mt-3 max-w-2xl text-[#BFA58A]">
            Have a question, feedback, or a special request? Send us a message anytime and we will
            get back to you as soon as possible.
          </p>
        </div>

        <div className="mx-auto max-w-3xl">
          <div className="rounded-3xl border border-[#8B5A2B]/50 bg-[#1A110D] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.55)] md:p-10">
            <div className="mb-8">
              <h3 className="text-2xl font-semibold text-[#E7D2B6] md:text-3xl">Send a Message</h3>
              <p className="mt-2 text-sm text-[#BFA58A] md:text-base">
                Fill the form below and our team will reply shortly.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#E7D2B6]">
                  Name <span className="text-[#C98A5A]">*</span>
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  disabled={submitting}
                  placeholder="Your name"
                  className="w-full rounded-2xl border border-[#8B5A2B]/40 bg-black/25 px-5 py-4 text-[#E7D2B6] placeholder:text-[#BFA58A]/60 focus:outline-none focus:ring-2 focus:ring-[#C98A5A]/60"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#E7D2B6]">
                  Email <span className="text-[#C98A5A]">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  disabled={submitting}
                  placeholder="your@email.com"
                  className="w-full rounded-2xl border border-[#8B5A2B]/40 bg-black/25 px-5 py-4 text-[#E7D2B6] placeholder:text-[#BFA58A]/60 focus:outline-none focus:ring-2 focus:ring-[#C98A5A]/60"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#E7D2B6]">
                  Message <span className="text-[#C98A5A]">*</span>
                </label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  disabled={submitting}
                  rows={7}
                  placeholder="Write your message..."
                  className="w-full resize-none rounded-2xl border border-[#8B5A2B]/40 bg-black/25 px-5 py-4 text-[#E7D2B6] placeholder:text-[#BFA58A]/60 focus:outline-none focus:ring-2 focus:ring-[#C98A5A]/60"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#C98A5A] to-[#D7B38A] px-6 py-4 text-base font-bold text-[#0F0A08] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? "Sending..." : "Send Message"}
              </button>

              <p className="pt-2 text-center text-xs text-[#BFA58A]">
                We typically respond within a few hours.
              </p>
            </form>
          </div>
        </div>

        <div className="mt-16 border-t border-[#8B5A2B]/30" />
      </div>
    </section>
  );
};

export default ContactSection;
