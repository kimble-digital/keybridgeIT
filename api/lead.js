// Optional Vercel serverless function for handling lead submissions.
// To use: set ENDPOINT = "/api/lead" in src/pages/contact.astro,
// and configure email/CRM delivery below (e.g. Resend, SendGrid, or a webhook).
//
// Add your env vars in Vercel: e.g. LEAD_NOTIFY_EMAIL, RESEND_API_KEY.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, company, phone, interest } = req.body || {};

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  // --- Deliver the lead. Replace with your provider of choice. ---
  // Example with Resend (npm i resend, set RESEND_API_KEY):
  //
  // const { Resend } = await import('resend');
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({
  //   from: 'leads@keybridgeit.com',
  //   to: process.env.LEAD_NOTIFY_EMAIL,
  //   subject: `New IT review enquiry — ${name}${company ? ' (' + company + ')' : ''}`,
  //   text: `Name: ${name}\nCompany: ${company || '-'}\nPhone: ${phone || '-'}\nEmail: ${email}\nInterest: ${interest || '-'}`,
  // });

  console.log('Lead received:', { name, email, company, phone, interest });
  return res.status(200).json({ ok: true });
}
