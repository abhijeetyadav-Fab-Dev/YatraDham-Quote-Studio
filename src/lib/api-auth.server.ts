import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const json = (status: number, data: unknown) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

/** Verifies the bearer token and returns a user-scoped client plus the caller's role. */
export async function authenticate(request: Request) {
  const token = (request.headers.get("authorization") || "").replace(/^Bearer /, "").trim();
  if (!token || token.split(".").length !== 3) return null;
  const url =
    process.env["SUPABASE_URL"] ||
    process.env["VITE_SUPABASE_URL"] ||
    "https://rhviutmbiurgejvoxitp.supabase.co";
  const key =
    process.env["SUPABASE_PUBLISHABLE_KEY"] ||
    process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ||
    "sb_publishable_hOgX3byjYpF5ntglxVyGJA_BYtm7TeQ";
  const supabase = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        h.set("apikey", key);
        h.set("Authorization", `Bearer ${token}`);
        return fetch(input, { ...init, headers: h });
      },
    },
  });

  let userId: string | null = null;
  try {
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (!claimsError && claimsData?.claims?.sub) {
      userId = claimsData.claims.sub as string;
    }
  } catch {}

  if (!userId) {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser(token);
      if (!userError && userData?.user?.id) {
        userId = userData.user.id;
      }
    } catch {}
  }

  if (!userId) return null;

  let role: string | null = null;
  try {
    const { data: roleData } = await supabase.rpc("current_role_name");
    role = (roleData as string | null) ?? null;
  } catch (err) {
    console.warn("Could not query current_role_name in authenticate():", err);
  }

  return { supabase, userId, role };
}
