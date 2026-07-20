"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { sendGiftCodeToAllPlayers } from "@/app/actions";

export function SendGiftAllButton() {
  const router = useRouter();
  const [hasError, setHasError] = useState(false);
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSendAll() {
    setHasError(false);
    setStatusCode(null);

    startTransition(async () => {
      const result = await sendGiftCodeToAllPlayers();
      setHasError(!result.ok);
      setStatusCode(result.status);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleSendAll}
      disabled={isPending}
      title={
        hasError
          ? `Send all failed${statusCode ? ` (${statusCode})` : ""}`
          : "Send latest gift code to all players"
      }
      aria-label="Send latest gift code to all players"
      className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border px-4 text-sm font-semibold shadow-md transition focus:outline-none focus:ring-2 focus:ring-[#caa35a] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
        hasError
          ? "border-[#d89a7f] bg-[#fff5f0] text-[#8c3f25]"
          : "border-[#b98a32] bg-[#171a12] text-[#fff8df] hover:bg-[#2b2f22]"
      }`}
    >
      {isPending ? (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-4 w-4 animate-spin"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        >
          <path d="M21 12a9 9 0 0 1-9 9" />
          <path d="M3 12a9 9 0 0 1 9-9" />
        </svg>
      ) : (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        >
          <path d="M20 12v10H4V12" />
          <path d="M2 7h20v5H2z" />
          <path d="M12 22V7" />
          <path d="M12 7H7.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7z" />
          <path d="M12 7h4.5a2.5 2.5 0 1 0 0-5C13 2 12 7 12 7z" />
        </svg>
      )}
      {isPending ? "Sending" : hasError ? "Failed" : "Send Gift All"}
    </button>
  );
}
