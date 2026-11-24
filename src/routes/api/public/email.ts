import { createFileRoute } from "@tanstack/react-router";
import { authenticate, json } from "@/lib/api-auth.server";

// The original server sent plain-text summaries over SMTP. Raw SMTP is not available
// on this hosting runtime, so sending stays disabled until an email provider is chosen.
export const Route = createFileRoute("/api/public/email")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await authenticate(request);
        if (!auth) return json(401, { error: "Sign in required." });
        if (auth.role !== "admin" && auth.role !== "editor") return json(403, { error: "Editor or admin required." });
        return json(503, {
          error: "Summary email is not set up yet. Use the editor's Email button and attach the PDF manually for now.",
        });
      },
    },
  },
});
