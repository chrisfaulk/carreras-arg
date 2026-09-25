import { describe, it } from "node:test";
import assert from "node:assert/strict";

process.env.DATABASE_URL ??= "postgres://localhost:5432/test";

process.env.JWT_SECRET ??= "test-secret-1234567890";

process.env.GOOGLE_CLIENT_ID ??= "test";

process.env.GOOGLE_CLIENT_SECRET ??= "test";

process.env.RESEND_API_KEY ??= "test";

process.env.NEXT_PUBLIC_API_URL ??= "http://localhost:3001";

process.env.ADMIN_SEED_EMAIL ??= "admin@example.com";

if (!process.env.PORT) process.env.PORT = "3001";

const { PURGE_AFTER_DAYS, purgeCutoff } = await import("../dist/modules/identity/identity.service.js");

describe("purge cutoff (30d)", () => {
  it("is 30 days before now", () => {
    assert.equal(PURGE_AFTER_DAYS, 30);
    const now = new Date("2026-09-25T03:00:00Z");
    assert.equal(purgeCutoff(now).toISOString(), "2026-08-26T03:00:00.000Z");
  });

  it("defaults to now", () => {
    const before = Date.now();
    const cutoff = purgeCutoff().getTime();
    const after = Date.now();
    assert.ok(cutoff <= after - PURGE_AFTER_DAYS * 86400 * 1000 + 1000);
    assert.ok(cutoff >= before - PURGE_AFTER_DAYS * 86400 * 1000 - 1000);
  });
});
