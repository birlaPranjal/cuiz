import { NextResponse } from 'next/server'
import { NextRequestWithAuth } from 'next-auth/middleware'

// Middleware is disabled - all routes will pass through
export default async function middleware(req: NextRequestWithAuth) {
  // Allow all requests to pass through
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
} 