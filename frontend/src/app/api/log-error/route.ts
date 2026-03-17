import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.error('[CLIENT_ERROR]', JSON.stringify(body));
  } catch {
    // ignore
  }
  return NextResponse.json({ ok: true });
}
