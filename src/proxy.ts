import { NextRequest, NextResponse } from 'next/server'

const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || ''
const hasValidClerkKey = clerkKey.startsWith('pk_') && !clerkKey.includes('your_clerk')

// Protected dashboard routes — require authentication
const PROTECTED_PATHS = ['/dashboard', '/products', '/queue', '/scraper', '/content', '/export', '/analytics', '/categories', '/settings']

const middleware = hasValidClerkKey
  ? (() => {
      const { clerkMiddleware, createRouteMatcher } = require('@clerk/nextjs/server')
      const isProtectedRoute = createRouteMatcher(PROTECTED_PATHS.map(p => `${p}(.*)`))
      return clerkMiddleware(async (auth: () => Promise<{ protect: () => void; userId?: string }>, req: NextRequest) => {
        if (isProtectedRoute(req)) {
          const { userId } = await auth()
          if (!userId) {
            // Redirect to sign-in with return URL
            const signInUrl = new URL('/sign-in', req.url)
            signInUrl.searchParams.set('redirect_url', req.url)
            return NextResponse.redirect(signInUrl)
          }
        }
      })
    })()
  : (req: NextRequest) => {
      // No Clerk key — allow all routes but show "setup required" banner on dashboard
      return NextResponse.next()
    }

export default middleware

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
