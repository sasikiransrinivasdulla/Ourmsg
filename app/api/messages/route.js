import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Message from '@/models/Message';
import { verifyJwtToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

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
    const skip = parseInt(searchParams.get('skip') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    if (!room) {
      return NextResponse.json({ error: 'Room is required' }, { status: 400 });
    }

    await dbConnect();
    
    // Fetch latest messages for the room, sorted by newest first for skip/limit
    let messages = await Message.find({ room })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Reverse order to send oldest -> newest
    messages = messages.reverse();
    
    const totalCount = await Message.countDocuments({ room });
    const hasMore = totalCount > skip + messages.length;

    return NextResponse.json({ messages, hasMore, totalCount });
  } catch (error) {
    console.error('Fetch messages error:', error);
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
    const { room, message } = body;

    if (!room || !message) {
      return NextResponse.json({ error: 'Room and message are required' }, { status: 400 });
    }

    await dbConnect();

    const newMessage = await Message.create({
      room,
      sender: user.username,
      message,
    });

    return NextResponse.json({ message: newMessage }, { status: 201 });
  } catch (error) {
    console.error('Post message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
