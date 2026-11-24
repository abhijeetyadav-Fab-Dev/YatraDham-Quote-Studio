import { createFileRoute, redirect } from "@tanstack/react-router";

// The quotation editor is a self-contained page served from /studio.html.
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ href: "/studio.html" });
  },
  head: () => ({
    meta: [
      { title: "YatraDham Quote Studio" },
      { name: "description", content: "Create, share and manage travel quotations for the YatraDham team." },
      { property: "og:title", content: "YatraDham Quote Studio" },
      { property: "og:description", content: "Create, share and manage travel quotations for the YatraDham team." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
