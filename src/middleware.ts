import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ROLE_PREFIXES: Record<string, string> = {
  "/agency": "agency",
  "/admin": "admin",
  "/account": "candidate",
};

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const protectedPrefix = Object.keys(ROLE_PREFIXES).find(
    (p) => path.startsWith(p) && !path.startsWith(`${p}/login`) && !path.startsWith(`${p}/register`)
  );

  if (protectedPrefix && !user) {
    const url = request.nextUrl.clone();
    url.pathname = `${protectedPrefix}/login`;
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/razorpay/webhook|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)",
  ],
};
