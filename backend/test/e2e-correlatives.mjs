import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";

if (process.env.E2E_WIPE !== "1") {
  console.log("skip: E2E_WIPE!=1 (disposable DB required)");

  process.exit(0);
}

if (!process.env.PORT) process.env.PORT = "3001";

const { signToken } = await import("../dist/shared/tokens.js");

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3001";

const stamp = Date.now().toString(36);

const prisma = new PrismaClient();

async function wipe() {
  await prisma.finalExam.deleteMany();
  await prisma.evaluationRetake.deleteMany();
  await prisma.evaluationInstance.deleteMany();
  await prisma.subjectAttempt.deleteMany();
  await prisma.userStudyPlanEnrollment.deleteMany();
  await prisma.subjectCorrelative.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.studyPlan.deleteMany();
  await prisma.career.deleteMany();
  await prisma.university.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();
}

async function seed() {
  const uni = await prisma.university.create({ data: { name: `E2E Uni ${stamp}` } });

  const career = await prisma.career.create({ data: { name: "E2E Career", universityId: uni.id } });

  const plan = await prisma.studyPlan.create({
    data: { careerId: career.id, year: 2026, requiredElectives: 0 },
  });

  const a = await prisma.subject.create({
    data: { studyPlanId: plan.id, name: "Analisis I", requiresFinal: true },
  });

  const b = await prisma.subject.create({
    data: { studyPlanId: plan.id, name: "Analisis II", requiresFinal: true },
  });

  await prisma.subjectCorrelative.create({
    data: { subjectId: b.id, correlativeSubjectId: a.id, type: "PREVIOUS" },
  });

  return { planId: plan.id, aId: a.id, bId: b.id };
}

let jar = "";

async function call(path, init) {
  const res = await fetch(`${BASE}/api${path}`, {
    ...init,
    headers: { "content-type": "application/json", cookie: jar, ...init?.headers },
  });

  const setCookies = res.headers.getSetCookie();

  if (setCookies.length > 0) {
    jar = setCookies.map((c) => c.split(";")[0]).join("; ");
  }

  let body = null;

  try {
    body = await res.json();
  } catch {
    body = null;
  }

  return { status: res.status, body };
}

function pick(body) {
  return body;
}

await wipe();

const { planId, aId, bId } = await seed();

const email = `e2e+${stamp}@example.com`;

const reg = await call("/auth/register", {
  method: "POST",
  body: JSON.stringify({
    email,
    username: `e2e_${stamp}`,
    displayName: "E2E",
    password: "password123",
    acceptedPrivacy: true,
  }),
});

assert.equal(reg.status, 201);

const userId = pick(reg.body).id;

const verify = await call(`/auth/verify?token=${signToken(userId, "verify")}`);

assert.equal(verify.status, 200);

const login = await call("/auth/login", {
  method: "POST",
  body: JSON.stringify({ email, password: "password123" }),
});

assert.equal(login.status, 201);

const enroll = await call("/enrollments", {
  method: "POST",
  body: JSON.stringify({ studyPlanId: planId }),
});

assert.equal(enroll.status, 201);

const enrollmentId = pick(enroll.body).id;

async function statuses() {
  const res = await call(`/study-plans/${planId}/subjects?page=1&limit=50`);

  assert.equal(res.status, 200);

  const rows = pick(res.body).data;
  const out = {};

  for (const r of rows) out[r.id] = r.status;

  return out;
}

const before = await statuses();

assert.equal(before[aId], "AVAILABLE");

assert.equal(before[bId], "NOT_AVAILABLE");

const blocked = await call(`/enrollments/${enrollmentId}/attempts`, {
  method: "POST",
  body: JSON.stringify({ subjectId: bId }),
});

assert.equal(blocked.status, 409);

const created = await call(`/enrollments/${enrollmentId}/attempts`, {
  method: "POST",
  body: JSON.stringify({ subjectId: aId }),
});

assert.equal(created.status, 201);

const attemptId = pick(created.body).id;

const instances = await call(`/attempts/${attemptId}/instances`);

assert.equal(instances.status, 200);

for (const inst of pick(instances.body)) {
  const graded = await call(`/instances/${inst.id}`, {
    method: "PUT",
    body: JSON.stringify({ grade: 7 }),
  });

  assert.equal(graded.status, 200);
}

const closed = await call(`/attempts/${attemptId}/close`, { method: "PUT" });

assert.equal(closed.status, 200);

assert.equal(pick(closed.body).status, "PENDING_FINAL");

const final = await call(`/attempts/${attemptId}/final-exams`, {
  method: "POST",
  body: JSON.stringify({ grade: 8 }),
});

assert.equal(final.status, 201);

const passed = await call(`/attempts/${attemptId}`, {
  method: "PUT",
  body: JSON.stringify({ status: "PASSED" }),
});

assert.equal(passed.status, 200);

const after = await statuses();

assert.equal(after[aId], "PASSED");

assert.equal(after[bId], "AVAILABLE");

const averages = await call(`/enrollments/${enrollmentId}/averages`);

assert.equal(averages.status, 200);

assert.equal(pick(averages.body).average, 8);

await prisma.$disconnect();

console.log("e2e correlatives: PASS");
