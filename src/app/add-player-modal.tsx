"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import {
  importGameAccount,
  searchGameAccount,
  type GameAccountProfile,
} from "@/app/actions";

export function AddPlayerModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [playerId, setPlayerId] = useState("");
  const [profile, setProfile] = useState<GameAccountProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, startSearchTransition] = useTransition();
  const [isImporting, startImportTransition] = useTransition();

  function closeModal() {
    setIsOpen(false);
    setPlayerId("");
    setProfile(null);
    setError(null);
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setProfile(null);

    startSearchTransition(async () => {
      try {
        const result = await searchGameAccount(playerId);
        setProfile(result);
      } catch (searchError) {
        setError(
          searchError instanceof Error
            ? searchError.message
            : "ไม่สามารถค้นหาผู้เล่นได้",
        );
      }
    });
  }

  function handleImport() {
    if (!profile) {
      return;
    }

    setError(null);
    startImportTransition(async () => {
      try {
        await importGameAccount(profile);
        router.refresh();
        closeModal();
      } catch (importError) {
        setError(
          importError instanceof Error
            ? importError.message
            : "ไม่สามารถ import ผู้เล่นได้",
        );
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="h-11 rounded-md bg-[#314a2c] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#263d22]"
      >
        Add ผู้เล่น
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6">
          <div
            className="absolute inset-0"
            onClick={closeModal}
            aria-hidden="true"
          />
          <div
            className="relative w-full max-w-lg rounded-lg border border-[#d9ddcf] bg-white shadow-xl"
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
                  Add ผู้เล่น
                </h2>
                <p className="mt-1 text-sm text-[#68715a]">
                  กรอกไอดีเพื่อค้นหาข้อมูลจากเกมก่อน import
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="h-8 w-8 rounded-md border border-[#d9ddcf] text-lg leading-none text-[#4d5740] transition-colors hover:bg-[#f3f5ed]"
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 px-5 py-5">
              <form onSubmit={handleSearch} className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <label className="flex min-w-0 flex-col gap-2">
                  <span className="text-sm font-semibold text-[#384030]">
                    ไอดีผู้เล่น
                  </span>
                  <input
                    value={playerId}
                    onChange={(event) => setPlayerId(event.target.value)}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]+"
                    required
                    placeholder="เช่น 247069619"
                    className="h-11 rounded-md border border-[#cfd8bc] bg-[#fbfcf8] px-3 text-base text-[#171a12] outline-none transition-colors placeholder:text-[#8a927d] focus:border-[#748a4d]"
                  />
                </label>
                <button
                  type="submit"
                  disabled={isSearching || !playerId.trim()}
                  className="h-11 self-end rounded-md border border-[#314a2c] px-5 text-sm font-semibold text-[#314a2c] transition-colors hover:bg-[#f1f5e9] disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {isSearching ? "กำลังค้นหา" : "ค้นหา"}
                </button>
              </form>

              {error ? (
                <p className="rounded-md border border-[#e8c9bd] bg-[#fff5f0] px-3 py-2 text-sm text-[#8c3f25]">
                  {error}
                </p>
              ) : null}

              {profile ? (
                <div className="rounded-lg border border-[#d9ddcf] bg-[#fbfcf8] p-4">
                  <div className="flex gap-4">
                    {profile.avatarImage ? (
                      <Image
                        src={profile.avatarImage}
                        alt={`รูปโปรไฟล์ของ ${profile.nickname || profile.playerId}`}
                        width={72}
                        height={72}
                        className="h-[72px] w-[72px] rounded-md border border-[#d8ddcf] object-cover"
                      />
                    ) : (
                      <div className="flex h-[72px] w-[72px] items-center justify-center rounded-md border border-[#d8ddcf] bg-[#eef1e8] text-sm font-semibold text-[#667055]">
                        No image
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-lg font-semibold text-[#171a12]">
                        {profile.nickname || "ไม่ระบุชื่อ"}
                      </p>
                      <p className="mt-1 break-all font-mono text-sm text-[#4d5740]">
                        {profile.playerId}
                      </p>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-[#384030]">
                        <span>Server {profile.kid ?? "-"}</span>
                        <span>Stove Lv. {profile.stoveLv ?? "-"}</span>
                        <span>
                          เมือง{" "}
                          {profile.goldCityLevel
                            ? `ทอง ${profile.goldCityLevel}`
                            : "-"}
                        </span>
                        <span>Recharge {profile.totalRechargeAmount ?? 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={handleImport}
                      disabled={isImporting}
                      className="h-10 rounded-md bg-[#314a2c] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#263d22] disabled:cursor-not-allowed disabled:opacity-55"
                    >
                      {isImporting ? "กำลัง import" : "Import"}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
