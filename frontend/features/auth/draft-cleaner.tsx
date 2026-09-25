"use client";

import { useRef } from "react";
import { usePathname } from "next/navigation";
import { clearAllDrafts } from "./form-draft";

function isLegal(pathname: string): boolean {
  return pathname === "/legal" || pathname.startsWith("/legal/");
}

export default function DraftCleaner(): null {
  const pathname = usePathname();
  const previous = useRef(pathname);

  if (previous.current !== pathname) {
    const coming = previous.current;

    previous.current = pathname;

    if (!isLegal(coming) && !isLegal(pathname)) clearAllDrafts();
  }

  return null;
}
