import { NextResponse } from 'next/server';
import { verifyJwtToken } from '@/lib/auth';

export async function GET(request) {
  const token = request.cookies.get('session_token')?.value;
  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const verifiedToken = await verifyJwtToken(token);
  if (!verifiedToken) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user: verifiedToken });
}
