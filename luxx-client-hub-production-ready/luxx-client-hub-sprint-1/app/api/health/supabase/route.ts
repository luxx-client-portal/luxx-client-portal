import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, '');
  const key = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();

  if (!url || !key) {
    return NextResponse.json(
      { ok: false, error: 'Missing Supabase environment variables.' },
      { status: 500 },
    );
  }

  try {
    const response = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: key },
      cache: 'no-store',
    });

    const body = await response.text();
    return NextResponse.json(
      {
        ok: response.ok,
        status: response.status,
        projectHost: new URL(url).host,
        response: body.slice(0, 300),
      },
      { status: response.ok ? 200 : 502 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        projectHost: new URL(url).host,
        error: error instanceof Error ? error.message : 'Unknown connection error',
      },
      { status: 502 },
    );
  }
}
