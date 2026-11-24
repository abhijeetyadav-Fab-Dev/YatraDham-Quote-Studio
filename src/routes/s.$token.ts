import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { renderShare, type ShareDoc } from "@/lib/render-share";

export const Route = createFileRoute("/s/$token")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const sb = createClient(process.env["SUPABASE_URL"]!, process.env["SUPABASE_PUBLISHABLE_KEY"]!, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data } = await sb.rpc("get_share", { _token: params.token });
        const headers = {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
          "referrer-policy": "no-referrer",
          "x-content-type-options": "nosniff",
          "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
        };
        if (!data) return new Response("Share link expired, revoked or invalid.", { status: 404, headers });
        return new Response(renderShare(data as ShareDoc), { status: 200, headers });
      },
    },
  },
});
