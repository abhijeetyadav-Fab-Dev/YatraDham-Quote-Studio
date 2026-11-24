import { createFileRoute } from "@tanstack/react-router";
import { authenticate, json } from "@/lib/api-auth.server";
import { localFix } from "../../../../public/studio-grammar.js";

export const Route = createFileRoute("/api/public/grammar")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await authenticate(request);
        if (!auth) return json(401, { error: "Sign in required." });
        if (auth.role !== "admin" && auth.role !== "editor") return json(403, { error: "Editor or admin required." });
        const key = process.env["OPENROUTER_API_KEY"];
        const model = process.env["OPENROUTER_MODEL"];
        if (!key || !model) return json(503, { error: "AI grammar is not configured yet (OpenRouter key and model needed)." });
        const body = (await request.json().catch(() => ({}))) as { text?: unknown };
        const originalText = String(body.text ?? "");
        if (!originalText || originalText.length > 4000) return json(400, { error: "Text must be 1–4000 characters." });
        const text = localFix(originalText);
        // Free models are often rate-limited upstream, so fall back through a short list.
        const FALLBACK_MODELS = [
          // Fastest working free models (measured ~0.6–1.2s), in order.
          "nvidia/nemotron-3.5-lightning:free",
          "cohere/north-mini-code:free",
          "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
          "nvidia/nemotron-3.5-super-vl:free",
        ];
        const models = [...FALLBACK_MODELS, ...(FALLBACK_MODELS.includes(model) ? [] : [model])];
        let out: string | null = null;
        const errs: string[] = [];
        for (const m of models) {
          const ctl = new AbortController();
          const timer = setTimeout(() => ctl.abort(), 4000);
          try {
            const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
              method: "POST",
              signal: ctl.signal,
              headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                model: m,
                temperature: 0,
                max_tokens: Math.min(2500, Math.ceil(text.length / 2) + 150),
                reasoning: { enabled: false },
                messages: [
                  { role: "system", content: "You proofread travel quotations (often Indian destinations). Correct grammar and spelling, including misspelled place names, cities and landmarks (e.g. Ahamedabad -> Ahmedabad). Keep separators, punctuation style, line breaks, every number, currency, date and factual meaning exactly. Return only the corrected text, with no explanation." },
                  { role: "user", content: text },
                ],
              }),
            });
            if (!r.ok) { errs.push(`${m}: ${r.status}`); continue; }
            const j = (await r.json()) as { choices: { message: { content: string } }[] };
            const content = (j.choices[0]?.message.content ?? "").trim();
            if (content) { out = content; break; }
          } catch (e) {
            errs.push(`${m}: ${String(e)}`);
            // timed out or failed: try the next model
          } finally {
            clearTimeout(timer);
          }
        }
        if (out === null) { console.error("grammar failed", errs); return json(502, { error: "The free AI models are busy right now. Please try again in a moment." }); }
        out = localFix(out);
        const nums = (s: string) => (s.match(/\d+/g) || []).join(",");
        if (nums(out) !== nums(text)) return json(422, { error: "AI changed numbers; suggestion rejected." });
        await auth.supabase.rpc("write_audit", { _action: "grammar.request", _detail: "Text sent to configured AI provider" });
        return json(200, { suggestion: out });
      },
    },
  },
});
