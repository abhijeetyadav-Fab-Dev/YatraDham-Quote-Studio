// Customer-facing, immutable snapshot. Never expose contact details, bank details or internal remarks.
export type ShareDoc = Record<string, unknown>;

const e = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;" })[c]!);
const num = (v: unknown) => Number(v) || 0;
const pyRound = (x: number) => Math.floor(x + 0.5);
const lines = (x: unknown) =>
  String(x ?? "")
    .split(/\r?\n/)
    .filter((z) => z.trim())
    .map((z) => `<li>${e(z.trim())}</li>`)
    .join("");
const objs = (v: unknown) => (Array.isArray(v) ? v.filter((x) => x && typeof x === "object") : []) as Record<string, unknown>[];

export function computeTotal(d: ShareDoc) {
  const p = num(d["pp"]) * num(d["pax"]);
  const extra = objs(d["svc"]).reduce((s, x) => s + num(x["a"]), 0);
  const net = Math.max(0, p + extra - num(d["disc"]));
  const gst = pyRound((net * num(d["gst"])) / 100);
  const tcs = pyRound(((net + gst) * num(d["tcs"])) / 100);
  return pyRound(net + gst + tcs);
}

export function renderShare(d: ShareDoc) {
  const st = objs(d["stays"]).map((x) => `<tr><td>${e(x["loc"])}</td><td>${e(x["h"])}</td><td>${e(x["room"])}</td><td>${e(x["nights"])}</td></tr>`).join("");
  const days = objs(d["days"]).map((x, i) => `<h3>Day ${i + 1} — ${e(x["t"])}</h3><ul>${lines(x["a"])}</ul>`).join("");
  const sections = (
    [["Inclusions", "inc"], ["Exclusions", "exc"], ["Additional Services", "extraServices"], ["Cancellation Policy", "can"], ["Additional Notes", "notes"], ["Payment Policy", "pay"]] as const
  )
    .filter(([, k]) => d[k])
    .map(([t, k]) => `<h2>${t}</h2><ul>${lines(d[k])}</ul>`)
    .join("");
  const date = d["start"] ? ` <p><b>Travel dates:</b> ${e(d["start"])}${d["end"] ? " to " + e(d["end"]) : ""}</p>` : "";
  const total = computeTotal(d).toLocaleString("en-US");
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Quotation</title><style>body{font:16px/1.5 system-ui;max-width:850px;margin:auto;padding:24px;color:#30232a}h1,h2{color:#721c45}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ddd;padding:8px;text-align:left}th{background:#721c45;color:white}</style></head><body><h1>${e(d["pkg"])}</h1><p>${e(d["type"])} · ${e(d["no"])}</p><p><b>Customer:</b> ${e(d["cust"])}</p>${date}<p><b>Route:</b> ${e(d["route"])}</p><h2>Itinerary</h2>${days}<h2>Stay Details</h2><table><tr><th>Location</th><th>Hotel</th><th>Room</th><th>Nights</th></tr>${st}</table><h2>Price</h2><p>Estimated payable amount: Rs. ${e(total)}</p>${sections}<p><small>This is a shared snapshot, not a live document.</small></p></body></html>`;
}
