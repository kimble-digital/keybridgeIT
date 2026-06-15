// ===========================================================================
//  src/pages/api/contact.ts
//  Server endpoint that sends enquiry / support emails via Resend (REST API)
//  AND (optionally) appends each submission to a Google Sheet.
//  - Validates the core fields, blocks bots with a honeypot
//  - Structured JSON logs (Vercel -> Functions -> Logs)
//  - A short reference on every request so you can trace it end to end
//  - Real error responses (4xx/5xx) so the form can show "it didn't send"
//
//  ENV VARS (Vercel -> Project -> Settings -> Environment Variables):
//    RESEND_API_KEY      your Resend API key (required)            e.g. re_xxx
//    CONTACT_FROM        verified Resend sender address            e.g. noreply@keybridgeit.com
//    CONTACT_FROM_NAME   (optional) display name on the From       e.g. Keybridge IT Solutions
//    CONTACT_TO          where general enquiries go                e.g. info@keybridgeit.com
//    SUPPORT_TO          (optional) where support tickets go       e.g. support@keybridgeit.com
//                        (falls back to CONTACT_TO if not set)
//    SHEETS_WEBHOOK_URL  (optional) Google Apps Script /exec URL   e.g. https://script.google.com/macros/s/AKfy.../exec
//    SHEETS_TOKEN        (optional) shared secret the script checks
//
//  Support submissions (form sends kind="support") are routed to SUPPORT_TO and
//  the sender gets a tailored auto-acknowledgement. Everything else goes to
//  CONTACT_TO. The person who submitted always receives an auto-responder.
// ===========================================================================
import type { APIRoute } from "astro";

export const prerender = false;

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const HONEYPOT = "cf_hp_check";

const LABELS: Record<string, string> = {
  reason: "What's prompting this",
  severity: "Severity",
  category: "Issue type",
  system: "Affected app / system",
  company: "Company",
  role: "Job title",
  industry: "Industry",
  teamsize: "Team size",
  name: "Name",
  email: "Email",
  phone: "Phone",
  users: "People affected",
  site: "Site / location",
  started: "When it started",
  message: "Details",
};
const ORDER = ["reason", "severity", "category", "system", "company", "role", "industry", "teamsize", "name", "email", "phone", "users", "site", "started"];

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

const esc = (s: string) =>
  String(s).replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] as string));

export const POST: APIRoute = async ({ request }) => {
  const ref = (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`).slice(0, 8).toUpperCase();
  const t0 = Date.now();
  const log = (level: "info" | "warn" | "error", msg: string, extra: Record<string, unknown> = {}) =>
    console[level](JSON.stringify({ tag: "contact", ref, msg, ...extra, ms: Date.now() - t0 }));

  try {
    const ct = request.headers.get("content-type") || "";
    const raw = ct.includes("application/json")
      ? await request.json()
      : Object.fromEntries((await request.formData()).entries());
    const data = raw as Record<string, string>;

    if ((data[HONEYPOT] || "").trim()) {
      log("warn", "honeypot triggered");
      return json({ ok: true, ref });
    }

    const name = (data.name || "").trim();
    const email = (data.email || "").trim();
    const message = (data.message || "").trim();
    const subject = (data.subject || "Website enquiry").trim();

    const fields: string[] = [];
    if (name.length < 2) fields.push("name");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) fields.push("email");
    if (message.length < 5) fields.push("message");
    if (fields.length) {
      log("warn", "validation failed", { fields });
      return json({ ok: false, ref, error: "Please check the highlighted fields and try again.", fields }, 400);
    }

    const apiKey = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY;
    const contactTo = import.meta.env.CONTACT_TO || process.env.CONTACT_TO;
    const supportTo = import.meta.env.SUPPORT_TO || process.env.SUPPORT_TO;
    const fromAddr = import.meta.env.CONTACT_FROM || process.env.CONTACT_FROM;
    const fromName = import.meta.env.CONTACT_FROM_NAME || process.env.CONTACT_FROM_NAME;
    if (!apiKey || !contactTo || !fromAddr) {
      log("error", "email not configured", { hasKey: !!apiKey, hasTo: !!contactTo, hasFrom: !!fromAddr });
      return json({ ok: false, ref, error: "Our form is temporarily unavailable. Please email us directly." }, 500);
    }

    // Compose the From header. CONTACT_FROM may already be "Name <addr>"; if it's
    // a bare address and CONTACT_FROM_NAME is set, combine them.
    const from = /</.test(fromAddr) ? fromAddr : (fromName ? `${fromName} <${fromAddr}>` : fromAddr);

    // Route support tickets to the support inbox; everything else to CONTACT_TO.
    const isSupport = (data.kind || "").toLowerCase() === "support";
    const to = isSupport ? (supportTo || contactTo) : contactTo;
    log("info", "routing", { kind: data.kind || "enquiry", isSupport, supportInbox: !!supportTo });

    // Build the email body from every provided field (except honeypot/subject/message),
    // known fields first in a sensible order, then anything else.
    const seen = new Set<string>([HONEYPOT, "subject", "message", "attachments", "kind"]);
    let rowsHtml = "";
    let rowsText = "";
    const addRow = (key: string, val: string) => {
      const v = (val || "").trim();
      if (!v) return;
      const label = LABELS[key] || key;
      rowsHtml += `<tr><td style="padding:4px 14px 4px 0;color:#555;white-space:nowrap"><strong>${esc(label)}</strong></td><td style="padding:4px 0">${esc(v)}</td></tr>`;
      rowsText += `${label}: ${v}\n`;
    };
    for (const k of ORDER) { if (data[k] !== undefined) { addRow(k, data[k]); seen.add(k); } }
    for (const [k, v] of Object.entries(data)) { if (!seen.has(k)) addRow(k, v); }

    const html = `
      <h2 style="font-family:system-ui,sans-serif">Website enquiry: ${esc(subject)}</h2>
      <p style="font-family:system-ui,sans-serif;color:#555">Reference: <strong>${ref}</strong></p>
      <table style="font-family:system-ui,sans-serif;font-size:14px;border-collapse:collapse">${rowsHtml}</table>
      <p style="font-family:system-ui,sans-serif;margin-top:16px"><strong>Details</strong></p>
      <p style="font-family:system-ui,sans-serif;white-space:pre-wrap;font-size:14px">${esc(message)}</p>`;
    const text = `Website enquiry: ${subject}\nReference: ${ref}\n\n${rowsText}\nDetails:\n${message}`;

    // Optional image attachments (base64) — capped for safety.
    const rawAttach = Array.isArray((raw as { attachments?: unknown }).attachments)
      ? ((raw as { attachments: unknown[] }).attachments)
      : [];
    const attachments = rawAttach
      .slice(0, 5)
      .filter((a): a is { filename: string; content: string; contentType?: string } =>
        !!a && typeof (a as any).content === "string" && typeof (a as any).filename === "string")
      .map((a) => ({
        filename: String(a.filename).slice(0, 140),
        content: a.content,
        content_type: a.contentType || undefined,
      }));
    if (attachments.length) log("info", "attachments received", { count: attachments.length });

    let res: Response;
    try {
      res = await fetch(RESEND_ENDPOINT, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from,
          to: [to],
          reply_to: email,
          subject: `[${subject}] ${name}${data.company ? " — " + data.company : ""}`,
          html,
          text,
          ...(attachments.length ? { attachments } : {}),
          tags: [{ name: "source", value: "website" }, { name: "ref", value: ref }],
        }),
      });
    } catch (netErr) {
      log("error", "network error reaching Resend", { error: String(netErr) });
      return json({ ok: false, ref, error: "We couldn't send your message just now. Please try again." }, 502);
    }

    const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok) {
      log("error", "Resend rejected the send", { status: res.status, detail: body?.message });
      return json({ ok: false, ref, error: "We couldn't send your message just now. Please try again." }, 502);
    }

    log("info", "sent", { resendId: body.id, email, subject });

    // ---- Auto-responder to the person who submitted (never blocks the user) ----
    const replyTo = isSupport ? (supportTo || contactTo) : contactTo;
    const ackSubject = isSupport
      ? `We've received your support request — ref ${ref}`
      : `Thanks for getting in touch — ref ${ref}`;
    const ackIntro = isSupport
      ? `Thanks${name ? ", " + esc(name) : ""} — your request has reached our support team and we're on it. Please quote the reference below if you need to chase it.`
      : `Thanks${name ? ", " + esc(name) : ""} for contacting Keybridge IT. We've received your message and a member of the team will be in touch shortly.`;
    const ackUrgent = isSupport
      ? `<p style="font-family:system-ui,sans-serif;font-size:14px;color:#555">If this is a critical, business-stopping issue, please call us so we can prioritise it.</p>`
      : "";
    const ackHtml = `
      <div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;color:#1a1a1a">
        <p>${ackIntro}</p>
        <p style="color:#555">Your reference: <strong>${ref}</strong></p>
        <p style="color:#555">A summary of what you sent us:</p>
        <table style="font-size:14px;border-collapse:collapse">${rowsHtml}</table>
        <p style="white-space:pre-wrap;font-size:14px;margin-top:8px">${esc(message)}</p>
        ${ackUrgent}
        <p style="margin-top:18px">Kind regards,<br>${esc(fromName || "Keybridge IT")}</p>
        <p style="font-size:12px;color:#999">This is an automated acknowledgement. You can reply to this email and it will reach the team.</p>
      </div>`;
    const ackText = `${isSupport ? "We've received your support request." : "Thanks for getting in touch."}\nYour reference: ${ref}\n\nWhat you sent us:\n${rowsText}\nDetails:\n${message}\n\nKind regards,\n${fromName || "Keybridge IT"}\n\nThis is an automated acknowledgement — you can reply and it will reach the team.`;
    try {
      const ackRes = await fetch(RESEND_ENDPOINT, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from,
          to: [email],
          reply_to: replyTo,
          subject: ackSubject,
          html: ackHtml,
          text: ackText,
          tags: [{ name: "source", value: "website" }, { name: "type", value: "ack" }, { name: "ref", value: ref }],
        }),
      });
      log(ackRes.ok ? "info" : "warn", "auto-responder", { status: ackRes.status });
    } catch (ackErr) {
      log("warn", "auto-responder failed", { error: String(ackErr) });
    }

    // ---- Also append to Google Sheet (optional, never blocks the user) ----
    const sheetUrl = import.meta.env.SHEETS_WEBHOOK_URL || process.env.SHEETS_WEBHOOK_URL;
    const sheetToken = import.meta.env.SHEETS_TOKEN || process.env.SHEETS_TOKEN;
    if (sheetUrl) {
      // flatten the submission: drop honeypot + attachments, keep everything else
      const rowFields: Record<string, string> = {};
      for (const [k, v] of Object.entries(data)) {
        if (k === HONEYPOT || k === "attachments") continue;
        rowFields[LABELS[k] || k] = typeof v === "string" ? v : JSON.stringify(v);
      }
      try {
        const sres = await fetch(sheetUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: sheetToken || "",
            Received: new Date().toISOString(),
            Reference: ref,
            Subject: subject,
            ...rowFields,
            Attachments: attachments.length ? String(attachments.length) : "",
          }),
        });
        log(sres.ok ? "info" : "warn", "sheet append", { status: sres.status });
      } catch (sheetErr) {
        log("warn", "sheet append failed", { error: String(sheetErr) });
      }
    }

    return json({ ok: true, ref, id: body.id });
  } catch (err) {
    log("error", "unhandled exception", { error: String(err) });
    return json({ ok: false, ref, error: "Something went wrong on our side. Please try again." }, 500);
  }
};

export const GET: APIRoute = () => json({ ok: false, error: "Use POST to submit the form." }, 405);
