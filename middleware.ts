import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Rafraîchit la session Supabase à chaque requête. Sans ce middleware, le token
// d'accès expire (~1h) et les Server Components/Actions ne reconnaissent plus
// l'utilisateur connecté, ce qui casse silencieusement les policies RLS (is_agence()
// renvoie false) même si la page semble toujours affichée normalement.
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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Ce simple appel déclenche le rafraîchissement du token si besoin et
  // réécrit le cookie de session via setAll ci-dessus. On le protège avec un
  // timeout : si l'appel réseau vers Supabase traîne ou échoue, on ne doit
  // jamais bloquer indéfiniment le rendu de la page (sinon toute l'app reste
  // sur une page blanche tant que la requête n'a pas abouti).
  try {
    await Promise.race([
      supabase.auth.getUser(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("supabase auth timeout")), 5000)),
    ]);
  } catch {
    // On laisse passer la requête telle quelle : les pages/Server Actions
    // géreront elles-mêmes l'absence de session valide.
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
