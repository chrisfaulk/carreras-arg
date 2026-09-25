import { cookies } from "next/headers";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export interface Paged<T> {
  data: T[];
  meta: { page: number; limit: number; total: number };
}

export interface University {
  id: string;
  name: string;
}

export interface Career {
  id: string;
  name: string;
  universityId: string;
}

export interface CareerDetail {
  id: string;
  name: string;
  university: { id: string; name: string };
}

export interface Plan {
  id: string;
  year: number;
  requiredElectives: number;
  careerId: string;
}

export interface PlanDetail {
  id: string;
  year: number;
  requiredElectives: number;
  career: { id: string; name: string; university: { id: string; name: string } };
}

export interface Subject {
  id: string;
  name: string;
  isElective: boolean;
  requiresFinal: boolean;
}

export type VisibleStatus = "PASSED" | "IN_PROGRESS" | "PENDING_FINAL" | "AVAILABLE" | "NOT_AVAILABLE";

export interface PlanSubject extends Subject {
  status: VisibleStatus;
  insufficientCorrelatives: boolean;
}

async function get<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API}/api${path}`, { next: { revalidate: 3600 } });

    if (!res.ok) return null;

    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export function getUniversities(q: string, page: number): Promise<Paged<University> | null> {
  return get<Paged<University>>(`/universities?q=${encodeURIComponent(q)}&page=${page}&limit=20`);
}

export function getUniversity(id: string): Promise<University | null> {
  return get<University>(`/universities/${id}`);
}

export function getCareers(universityId: string, page: number): Promise<Paged<Career> | null> {
  return get<Paged<Career>>(`/careers?universityId=${universityId}&page=${page}&limit=20`);
}

export interface CareerWithPlans extends Career {
  university: { id: string; name: string };
  plans: Plan[];
}

export function getCareersWithPlans(universityId: string, page: number): Promise<Paged<CareerWithPlans> | null> {
  const filter = universityId ? `universityId=${universityId}&` : "";

  return get<Paged<CareerWithPlans>>(`/careers?${filter}page=${page}&limit=20&includePlans=1`);
}

export function getCareer(id: string): Promise<CareerDetail | null> {
  return get<CareerDetail>(`/careers/${id}`);
}

export function getPlans(careerId: string, page: number): Promise<Paged<Plan> | null> {
  return get<Paged<Plan>>(`/study-plans?careerId=${careerId}&page=${page}&limit=20`);
}

export function getPlan(id: string): Promise<PlanDetail | null> {
  return get<PlanDetail>(`/study-plans/${id}`);
}

export function getSubjects(planId: string, q: string, page: number): Promise<Paged<Subject> | null> {
  return get<Paged<Subject>>(`/subjects?studyPlanId=${planId}&q=${encodeURIComponent(q)}&page=${page}&limit=20`);
}

export async function getPlanSubjects(planId: string, q: string, page: number): Promise<Paged<PlanSubject> | null> {
  try {
    const res = await fetch(
      `${API}/api/study-plans/${planId}/subjects?q=${encodeURIComponent(q)}&page=${page}&limit=20`,
      { headers: { cookie: cookies().toString() }, cache: "no-store" },
    );

    if (!res.ok) return null;

    return (await res.json()) as Paged<PlanSubject>;
  } catch {
    return null;
  }
}
