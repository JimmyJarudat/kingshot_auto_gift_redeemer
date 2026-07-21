"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addGameAccountManually } from "@/app/actions";

type AddPlayerModalProps = {
  triggerVariant?: "default" | "mobile";
};

export function AddPlayerModal({ triggerVariant = "default" }: AddPlayerModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [playerId, setPlayerId] = useState("");
  const [serverId, setServerId] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function closeModal() {
    setIsOpen(false);
    setPlayerId("");
    setServerId("");
    setNickname("");
    setError(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        await addGameAccountManually({
          playerId,
          serverId,
          nickname,
        });
        router.refresh();
        closeModal();
      } catch (addError) {
        setError(
          addError instanceof Error
            ? addError.message
            : "Unable to add this player.",
        );
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center justify-center gap-1.5 rounded-md font-semibold transition-colors ${
          triggerVariant === "mobile"
            ? "h-9 border border-[#caa35a] bg-white/90 px-3 text-xs text-[#6f541f] shadow-sm hover:bg-[#fff8df]"
            : "h-11 bg-[#314a2c] px-5 text-sm text-white hover:bg-[#263d22]"
        }`}
      >
        {triggerVariant === "mobile" ? (
          <svg
            aria-hidden="true"
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          >
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
        ) : null}
        Add Player
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6">
          <div
            className="absolute inset-0"
            onClick={closeModal}
            aria-hidden="true"
          />
          <div
            className="relative w-full max-w-md rounded-lg border border-[#d9ddcf] bg-white shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-player-title"
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#e5e8df] px-5 py-4">
              <div>
                <h2
                  id="add-player-title"
                  className="text-lg font-semibold text-[#171a12]"
                >
                  Add Player
                </h2>
                <p className="mt-1 text-sm text-[#68715a]">
                  Add a player for the gift code bot.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="h-8 w-8 rounded-md border border-[#d9ddcf] text-lg leading-none text-[#4d5740] transition-colors hover:bg-[#f3f5ed]"
                aria-label="Close modal"
              >
                x
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
              <label className="flex min-w-0 flex-col gap-2">
                <span className="text-sm font-semibold text-[#384030]">
                  Player ID <span className="text-[#8c3f25]">*</span>
                </span>
                <input
                  value={playerId}
                  onChange={(event) => setPlayerId(event.target.value)}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]+"
                  required
                  placeholder="e.g. 247069619"
                  className="h-11 rounded-md border border-[#cfd8bc] bg-[#fbfcf8] px-3 text-base text-[#171a12] outline-none transition-colors placeholder:text-[#8a927d] focus:border-[#748a4d]"
                />
              </label>

              <label className="flex min-w-0 flex-col gap-2">
                <span className="text-sm font-semibold text-[#384030]">
                  Server <span className="text-[#8c3f25]">*</span>
                </span>
                <input
                  value={serverId}
                  onChange={(event) => setServerId(event.target.value)}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]+"
                  required
                  placeholder="e.g. 1647"
                  className="h-11 rounded-md border border-[#cfd8bc] bg-[#fbfcf8] px-3 text-base text-[#171a12] outline-none transition-colors placeholder:text-[#8a927d] focus:border-[#748a4d]"
                />
              </label>

              <label className="flex min-w-0 flex-col gap-2">
                <span className="text-sm font-semibold text-[#384030]">
                  Nickname
                </span>
                <input
                  value={nickname}
                  onChange={(event) => setNickname(event.target.value)}
                  type="text"
                  maxLength={100}
                  placeholder="Optional"
                  className="h-11 rounded-md border border-[#cfd8bc] bg-[#fbfcf8] px-3 text-base text-[#171a12] outline-none transition-colors placeholder:text-[#8a927d] focus:border-[#748a4d]"
                />
              </label>

              {error ? (
                <p className="rounded-md border border-[#e8c9bd] bg-[#fff5f0] px-3 py-2 text-sm text-[#8c3f25]">
                  {error}
                </p>
              ) : null}

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isPending}
                  className="h-10 rounded-md border border-[#cfd8bc] px-4 text-sm font-semibold text-[#314a2c] transition-colors hover:bg-[#f1f5e9] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || !playerId.trim() || !serverId.trim()}
                  className="h-10 rounded-md bg-[#314a2c] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#263d22] disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {isPending ? "Adding" : "Add Player"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
