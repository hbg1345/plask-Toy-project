import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";

/**
 * ⚠️ IMPORTANT: AUTHENTICATION ARCHITECTURE ⚠️
 *
 * This middleware function ONLY refreshes session cookies.
 * It does NOT perform authentication checks or redirects.
 *
 * Authentication is handled at the PAGE LEVEL, not at the middleware level.
 * Each protected page (problems, recommendations, chat, profile) performs
 * its own authentication check using `supabase.auth.getClaims()`.
 *
 * DO NOT add authentication checks or redirects here.
 * If you need to protect a route, add the check in the page component itself.
 *
 * Example of page-level auth check:
 * ```ts
 * const supabase = await createClient();
 * const { data: claimsData } = await supabase.auth.getClaims();
 * const claims = claimsData?.claims;
 * if (!claims) {
 *   redirect("/auth/login");
 * }
 * ```
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // If the env vars are not set, skip proxy check. You can remove this
  // once you setup the project.
  if (!hasEnvVars) {
    return supabaseResponse;
  }

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: This call ONLY refreshes the session cookies.
  // DO NOT add authentication checks or redirects here.
  // Authentication is handled at the page level (see comment at top of file).
  await supabase.auth.getClaims();

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
