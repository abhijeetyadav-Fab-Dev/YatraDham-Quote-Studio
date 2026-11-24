<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- The quotation editor is a self-contained static page (public/studio.html + public/studio-cloud.js); "/" redirects to it. Why: preserves the migrated vanilla editor that relies on shared script globals.
- Cloud document/share/audit writes go through SECURITY DEFINER SQL functions that check roles in user_roles; server routes under /api/public/* verify the bearer token themselves. Why: keeps the original role and version-conflict rules on the server.
- Shared package filtering uses public/studio-masters.js and central package subcategory IDs, while saved quote labels remain snapshots. Why: keeps linked choices reusable without rewriting older quotes after master changes.
- Instant spelling corrections live in public/studio-grammar.js and are shared by manual, automatic and API checks; automatic checks handle data-e text and data-el lists and save through the editor model. Why: keeps spelling consistent and corrections persistent without rewriting shared snapshots.
