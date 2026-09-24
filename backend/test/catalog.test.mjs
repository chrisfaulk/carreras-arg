import { describe, it } from "node:test";
import assert from "node:assert/strict";

process.env.DATABASE_URL ??= "postgres://localhost:5432/test";

process.env.JWT_SECRET ??= "test-secret-1234567890";

process.env.GOOGLE_CLIENT_ID ??= "test";

process.env.GOOGLE_CLIENT_SECRET ??= "test";

process.env.RESEND_API_KEY ??= "test";

process.env.NEXT_PUBLIC_API_URL ??= "http://localhost:3001";

process.env.ADMIN_SEED_EMAIL ??= "admin@example.com";

const { pagination, paged, listQuerySchema } = await import("../dist/shared/pagination.js");

const { hasPath } = await import("../dist/modules/catalog/correlative-graph.js");

describe("pagination", () => {
  it("defaults page=1 limit=20", () => {
    assert.deepEqual(pagination(listQuerySchema.parse({})), { page: 1, limit: 20, skip: 0 });
  });

  it("clamps limit to 50", () => {
    assert.equal(pagination(listQuerySchema.parse({ limit: "999" })).limit, 50);
  });

  it("page 3 skip 40", () => {
    assert.deepEqual(pagination(listQuerySchema.parse({ page: "3" })), { page: 3, limit: 20, skip: 40 });
  });

  it("paged wraps meta", () => {
    assert.deepEqual(paged([1], 100, 2, 20), { data: [1], meta: { page: 2, limit: 20, total: 100 } });
  });
});

describe("correlatives BFS (hasPath)", () => {
  const adj = new Map([
    ["a", ["b"]],
    ["b", ["c"]],
    ["c", []],
  ]);

  it("finds transitive path", () => {
    assert.equal(hasPath(adj, "a", "c"), true);
  });

  it("no path back", () => {
    assert.equal(hasPath(adj, "c", "a"), false);
  });

  it("self cycle detected", () => {
    assert.equal(hasPath(new Map([["a", ["a"]]]), "a", "a"), true);
  });

  it("indirect cycle: c->a closes loop", () => {
    assert.equal(
      hasPath(
        new Map([
          ["a", ["b"]],
          ["b", ["c"]],
          ["c", ["a"]],
        ]),
        "c",
        "a",
      ),
      true,
    );
  });
});
