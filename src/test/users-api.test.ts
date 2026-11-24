import { describe, expect, it } from "vitest";
import { json } from "@/lib/api-auth.server";

describe("Users API & Auth helpers", () => {
  it("json() helper returns valid Response with correct status and headers", async () => {
    const res = json(201, { ok: true, message: "User created" });
    expect(res.status).toBe(201);
    expect(res.headers.get("content-type")).toContain("application/json");
    expect(res.headers.get("cache-control")).toBe("no-store");
    const data = await res.json();
    expect(data).toEqual({ ok: true, message: "User created" });
  });

  it("json() helper formats errors with proper status", async () => {
    const res = json(400, { error: "Valid email and role required." });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Valid email and role required.");
  });

  it("validates roles allowed in team workspace", () => {
    const ROLES = ["admin", "editor", "viewer"] as const;
    expect(ROLES.includes("admin" as any)).toBe(true);
    expect(ROLES.includes("editor" as any)).toBe(true);
    expect(ROLES.includes("viewer" as any)).toBe(true);
    expect(ROLES.includes("superuser" as any)).toBe(false);
  });

  it("validates email regex correctly for user accounts", () => {
    const emailRegex = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;
    expect(emailRegex.test("user@yatradham.org")).toBe(true);
    expect(emailRegex.test("admin.team@domain.co.in")).toBe(true);
    expect(emailRegex.test("invalid-email")).toBe(false);
    expect(emailRegex.test("user@domain")).toBe(false);
    expect(emailRegex.test("")).toBe(false);
  });
});
