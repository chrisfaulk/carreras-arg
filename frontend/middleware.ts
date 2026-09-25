import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest): NextResponse {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const policy = `default-src 'self'; script-src 'self' 'nonce-${nonce}'`;

  const headers = new Headers(request.headers);

  headers.set("x-nonce", nonce);

  const response = NextResponse.next({ request: { headers } });

  response.headers.set("Content-Security-Policy", policy);

  return response;
}
