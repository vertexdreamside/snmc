"use server";

import { Resend } from "resend";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

// Resend's shared onboarding domain — works immediately with no setup,
// and can send to any recipient. Swap FROM_EMAIL for an address on your
// own verified domain (see .env.example) once you've added one in Resend.
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Sibert Residence Website <onboarding@resend.dev>";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** A simple, email-client-safe HTML table of label/value rows. Blank values are skipped. */
function detailsTable(rows: [string, string | undefined][]): string {
  const cells = rows
    .filter((row): row is [string, string] => Boolean(row[1]))
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:9px 14px;border-bottom:1px solid #EDE3CE;color:#8C8577;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.03em;white-space:nowrap;vertical-align:top;">${escapeHtml(
            label
          )}</td>
          <td style="padding:9px 14px;border-bottom:1px solid #EDE3CE;color:#16241C;font-size:14px;">${value}</td>
        </tr>`
    )
    .join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:480px;margin:16px 0;border:1px solid #EDE3CE;border-radius:8px;overflow:hidden;">${cells}</table>`;
}

/** Wraps email body content in a consistent shell (heading + footer note). */
function emailShell(heading: string, bodyHtml: string, footerNote: string): string {
  return `
    <div style="font-family:Georgia,'Times New Roman',serif;color:#16241C;max-width:560px;">
      <h2 style="color:#0F3D2E;font-size:20px;margin:0 0 16px;">${heading}</h2>
      ${bodyHtml}
      <hr style="border:none;border-top:1px solid #EDE3CE;margin:24px 0 12px;" />
      <p style="color:#8C8577;font-size:12px;margin:0;">${footerNote}</p>
    </div>
  `;
}

// Note: the detailed "Booking Enquiry" flow (with its own name/email fields
// and rate quote sent straight to email) was removed at the client's
// request, so guests only have one enquiry path — "Availability Request"
// below — and never a flow that could read as a guaranteed booking.

export type AvailabilityRequestInput = {
  toEmail: string;
  name: string;
  email: string;
  phone: string;
  arrival: string;
  departure: string;
  adults: string;
  children: string;
  roomName?: string;
  guests?: string;
  /** Age(s) of any children in the party, as free text (e.g. "7, 9"). */
  childAges?: string;
  nights?: number;
  seasonLabel?: string;
  /** Honeypot field — real visitors never fill this in. If it's non-empty,
   *  the submission is silently dropped instead of generating spam email. */
  honeypot?: string;
};

export async function sendAvailabilityRequest(input: AvailabilityRequestInput) {
  // Bot caught the honeypot — pretend success so it doesn't learn to avoid it.
  if (input.honeypot) {
    return { success: true as const };
  }

  const resend = getResend();
  if (!resend) {
    return {
      success: false as const,
      error: "Email sending isn't configured yet. Set RESEND_API_KEY (see .env.example).",
    };
  }

  const tripRows: [string, string | undefined][] = [
    ["Arrival", escapeHtml(input.arrival)],
    ["Departure", escapeHtml(input.departure)],
    [
      "Nights",
      input.nights != null
        ? `${input.nights} night${input.nights === 1 ? "" : "s"} (${escapeHtml(input.seasonLabel ?? "—")})`
        : undefined,
    ],
    ["Room", input.roomName ? escapeHtml(input.roomName) : undefined],
    ["Guests", input.guests ? escapeHtml(input.guests) : undefined],
    ["Child age(s)", input.childAges ? escapeHtml(input.childAges) : undefined],
  ];

  const businessTable = detailsTable([
    ["Name", escapeHtml(input.name)],
    ["Email", escapeHtml(input.email)],
    ["Phone", escapeHtml(input.phone)],
    ...tripRows,
  ]);

  const businessHtml = emailShell(
    "New Availability Request — Sibert Residence",
    businessTable,
    'Sent automatically from the Sibert Residence website "Check Availability" form.'
  );

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: input.toEmail,
      replyTo: input.email,
      subject: `Availability Request — ${input.arrival} → ${input.departure}`,
      html: businessHtml,
    });
    if (error) return { success: false as const, error: error.message };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : "Failed to send email." };
  }

  // Confirmation back to the guest — best-effort; the business copy above is
  // what matters, so a failure here doesn't fail the whole submission.
  try {
    const tripTable = detailsTable(tripRows);
    const customerHtml = emailShell(
      "We've received your request",
      `
        <p style="margin:0 0 8px;">Hi ${escapeHtml(input.name)},</p>
        <p style="margin:0 0 8px;">Thanks for checking availability at Sibert Residence — here's what you sent us:</p>
        ${tripTable}
        <p style="margin:16px 0 8px;">We'll get back to you shortly by email to confirm availability and the next steps.</p>
        <p style="margin:0;">If it's urgent, you're welcome to reach us on WhatsApp any time.</p>
      `,
      "Sibert Residence · La Passe, La Digue, Seychelles"
    );
    await resend.emails.send({
      from: FROM_EMAIL,
      to: input.email,
      subject: "We've received your request — Sibert Residence",
      html: customerHtml,
    });
  } catch {
    // Ignore — the business already has the enquiry.
  }

  return { success: true as const };
}

export type ContactMessageInput = {
  toEmail: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
};

export async function sendContactMessage(input: ContactMessageInput) {
  const resend = getResend();
  if (!resend) {
    return {
      success: false as const,
      error: "Email sending isn't configured yet. Set RESEND_API_KEY (see .env.example).",
    };
  }

  const table = detailsTable([
    ["Name", escapeHtml(input.name)],
    ["Email", escapeHtml(input.email)],
    ["Subject", input.subject ? escapeHtml(input.subject) : undefined],
  ]);

  const html = emailShell(
    "New Contact Message — Sibert Residence",
    `
      ${table}
      <p style="margin:16px 0 4px;font-weight:600;">Message</p>
      <p style="margin:0;white-space:pre-wrap;">${escapeHtml(input.message)}</p>
    `,
    "Sent automatically from the Sibert Residence website contact form."
  );

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: input.toEmail,
      replyTo: input.email,
      subject: input.subject ? `Contact form: ${input.subject}` : "New message from the website",
      html,
    });
    if (error) return { success: false as const, error: error.message };
    return { success: true as const };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : "Failed to send email." };
  }
}
