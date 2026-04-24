import { NextResponse } from 'next/server';
import { signJwtToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    const user1Username = process.env.APP_USER_1_USERNAME;
    const user1Password = process.env.APP_USER_1_PASSWORD;
    
    const user2Username = process.env.APP_USER_2_USERNAME;
    const user2Password = process.env.APP_USER_2_PASSWORD;

    let validUser = null;

    if (username === user1Username && password === user1Password) {
      validUser = { username: user1Username, id: 'user1' };
    } else if (username === user2Username && password === user2Password) {
      validUser = { username: user2Username, id: 'user2' };
    }

    if (!validUser) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = await signJwtToken({ username: validUser.username, id: validUser.id });

    const response = NextResponse.json({ success: true, user: validUser });

    response.cookies.set({
      name: 'session_token',
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: 'strict',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
