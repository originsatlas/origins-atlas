import { NextResponse } from 'next/server';
import {
  validateAdminCredentials,
  createSessionToken,
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_DURATION,
} from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const validation = await validateAdminCredentials(email, password);

    if (!validation.valid || !validation.email) {
      return NextResponse.json(
        { success: false, error: validation.error || 'Invalid credentials' },
        { status: 401 }
      );
    }

    const token = await createSessionToken(validation.email);

    const response = NextResponse.json({
      success: true,
      user: {
        email: validation.email,
        role: 'admin',
      },
    });

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: ADMIN_SESSION_DURATION,
    });

    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed. Please try again.' },
      { status: 500 }
    );
  }
}
