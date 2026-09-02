import { NextRequest, NextResponse } from "next/server";

type ContactPayload = {
  name: string;
  email: string;
  subject?: string;
  message: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  let body: ContactPayload;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { name, email, subject, message } = body;

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json(
      { error: "Name, email, and message are required." },
      { status: 400 }
    );
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "That doesn't look like a valid email address." },
      { status: 400 }
    );
  }

  try {
    await sendContactEmail({ name, email, subject, message });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to send contact email:", err);
    return NextResponse.json(
      { error: "Couldn't send your message right now. Please try again shortly." },
      { status: 500 }
    );
  }
}

/**
 * Sends the contact form submission as an email.
 *
 * This is a scaffold — wire up a real provider once you've picked one.
 * Three common options, pick ONE and fill in the env vars in .env.local:
 *
 * ── Option A: Resend (simplest) ──────────────────────────────────────
 *   npm install resend
 *   import { Resend } from "resend";
 *   const resend = new Resend(process.env.RESEND_API_KEY);
 *   await resend.emails.send({
 *     from: "Learnkeys <contact@yourdomain.com>",
 *     to: process.env.CONTACT_INBOX_EMAIL!,
 *     replyTo: email,
 *     subject: subject || `New contact form message from ${name}`,
 *     text: `From: ${name} <${email}>\n\n${message}`,
 *   });
 *
 * ── Option B: SMTP via Nodemailer ─────────────────────────────────────
 *   npm install nodemailer
 *   import nodemailer from "nodemailer";
 *   const transporter = nodemailer.createTransport({
 *     host: process.env.SMTP_HOST,
 *     port: Number(process.env.SMTP_PORT),
 *     secure: true,
 *     auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
 *   });
 *   await transporter.sendMail({
 *     from: process.env.SMTP_USER,
 *     to: process.env.CONTACT_INBOX_EMAIL,
 *     replyTo: email,
 *     subject: subject || `New contact form message from ${name}`,
 *     text: `From: ${name} <${email}>\n\n${message}`,
 *   });
 *
 * ── Option C: Supabase Edge Function ─────────────────────────────────
 *   Call an Edge Function (which itself uses Resend/SMTP) via the
 *   already-configured Supabase client:
 *   const supabase = getSupabaseBrowserClient(); // or a server client here
 *   await supabase.functions.invoke("send-contact-email", { body: { name, email, subject, message } });
 */
async function sendContactEmail({
  name,
  email,
  subject,
  message,
}: ContactPayload) {
  // TODO: replace this with one of the options above once an email
  // provider is chosen. For now this just logs the submission so the
  // route is fully testable end-to-end.
  console.log("Contact form submission (email delivery not yet configured):", {
    name,
    email,
    subject,
    message,
  });
}