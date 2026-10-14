"use client";

import { useState } from "react";

type FormState = {
  name: string;
  email: string;
  message: string;
};

const initialState: FormState = {
  name: "",
  email: "",
  message: "",
};

const contactPoints = [
  {
    title: "Email us",
    text: "hello@learnkeys.app",
    highlight: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 7l9 6 9-6" />
      </svg>
    ),
  },
  {
    title: "We reply within 24 hours",
    text: "Every message is read by our team.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    ),
  },
  {
    title: "Studios and schools",
    text: "Ask about the Concerto plan for teams.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 10l9-6 9 6" />
        <path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8" />
        <path d="M3 20h18" />
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
      <section className="bg-[#0A0A0A] px-6 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-[1100px]">
          {/* ---------- Contact ---------- */}
          <div className="grid grid-cols-1 items-stretch gap-12 lg:grid-cols-2 lg:gap-10">
            {/* Left column */}
            <div className="flex flex-col">
              <div className="mb-8 flex items-center gap-3">
                <div className="h-px w-8 bg-[#D4A343]" />
                <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#D4A343]">
                  Contact us
                </span>
              </div>

              <h1 className="text-5xl font-bold leading-[1.05] tracking-tight text-white md:text-6xl">
                We&apos;d love to
                <br />
                <em className="font-semibold italic text-[#D4A343]">
                  hear from you
                </em>
              </h1>

              <p className="mt-8 max-w-sm text-sm leading-relaxed text-[#9A948B]">
                Questions about lessons, plans or your account? Send us a note
                and a real person will reply.
              </p>

              <ul className="mt-10 border-t border-white/[0.06]">
                {contactPoints.map((point) => (
                  <li
                    key={point.title}
                    className="flex items-center gap-4 border-b border-white/[0.06] py-4"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-[#11100E] text-[#D4A343]">
                      <span className="block h-4 w-4">{point.icon}</span>
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-white">
                        {point.title}
                      </p>
                      <p
                        className={`mt-0.5 text-xs ${
                          point.highlight ? "text-[#D4A343]" : "text-[#7A746C]"
                        }`}
                      >
                        {point.text}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right column — form card */}
            <div className="rounded-2xl border border-white/[0.06] bg-[#11100E] p-8 md:p-10">
              <h2 className="text-xl font-bold text-white">Send us a message</h2>
              <p className="mt-2 text-xs text-[#7A746C]">
                Fill in the form and we&apos;ll get back to you by email.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field
                    label="Your name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Full name"
                    required
                  />
                  <Field
                    label="Email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="message" className="text-[11px] text-[#9A948B]">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    placeholder="How can we help?"
                    className="resize-none rounded-xl border border-white/[0.06] bg-[#0A0A0A] px-4 py-3 text-sm text-white transition-colors placeholder:text-[#4A4640] focus:border-[#D4A343] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="mt-2 w-full rounded-full bg-[#D4A343] px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#11100E] transition-colors hover:bg-[#E2B456] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {status === "sending" ? "Sending..." : "Send message"}
                </button>

                {status === "sent" && (
                  <p className="text-center text-xs text-[#8FC97A]">
                    Message sent. We&apos;ll get back to you soon.
                  </p>
                )}
                {status === "error" && (
                  <p className="text-center text-xs text-[#E38B8B]">{errorMsg}</p>
                )}
                {status !== "sent" && status !== "error" && (
                  <p className="text-center text-[11px] text-[#5E5951]">
                    We only use your email to reply to you.
                  </p>
                )}
              </form>
            </div>
          </div>

          
        </div>
      </section>
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
      <label htmlFor={name} className="text-[11px] text-[#9A948B]">
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
        className="rounded-xl border border-white/[0.06] bg-[#0A0A0A] px-4 py-3 text-sm text-white transition-colors placeholder:text-[#4A4640] focus:border-[#D4A343] focus:outline-none"
      />
    </div>
  );
}