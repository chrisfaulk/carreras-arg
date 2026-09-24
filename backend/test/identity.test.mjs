import { describe, it } from "node:test";
import assert from "node:assert/strict";

process.env.DATABASE_URL ??= "postgres://localhost:5432/test";

process.env.JWT_SECRET ??= "test-secret-1234567890";

process.env.GOOGLE_CLIENT_ID ??= "test";

process.env.GOOGLE_CLIENT_SECRET ??= "test";

process.env.RESEND_API_KEY ??= "test";

process.env.NEXT_PUBLIC_API_URL ??= "http://localhost:3001";

process.env.ADMIN_SEED_EMAIL ??= "admin@example.com";

const { signToken, checkToken } = await import("../dist/shared/tokens.js");

const { registerSchema } = await import("../dist/modules/identity/identity.service.js");

describe("tokens (verify stateless)", () => {
  it("verify roundtrip", () => {
    const t = signToken("user-1", "verify");
    assert.equal(checkToken(t, "verify"), "user-1");
  });

  it("purpose mismatch rejected", () => {
    const t = signToken("user-1", "verify");
    assert.throws(() => checkToken(t, "reset"));
  });

  it("garbage rejected", () => {
    assert.throws(() => checkToken("nope", "access"));
  });
});

describe("register schema", () => {
  it("rejects acceptedPrivacy=false", () => {
    assert.throws(() =>
      registerSchema.parse({
        email: "a@b.com",
        username: "abc",
        displayName: "A",
        password: "12345678",
        acceptedPrivacy: false,
      }),
    );
  });

  it("rejects short password", () => {
    assert.throws(() =>
      registerSchema.parse({
        email: "a@b.com",
        username: "abc",
        displayName: "A",
        password: "1234",
        acceptedPrivacy: true,
      }),
    );
  });
});
