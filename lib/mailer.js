import nodemailer from 'nodemailer';

let transporter;

export function getTransporter() {
  if (!transporter) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error('SMTP_USER / SMTP_PASS environment variables are not set.');
    }
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

function esc(v) {
  if (v === undefined || v === null || v === '') return '-';
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function buildEnquiryEmailHtml(fields) {
  const rows = [
    ['Source', fields.source],
    ['Name', fields.name],
    ['Country', fields.country],
    ['City', fields.city],
    ['Mobile', fields.mobile],
    ['WhatsApp', fields.whatsapp],
    ['Email', fields.email],
    ['Travel Date', fields.travel_date],
    ['Return Date', fields.return_date],
    ['Adults', fields.adults],
    ['Children', fields.children],
    ['Infants', fields.infants],
    ['Hotel Category', fields.hotel_category],
    ['Budget', fields.budget],
    ['Travel Type', fields.travel_type],
    ['Destinations', fields.destinations],
    ['Requirements', fields.requirements],
  ];

  const rowsHtml = rows
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding:8px 12px;border:1px solid #ddd;background:#f6f6f6;font-weight:600;white-space:nowrap;">${esc(label)}</td>
        <td style="padding:8px 12px;border:1px solid #ddd;">${esc(value).toString().replace(/\n/g, '<br>')}</td>
      </tr>`
    )
    .join('');

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;">
      <h2 style="color:#002d3f;">New China Travel Enquiry</h2>
      <p style="color:#555;">A new enquiry was submitted on the Le Sween Holidays LLP website.</p>
      <table style="border-collapse:collapse;width:100%;font-size:14px;">
        ${rowsHtml}
      </table>
      <p style="color:#999;font-size:12px;margin-top:20px;">Sent automatically from lesween.com</p>
    </div>
  `;
}
