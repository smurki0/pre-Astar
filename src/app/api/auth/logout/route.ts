import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';

// POST /api/auth/logout - Logout user
export async function POST() {
  const response = NextResponse.json({ success: true });
  clearAuthCookie(response);
  return response;
}
