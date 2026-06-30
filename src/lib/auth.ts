import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getServerSession } from 'next-auth';
import { authOptions } from './nextauth';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'astar-nextauth-secret-key';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  avatar: string | null;
  role: string;
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Compare password
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Generate JWT token
export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

// Verify JWT token
export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
}

// Get user from request
export async function getUserFromRequest(request: NextRequest): Promise<AuthUser | null> {
  // Check NextAuth session first
  const session = await getServerSession(authOptions);
  if (session?.user) {
    return {
      id: session.user.id as string,
      email: session.user.email as string,
      name: session.user.name ?? null,
      phone: session.user.phone as string | null,
      avatar: session.user.image ?? null,
      role: session.user.role as string,
    };
  }
  
  // Fall back to custom JWT token
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  if (!token) {
    // Try to get from cookies
    const cookieToken = request.cookies.get('auth-token')?.value;
    if (!cookieToken) return null;
    
    const decoded = verifyToken(cookieToken);
    if (!decoded) return null;
    
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        isBlocked: true,
      },
    });
    
    if (!user || user.isBlocked) return null;
    return user;
  }
  
  const decoded = verifyToken(token);
  if (!decoded) return null;
  
  const user = await db.user.findUnique({
    where: { id: decoded.userId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      avatar: true,
      role: true,
      isBlocked: true,
    },
  });
  
  if (!user || user.isBlocked) return null;
  return user;
}

// Require authentication middleware
export async function requireAuth(request: NextRequest): Promise<AuthUser | NextResponse> {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return user;
}

// Require admin middleware
export async function requireAdmin(request: NextRequest): Promise<AuthUser | NextResponse> {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403 });
  }
  return user;
}

// Set auth cookie
export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  });
}

// Clear auth cookie
export function clearAuthCookie(response: NextResponse): void {
  response.cookies.delete('auth-token');
}