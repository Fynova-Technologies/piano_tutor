"use client";

import { useState } from "react";
import TestimonialForm from "@/components/testimonialsform";
import Footer from "@/features/home/footer";

type FormState = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

const initialState: FormState = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

const contactPoints = [
  {
    label: "Email",
    value: "hello@learnkeys.app",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 7l9 6 9-6" />
      </svg>
    ),
  },
  {
    label: "Phone",
    value: "+1 (415) 555-0142",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M4 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L14 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 4 6a2 2 0 0 1 0-2Z" />
      </svg>
    ),
  },
  {
    label: "Studio",
    value: "Based online — lessons worldwide",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z" />
        <circle cx="12" cy="9.5" r="2.3" />
      </svg>
    ),
  },
];

export default function ContactPage() {
  const [form, setForm] = useState<FormState>(initialState);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong. Please try again.");
      }

      setStatus("sent");
      setForm(initialState);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  return (
    <>
    <section className="bg-[#F5F2ED] px-8 py-20 md:py-28">
      <div className="max-w-5xl mx-auto">
        {/* Header — matches PlatformSection */}
        <div className="text-center mb-14">
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="w-8 h-px bg-[#C9A84C]" />
            <span className="text-[#C9A84C] text-[10px] tracking-[0.3em] uppercase font-medium">
              Contact
            </span>
            <div className="w-8 h-px bg-[#C9A84C]" />
          </div>
          <h2 className="font-serif text-5xl md:text-6xl font-black text-[#1A1A1A] leading-tight mb-4">
            Questions About Your <br className="hidden md:block" />
            <em className="text-[#C9A84C]">Practice Journey?</em>
          </h2>
          <p className="text-[#8A8078] text-sm max-w-md mx-auto leading-relaxed">
            Send a note about lessons, billing, or anything else — a real person
            reads every message and replies within a day or two.
          </p>
        </div>

        {/* Content card */}
        <div className="bg-[#0F0D0B] rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-5">
          {/* Info column */}
          <div className="md:col-span-2 p-8 md:p-10 flex flex-col gap-8 md:border-r border-[#2A2A2A]">
            <div>
              <h3 className="text-white font-bold text-lg font-serif mb-2">
                Reach us directly
              </h3>
              <p className="text-[#666] text-xs leading-relaxed">
                Prefer email or a call? Use whichever is easiest — we keep an eye
                on both.
              </p>
            </div>

            <div className="flex flex-col gap-6">
              {contactPoints.map((point) => (
                <div key={point.label} className="flex items-start gap-4">
                  <div className="p-4 rounded-lg bg-[#0F0D0B] border border-[#EFC264] flex items-center justify-center w-9 h-9 text-[#C9A84C] shrink-0">
                    <span className="w-[18px] h-[18px] block">{point.icon}</span>
                  </div>
                  <div>
                    <p className="text-[#666] text-[11px] uppercase tracking-wide mb-1">
                      {point.label}
                    </p>
                    <p className="text-white text-sm">{point.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form column */}
          <div className="md:col-span-3 p-8 md:p-10">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field
                  label="Name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Ada Lovelace"
                  required
                />
                <Field
                  label="Email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="ada@example.com"
                  required
                />
              </div>

              <Field
                label="Subject"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                placeholder="What's this about?"
              />

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="message"
                  className="text-[#8A8078] text-xs"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  placeholder="Tell us what's on your mind..."
                  className="bg-transparent border border-[#2A2A2A] rounded-lg px-4 py-3 text-white text-sm placeholder:text-[#4A4A4A] focus:outline-none focus:border-[#C9A84C] transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={status === "sending"}
                className="mt-2 bg-[#C9A84C] hover:bg-[#EFC264] disabled:opacity-60 disabled:cursor-not-allowed text-[#0F0D0B] font-bold text-sm rounded-lg px-6 py-3 transition-colors"
              >
                {status === "sending" ? "Sending..." : "Send message"}
              </button>

              {status === "sent" && (
                <p className="text-[#8FC97A] text-xs">
                  Message sent — we&apos;ll get back to you soon.
                </p>
              )}
              {status === "error" && (
                <p className="text-[#E38B8B] text-xs">{errorMsg}</p>
              )}
            </form>
          </div>
        </div>
        <div className="mt-20">
          <div className="text-center mb-14">
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="w-8 h-px bg-[#C9A84C]" />
            <span className="text-[#C9A84C] text-[10px] tracking-[0.3em] uppercase font-medium">
              Testimonials
            </span>
            <div className="w-8 h-px bg-[#C9A84C]" />
          </div>
          <h2 className="font-serif text-5xl md:text-6xl font-black text-[#1A1A1A] leading-tight mb-4">
                      Share your experience <br className="hidden md:block" />
            <em className="text-[#C9A84C]">Share your Journey?</em>
          </h2>
          <p className="text-[#8A8078] text-sm max-w-md mx-auto leading-relaxed">
                      Rate the part of Learnkeys that made the biggest difference for you.

          </p>
        </div>
          <TestimonialForm />
        </div>
      </div>
      
    </section>
    <Footer />
    </>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={name} className="text-[#8A8078] text-xs">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="bg-transparent border border-[#2A2A2A] rounded-lg px-4 py-3 text-white text-sm placeholder:text-[#4A4A4A] focus:outline-none focus:border-[#C9A84C] transition-colors"
      />
    </div>
  );
}