import { createFileRoute } from "@tanstack/react-router";
import { authenticate, json } from "@/lib/api-auth.server";

const ROLES = ["admin", "editor", "viewer"] as const;
type Role = (typeof ROLES)[number];

export const Route = createFileRoute("/api/public/users")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await authenticate(request);
        if (!auth) return json(401, { error: "Sign in required." });
        if (auth.role !== "admin") return json(403, { error: "Admin required." });
        const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
        const email = String(b["email"] ?? "").trim().toLowerCase();
        const role = String(b["role"] ?? "") as Role;
        if (!/^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(email) || !ROLES.includes(role))
          return json(400, { error: "Valid email and role (admin/editor/viewer) required." });

        const hasServiceKey = Boolean(process.env["SUPABASE_SERVICE_ROLE_KEY"]);

        // Handle grant-only role assignment
        if (b["grantOnly"]) {
          if (hasServiceKey) {
            try {
              const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
              const { data: list, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
              if (error) throw error;
              const found = list.users.find((u) => u.email?.toLowerCase() === email);
              if (!found) return json(404, { error: "No account with that email." });
              await supabaseAdmin.from("user_roles").delete().eq("user_id", found.id);
              const { error: rErr } = await supabaseAdmin.from("user_roles").insert({ user_id: found.id, role });
              if (rErr) throw rErr;
            } catch (err: any) {
              console.warn("Service key grant failed, trying RPC:", err?.message);
              const { error: rpcErr } = await auth.supabase.rpc("admin_grant_role", { _email: email, _role: role });
              if (rpcErr) return json(500, { error: rpcErr.message || "Could not grant role." });
            }
          } else {
            const { error: rpcErr } = await auth.supabase.rpc("admin_grant_role", { _email: email, _role: role });
            if (rpcErr) return json(500, { error: rpcErr.message || "Could not grant role." });
          }

          await auth.supabase.rpc("write_audit", { _action: "user.role", _detail: `${email} → ${role}` }).catch(() => {});
          return json(200, { ok: true });
        }

        // Handle new user creation
        const username = String(b["username"] ?? "").trim();
        const password = String(b["password"] ?? "");
        if (username.length < 2 || username.length > 80 || password.length < 12 || password.length > 200)
          return json(400, { error: "Display name 2–80 characters; password at least 12 characters." });

        if (!hasServiceKey) {
          return json(503, {
            error: "SUPABASE_SERVICE_ROLE_KEY is not configured on server. Client fallback should be used.",
            fallbackToClient: true,
          });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email, password, email_confirm: true, user_metadata: { username },
        });
        if (error || !data.user) return json(409, { error: error?.message || "Could not create user." });
        const userId = data.user.id;

        await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
        const { error: rErr } = await supabaseAdmin.from("user_roles").insert({ user_id: userId, role });
        if (rErr) return json(500, { error: "Could not set role." });
        await supabaseAdmin.from("audit_log").insert({
          actor: String(auth.userId ?? "admin"), action: "user.create", detail: `${email} → ${role}`,
        });
        return json(201, { ok: true, userId });
      },
    },
  },
});
