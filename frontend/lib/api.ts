export class ApiError extends Error {
  status: number;

  constructor(status: number) {
    super(`api ${status}`);

    this.status = status;
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, { credentials: "include", ...init });

  if (!res.ok) throw new ApiError(res.status);

  return (await res.json()) as T;
}
