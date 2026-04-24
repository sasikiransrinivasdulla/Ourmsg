import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Message from '@/models/Message';
import { verifyJwtToken } from '@/lib/auth';

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

    await dbConnect();
    
    // Fetch last 100 messages for the room, sorted by oldest first
    const messages = await Message.find({ room })
      .sort({ timestamp: 1 })
      .limit(100)
      .lean();

    return NextResponse.json({ messages });
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
