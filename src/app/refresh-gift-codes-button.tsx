"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { refreshGiftCodes } from "@/app/actions";

export function RefreshGiftCodesButton() {
  const router = useRouter();
  const [hasError, setHasError] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleRefresh() {
    setHasError(false);

    startTransition(async () => {
      try {
        await refreshGiftCodes();
        router.refresh();
      } catch {
        setHasError(true);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleRefresh}
      disabled={isPending}
      title={hasError ? "Refresh failed" : "Refresh gift codes"}
      aria-label="Refresh gift codes"
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-md border px-4 text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[#caa35a] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
        hasError
          ? "border-[#d89a7f] bg-[#fff5f0] text-[#8c3f25]"
          : "border-[#caa35a] bg-white/75 text-[#7b5d1e] hover:bg-white"
      }`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      >
        <path d="M21 12a9 9 0 0 1-15.4 6.4" />
        <path d="M3 12A9 9 0 0 1 18.4 5.6" />
        <path d="M18 2v4h4" />
        <path d="M6 22v-4H2" />
      </svg>
      {isPending ? "Refreshing" : "Refresh"}
    </button>
  );
}
