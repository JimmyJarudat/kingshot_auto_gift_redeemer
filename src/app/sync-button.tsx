"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { syncGameAccount } from "@/app/actions";

type SyncButtonProps = {
  playerId: string;
};

export function SyncButton({ playerId }: SyncButtonProps) {
  const router = useRouter();
  const [error, setError] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSync() {
    setError(false);

    startTransition(async () => {
      try {
        await syncGameAccount(playerId);
        router.refresh();
      } catch {
        setError(true);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleSync}
      disabled={isPending}
      title={error ? "ซิงก์ไม่สำเร็จ" : "ซิงก์ข้อมูลจากเกม"}
      className={`h-9 rounded-md border px-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
        error
          ? "border-[#d89a7f] bg-[#fff5f0] text-[#8c3f25]"
          : "border-[#cfd8bc] bg-white text-[#314a2c] hover:bg-[#f1f5e9]"
      }`}
    >
      {isPending ? "Syncing" : "Sync"}
    </button>
  );
}
