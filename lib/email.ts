import nodemailer from "nodemailer";

type SendOptions = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

let cachedTransporter: nodemailer.Transporter | null = null;

const getTransporter = () => {
  if (cachedTransporter) return cachedTransporter;
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !port || !user || !pass) return null;
  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return cachedTransporter;
};

export const sendMail = async (opts: SendOptions) => {
  const transporter = getTransporter();
  if (!transporter) return { ok: false, reason: "missing transporter config" };
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER!;
  await transporter.sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
  });
  return { ok: true };
};

export const composeReportEmail = ({
  to,
  domain,
  downloadUrl,
  expiresDays = 7,
}: {
  to: string;
  domain: string;
  downloadUrl: string;
  expiresDays?: number;
}) => {
  const subject = `Your CyberFaceX IT Risk Report is ready — ${domain}`;
  const text = `Your passive IT risk report for ${domain} is ready.\nDownload: ${downloadUrl}\nThis secure link expires in ${expiresDays} days.\n\nYou are receiving this email because you requested a passive IT risk report on cyberfacex.com.\nIf you did not request this, you can ignore this email.\n\nCyberFaceX | Passive IT Risk Intelligence`;

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#f8fafc;padding:24px;color:#0b132b;">
    <div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;box-shadow:0 10px 30px rgba(15,19,43,0.08);padding:24px;">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div style="font-size:16px;font-weight:700;color:#0b132b;">CyberFaceX</div>
        <div style="font-size:12px;color:#475569;">Passive IT Risk Intelligence</div>
      </div>
      <h1 style="font-size:20px;margin:20px 0 8px;">Your IT Risk Report is ready</h1>
      <p style="font-size:14px;margin:0 0 12px;">Domain: <strong>${domain}</strong></p>
      <p style="font-size:14px;margin:0 0 16px;line-height:1.6;">
        This assessment was generated using <strong>passive, non-intrusive signals only</strong> (DNS, TLS handshake, HTTP headers). No port scanning, no authentication, no exploitation attempts.
      </p>
      <a href="${downloadUrl}" style="background:#0b132b;color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none;font-size:14px;display:inline-block;">Download your secure PDF report</a>
      <p style="font-size:12px;color:#475569;margin:8px 0 0;">Secure link hosted on cyberfacex.com • Expires in ${expiresDays} days</p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;">
      <h3 style="margin:0 0 8px;font-size:14px;">Why you’re receiving this</h3>
      <p style="font-size:13px;margin:0 0 12px;line-height:1.5;">
        You requested a passive IT risk report for <strong>${domain}</strong> on <strong>cyberfacex.com</strong>.
        If you didn’t request this report, you can safely ignore this email.
      </p>
      <p style="font-size:12px;color:#475569;margin:0;">
        CyberFaceX<br/>
        Passive IT Risk Intelligence<br/>
        <a href="https://cyberfacex.com" style="color:#0b132b;text-decoration:none;">https://cyberfacex.com</a><br/>
        Need help? <a href="mailto:info@cyberfacex.com" style="color:#0b132b;text-decoration:none;">info@cyberfacex.com</a>
      </p>
    </div>
  </div>`;

  return { to, subject, text, html };
};

export const composeComplianceEmail = ({
  to,
  companyName,
  downloadUrl,
  expiresDays = 7,
}: {
  to: string;
  companyName?: string;
  downloadUrl: string;
  expiresDays?: number;
}) => {
  const company = companyName || "your company";
  const subject = `Your CyberFaceX compliance documents are ready`;
  const text = `Your compliance readiness package for ${company} is ready.\nDownload: ${downloadUrl}\nThis secure link expires in ${expiresDays} days.\n\nYou are receiving this email because you requested compliance documents on cyberfacex.com.\nIf you did not request this, you can ignore this email.\n\nCyberFaceX | Compliance Readiness`;

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#f8fafc;padding:24px;color:#0b132b;">
    <div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;box-shadow:0 10px 30px rgba(15,19,43,0.08);padding:24px;">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div style="font-size:16px;font-weight:700;color:#0b132b;">CyberFaceX</div>
        <div style="font-size:12px;color:#475569;">Compliance Readiness</div>
      </div>
      <h1 style="font-size:20px;margin:20px 0 8px;">Your compliance package is ready</h1>
      <p style="font-size:14px;margin:0 0 12px;">Company: <strong>${company}</strong></p>
      <p style="font-size:14px;margin:0 0 16px;line-height:1.6;">
        This package includes the compliance readiness summary and 5 policy documents tailored to your answers.
      </p>
      <a href="${downloadUrl}" style="background:#0b132b;color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none;font-size:14px;display:inline-block;">Download your ZIP package</a>
      <p style="font-size:12px;color:#475569;margin:8px 0 0;">Secure link hosted on cyberfacex.com - Expires in ${expiresDays} days</p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;">
      <p style="font-size:12px;color:#475569;margin:0;">
        CyberFaceX<br/>
        <a href="https://cyberfacex.com" style="color:#0b132b;text-decoration:none;">https://cyberfacex.com</a><br/>
        Need help? <a href="mailto:info@cyberfacex.com" style="color:#0b132b;text-decoration:none;">info@cyberfacex.com</a>
      </p>
    </div>
  </div>`;

  return { to, subject, text, html };
};
