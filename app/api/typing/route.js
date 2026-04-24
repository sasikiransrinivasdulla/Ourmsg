import { NextResponse } from 'next/server';
import { verifyJwtToken } from '@/lib/auth';

// Initialize global in-memory store for typing states
if (!global.typingState) {
  global.typingState = {};
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

    const { searchParams } = new URL(request.url);
    const room = searchParams.get('room');

    if (!room) {
      return NextResponse.json({ error: 'Room is required' }, { status: 400 });
    }

    const roomState = global.typingState[room] || {};
    const now = Date.now();
    const activeTypingUsers = [];

    // Filter out users who haven't sent a typing ping in the last 3 seconds
    for (const [username, timestamp] of Object.entries(roomState)) {
      if (now - timestamp < 3000) {
        activeTypingUsers.push(username);
      } else {
        delete roomState[username]; // cleanup expired
      }
    }

    return NextResponse.json({ typing: activeTypingUsers });
  } catch (error) {
    console.error('Fetch typing state error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await authUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { room, isTyping } = body;

    if (!room) {
      return NextResponse.json({ error: 'Room is required' }, { status: 400 });
    }

    if (!global.typingState[room]) {
      global.typingState[room] = {};
    }

    if (isTyping) {
      global.typingState[room][user.username] = Date.now();
    } else {
      delete global.typingState[room][user.username];
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Post typing state error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
