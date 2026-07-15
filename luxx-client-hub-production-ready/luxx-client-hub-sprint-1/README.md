# Luxx Client Hub — Sprint 1 Authentication

This release provides:

- Email/password sign-in
- Forgot-password emails
- Password update page for resets and invitations
- Supabase PKCE callback route
- Protected portal routes
- Admin/client profile loading
- Sign-out
- Supabase health endpoint at `/api/health/supabase`

## Required Vercel variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
NEXT_PUBLIC_APP_URL=https://YOUR-VERCEL-DOMAIN.vercel.app
```

`NEXT_PUBLIC_SUPABASE_ANON_KEY` is also supported as a fallback to the publishable key.

## Supabase URL configuration

Set the Site URL to the production Vercel URL. Add these Redirect URLs:

- `https://YOUR-VERCEL-DOMAIN.vercel.app/auth/callback`
- `https://YOUR-VERCEL-DOMAIN.vercel.app/update-password`

## Connection check

After deployment, open:

`https://YOUR-VERCEL-DOMAIN.vercel.app/api/health/supabase`

A working connection returns JSON with `"ok": true`.

## Admin account

Create the user under Supabase Authentication, then run:

```sql
update public.profiles
set role = 'admin', full_name = 'Priscilla Hardie', client_id = null
where id = (select id from auth.users where email = 'YOUR_EMAIL');
```

## Local build

```bash
npm install
npm run typecheck
npm run build
```
