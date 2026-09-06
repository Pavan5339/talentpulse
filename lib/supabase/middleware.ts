import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    const protectedPaths = ["/dashboard", "/job", "/create-interview"]
    const isProtectedRoute = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))

    if (isProtectedRoute && !user) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      return NextResponse.redirect(url)
    }

    if (user && (request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/signup" || request.nextUrl.pathname === "/")) {
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  } catch (error) {
    // If environment variables are completely missing during Vercel deployment, 
    // the Supabase client initialization will aggressively throw an error. 
    // Catching it prevents a 500 MIDDLEWARE_INVOCATION_FAILED crash.
    console.error("Middleware Supabase Init Error:", error)
    
    // Safely fallback and let non-protected pages render even if Supabase is totally broken
    const protectedPaths = ["/dashboard", "/job", "/create-interview"]
    const isProtectedRoute = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))
    
    if (isProtectedRoute) {
      const url = request.nextUrl.clone()
      url.pathname = "/"
      return NextResponse.redirect(url)
    }
    
    return supabaseResponse
  }
}
