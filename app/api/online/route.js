import { NextResponse } from 'next/server';
import { verifyJwtToken } from '@/lib/auth';

// Initialize global in-memory store for online states
if (!global.onlineState) {
  global.onlineState = {};
}

// Helper to authenticate API requests
async function authUser(request) {
  const token = request.cookies.get('session_token')?.value;
  if (!token) return null;
  return await verifyJwtToken(token);
}

export async function GET(request) {
  try {
    const user = await authUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return the whole object so frontend can check the other user
    return NextResponse.json({ onlineState: global.onlineState });
  } catch (error) {
    console.error('Fetch online state error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await authUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update lastSeen for the requesting user
    global.onlineState[user.username] = Date.now();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Post online state error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
