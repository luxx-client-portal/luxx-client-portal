# Luxx Client Hub
A production-ready Next.js 16 + Supabase client portal for content approvals, requests, contracts, documents and invoices.

## 1. Supabase
1. Create a Supabase project.
2. Open SQL Editor and run `supabase/schema.sql`.
3. In Authentication > Users, create your Luxx admin user.
4. Copy that user's UUID and run:
   `update public.profiles set role='admin', full_name='Priscilla Hardie' where id='YOUR_UUID';`
5. Create client users in Authentication > Users. Add clients in the portal, then assign each client user's `profiles.client_id` in the Table Editor or SQL.

## 2. Environment variables
Copy `.env.example` to `.env.local` and add your Supabase Project URL and publishable key.
Never add a service-role key to a `NEXT_PUBLIC_` variable or commit it to GitHub.

## 3. Local setup
```bash
npm install
npm run dev
```

## 4. Deploy to Vercel
Import the GitHub repository, add the three environment variables, and deploy.
Set `NEXT_PUBLIC_APP_URL` to your production URL, for example `https://portal.luxxsocials.com`.

## 5. Connect Squarespace domain
In Vercel, add `portal.luxxsocials.com`. Vercel will provide the DNS record to add in Squarespace Domains.

## Current features
- Email/password authentication and password reset
- Admin and client roles
- Client-isolated data with Supabase Row Level Security
- Client dashboard
- Content calendar and approvals
- Edit-request feedback comments
- Documents and contracts links
- Invoice records and downloads
- Request center
- Admin screens for clients, content, documents and invoices
- Responsive mobile UI

## Storage note
The v1 admin forms accept URLs for previews and files. This keeps setup lean and works with Google Drive, Dropbox, Stripe invoice URLs or Supabase Storage signed URLs. Do not use permanently public links for confidential contracts unless that is acceptable for your workflow.
