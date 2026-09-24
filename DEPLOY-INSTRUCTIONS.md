# Le Sween Holidays LLP — Deployment Instructions (Next.js)

## What changed in this restructure
The backend is now a proper **Next.js (App Router) project** instead of a
bare Vercel serverless function:

```
site/
  app/
    api/
      enquiry/
        route.js       ← Next.js Route Handler (was api/enquiry.js)
  lib/
    db.js               ← Neon Postgres connection + schema (ESM now)
    mailer.js            ← Gmail SMTP + email template (ESM now)
  public/
    index.html, about.html, beijing.html, ...   ← all your existing pages, unchanged
    assets/, vendors/                             ← all your existing assets, unchanged
  next.config.mjs        ← clean-URL routing + custom 404 (replaces vercel.json)
  package.json            ← now a Next.js app (next, react, react-dom + pg, nodemailer)
```

**Your HTML pages were NOT touched or converted to React.** They still live
as plain `.html` files, now inside `/public`, and are served by Next.js
exactly as before. Only the backend moved from a single `api/enquiry.js`
file to a standard Next.js API route at `app/api/enquiry/route.js`.

### Clean URLs — now handled by Next.js itself
Previously `vercel.json`'s `cleanUrls: true` stripped `.html` from every
link. That config doesn't apply to Next.js projects, so `next.config.mjs`
now does the same job with its own rewrite rules:
- It scans `/public` at build/dev time and automatically rewrites
  `/beijing` → `/beijing.html`, `/contact` → `/contact.html`, etc. — no
  manual list to maintain when you add a new page.
- `/` → `/index.html`.
- Any URL that doesn't match a real page falls back to your existing
  `/404.html` design (shown with a `200` status, which is normal for this
  kind of static fallback).
- `js.html` and `InitMapsJwt.html` are excluded from the rewrite list since
  they're cached script snippets, not real pages.

### The API route itself
`app/api/enquiry/route.js` does exactly what the old function did:
1. Validates the submission (name, mobile, email required; email format checked).
2. Saves it to your **Neon Postgres** `enquiries` table (auto-created on
   first submission).
3. Emails the full enquiry to **lesween@gmail.com** via Gmail SMTP, with the
   customer's email set as Reply-To.
4. If the email fails, the enquiry is still saved — you never lose a lead.

It's marked `export const runtime = 'nodejs'` because it uses `pg` and
`nodemailer`, which need the Node.js runtime (not Vercel's Edge runtime).

Your **Contact page** and **Customised Tours** forms don't need any changes
— `assets/js/form-handler.js` already `fetch()`es `/api/enquiry`, and that
URL still resolves to the same place under Next.js.

## 1. Set environment variables
Create a `.env` file in the project root (a template is in `.env.example`):

| Name | Value |
|---|---|
| `DATABASE_URL` | your Neon Postgres connection string |
| `SMTP_USER` | your Gmail address used to send notifications |
| `SMTP_PASS` | a Gmail **App Password** (not your normal password) |
| `MAIL_TO` | `lesween@gmail.com` |

For production, add the same variables in **Vercel dashboard → Project →
Settings → Environment Variables**, applied to Production, Preview, and
Development, then redeploy.

## 2. Install & run locally
```bash
npm install
npm run dev
```
Visit `http://localhost:3000` — pages, assets, and the enquiry forms all
work exactly as before.

## 3. Deploy to Vercel
```bash
npm install -g vercel   # if you don't have it already
cd lesween-holidays-llp  # this project folder
vercel                  # first deploy, follow the prompts
vercel --prod           # promote to production
```
Or connect the GitHub repo in the Vercel dashboard — Vercel auto-detects
Next.js and builds it automatically on every push. No extra configuration
needed; `vercel.json` has been removed since Next.js projects don't need it.

## 4. Test it
1. Visit your deployed site, e.g. `https://yoursite.vercel.app/contact`.
2. Submit the enquiry form.
3. Check:
   - **lesween@gmail.com** inbox for the notification email (check Spam the
     first time — mark "not spam" so future ones land in the inbox).
   - Your Neon database — table `enquiries` — for the saved row.

## 5. Viewing saved enquiries
```sql
SELECT * FROM enquiries ORDER BY created_at DESC;
```

## Notes / things left out of scope (unchanged from before)
- **`booking.html`** still contains a leftover template payment form with
  raw credit-card fields — intentionally not wired up. Saving raw card
  numbers is a PCI-DSS risk; use a payment gateway (Razorpay, Stripe, PayU)
  instead if you want online payments.
- **`tour-details.html`**'s smaller "quick enquiry" form is not yet
  connected to `/api/enquiry`.
- `booking.html` and `tour-details.html` still contain leftover template
  placeholder text (Lorem Ipsum / Santorini references) pending a content
  rewrite pass.

## Files added/changed in this restructure
```
app/api/enquiry/route.js   → new: Next.js Route Handler (replaces api/enquiry.js)
lib/db.js, lib/mailer.js    → moved to project root, converted to ES modules
next.config.mjs               → new: clean-URL rewrites + custom 404 fallback
package.json                   → now a Next.js app (added next, react, react-dom)
public/                          → new: all HTML pages + assets moved here unchanged
vercel.json                       → removed (no longer needed for Next.js)
```
