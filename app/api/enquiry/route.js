import { NextResponse } from 'next/server';
import { getPool, ensureSchema } from '../../../lib/db';
import { getTransporter, buildEnquiryEmailHtml } from '../../../lib/mailer';

// This route needs the Node.js runtime (uses `pg` and `nodemailer`,
// neither of which run on the Edge runtime).
export const runtime = 'nodejs';

function toIntOrNull(v) {
  if (v === undefined || v === null || v === '') return null;
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? null : n;
}

function toDateOrNull(v) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : v;
}

function isValidEmail(v) {
  return typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export async function POST(request) {
  try {
    let body = {};
    try {
      body = await request.json();
    } catch (e) {
      body = {};
    }
    body = body || {};

    const {
      source, name, country, city, mobile, whatsapp, email,
      travel_date, return_date, adults, children, infants,
      hotel_category, budget, travel_type, requirements,
    } = body;

    let destinations = body.destinations;
    if (Array.isArray(destinations)) destinations = destinations.filter(Boolean).join(', ');

    if (!name || !mobile || !email) {
      return NextResponse.json(
        { ok: false, error: 'Name, mobile number and email are required.' },
        { status: 400 }
      );
    }
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { ok: false, error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    await ensureSchema();
    const db = getPool();

    const insertResult = await db.query(
      `INSERT INTO enquiries
        (source, name, country, city, mobile, whatsapp, email, travel_date, return_date,
         adults, children, infants, hotel_category, budget, travel_type, destinations, requirements)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       RETURNING id`,
      [
        (source || 'Website').toString().slice(0, 80),
        name.toString().slice(0, 200),
        country ? country.toString().slice(0, 100) : null,
        city ? city.toString().slice(0, 100) : null,
        mobile.toString().slice(0, 50),
        whatsapp ? whatsapp.toString().slice(0, 50) : null,
        email.toString().slice(0, 200),
        toDateOrNull(travel_date),
        toDateOrNull(return_date),
        toIntOrNull(adults),
        toIntOrNull(children),
        toIntOrNull(infants),
        hotel_category ? hotel_category.toString().slice(0, 50) : null,
        budget ? budget.toString().slice(0, 100) : null,
        travel_type ? travel_type.toString().slice(0, 50) : null,
        destinations || null,
        requirements || null,
      ]
    );

    const enquiryId = insertResult.rows[0].id;

    // Send the notification email. If email fails, the enquiry is still
    // safely saved in the database, so we don't fail the whole request.
    try {
      const transporter = getTransporter();
      await transporter.sendMail({
        from: `"Le Sween Holidays Website" <${process.env.SMTP_USER}>`,
        to: process.env.MAIL_TO || 'lesween@gmail.com',
        replyTo: email,
        subject: `New Enquiry #${enquiryId} (${source || 'Website'}) — ${name}`,
        html: buildEnquiryEmailHtml({
          source, name, country, city, mobile, whatsapp, email,
          travel_date, return_date, adults, children, infants,
          hotel_category, budget, travel_type, destinations, requirements,
        }),
      });
    } catch (mailErr) {
      console.error('Email send failed (enquiry was still saved):', mailErr);
    }

    return NextResponse.json({ ok: true, id: enquiryId });
  } catch (err) {
    console.error('Enquiry submission error:', err);
    return NextResponse.json(
      {
        ok: false,
        error: 'Something went wrong on our end. Please try again or contact us on WhatsApp.',
      },
      { status: 500 }
    );
  }
}

// Any method other than POST is not supported on this route.
export async function GET() {
  return NextResponse.json({ ok: false, error: 'Method not allowed.' }, { status: 405 });
}
