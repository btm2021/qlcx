import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Role hierarchy for permission checking
const ROLE_HIERARCHY = {
  'SUPER_ADMIN': 4,
  'ADMIN': 3,
  'MANAGER': 2,
  'STAFF': 1
}

type UserRole = keyof typeof ROLE_HIERARCHY

// Route access configuration
const ROUTE_ACCESS: Record<string, UserRole[]> = {
  '/settings': ['SUPER_ADMIN', 'ADMIN'],
  '/staff': ['SUPER_ADMIN', 'ADMIN'],
  '/reports/financial': ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/forgot-password', '/auth/callback']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // If user is not authenticated and trying to access protected route
  if (!user && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // If user is authenticated and trying to access login page
  if (user && pathname === '/login') {
    const dashboardUrl = new URL('/', request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  // Role-based access control for admin routes
  if (user && !isPublicRoute) {
    // Check if current route requires specific role
    const requiredRoute = Object.keys(ROUTE_ACCESS).find(route =>
      pathname.startsWith(route)
    )

    if (requiredRoute) {
      // Get user's staff role
      const { data: staffData } = await supabase
        .from('staff')
        .select('role')
        .eq('auth_user_id', user.id)
        .single()

      const userRole = staffData?.role as UserRole
      const allowedRoles = ROUTE_ACCESS[requiredRoute]

      if (!userRole || !allowedRoles.includes(userRole)) {
        // Redirect to dashboard if not authorized
        const dashboardUrl = new URL('/', request.url)
        return NextResponse.redirect(dashboardUrl)
      }
    }
  }

  // Add security headers
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; font-src 'self'; connect-src 'self' https://*.supabase.co;"
  )

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
