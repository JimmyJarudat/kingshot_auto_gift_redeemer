"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateGameAccountStatus } from "@/app/actions";

type StatusToggleProps = {
  playerId: string;
  isActive: boolean;
};

export function StatusToggle({ playerId, isActive }: StatusToggleProps) {
  const router = useRouter();
  const [checked, setChecked] = useState(isActive);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    const nextChecked = !checked;
    setChecked(nextChecked);

    startTransition(async () => {
      try {
        await updateGameAccountStatus(playerId, nextChecked);
        router.refresh();
      } catch {
        setChecked(!nextChecked);
      }
    });
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={`${checked ? "Disable" : "Enable"} player ${playerId}`}
      disabled={isPending}
      onClick={handleToggle}
      className={`inline-flex h-7 w-12 items-center rounded-full border p-0.5 transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
        checked
          ? "border-[#7d9655] bg-[#7d9655]"
          : "border-[#c7cdbc] bg-[#eef1e8]"
      }`}
    >
      <span
        className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
