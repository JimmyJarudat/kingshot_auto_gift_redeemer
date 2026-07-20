"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteGameAccount, syncGameAccount } from "@/app/actions";

type SyncButtonProps = {
  playerId: string;
};

export function RowActions({ playerId }: SyncButtonProps) {
  const router = useRouter();
  const [syncError, setSyncError] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSyncPending, startSyncTransition] = useTransition();
  const [isDeletePending, startDeleteTransition] = useTransition();

  function handleSync() {
    setSyncError(false);

    startSyncTransition(async () => {
      try {
        await syncGameAccount(playerId);
        router.refresh();
      } catch {
        setSyncError(true);
      }
    });
  }

  function handleDelete() {
    setDeleteError(false);
    startDeleteTransition(async () => {
      try {
        await deleteGameAccount(playerId);
        router.refresh();
        setIsDeleteModalOpen(false);
      } catch {
        setDeleteError(true);
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleSync}
        disabled={isSyncPending || isDeletePending}
        title={syncError ? "ซิงก์ไม่สำเร็จ" : "ซิงก์ข้อมูลจากเกม"}
        aria-label="ซิงก์ข้อมูลจากเกม"
        className={`inline-flex h-9 w-9 items-center justify-center rounded-md border transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
          syncError
            ? "border-[#d89a7f] bg-[#fff5f0] text-[#8c3f25]"
            : "border-[#cfd8bc] bg-white text-[#314a2c] hover:bg-[#f1f5e9]"
        }`}
      >
        <svg
          aria-hidden="true"
          className={`h-4 w-4 ${isSyncPending ? "animate-spin" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12a9 9 0 0 1-15.4 6.4" />
          <path d="M3 12A9 9 0 0 1 18.4 5.6" />
          <path d="M18 2v4h4" />
          <path d="M6 22v-4H2" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => setIsDeleteModalOpen(true)}
        disabled={isSyncPending || isDeletePending}
        title={deleteError ? "ลบไม่สำเร็จ" : "ลบผู้เล่น"}
        aria-label="ลบผู้เล่น"
        className={`inline-flex h-9 w-9 items-center justify-center rounded-md border transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
          deleteError
            ? "border-[#d89a7f] bg-[#fff5f0] text-[#8c3f25]"
            : "border-[#e3c8bd] bg-white text-[#8c3f25] hover:bg-[#fff5f0]"
        }`}
      >
        <svg
          aria-hidden="true"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 6h18" />
          <path d="M8 6V4h8v2" />
          <path d="M19 6l-1 14H6L5 6" />
          <path d="M10 11v5" />
          <path d="M14 11v5" />
        </svg>
      </button>
      {isDeleteModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6">
          <div
            className="absolute inset-0"
            onClick={() => {
              if (!isDeletePending) {
                setIsDeleteModalOpen(false);
              }
            }}
            aria-hidden="true"
          />
          <div
            className="relative w-full max-w-sm rounded-lg border border-[#e3c8bd] bg-white shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`delete-player-${playerId}`}
          >
            <div className="border-b border-[#f0ded7] px-5 py-4">
              <h2
                id={`delete-player-${playerId}`}
                className="text-lg font-semibold text-[#171a12]"
              >
                ยืนยันการลบผู้เล่น
              </h2>
              <p className="mt-2 break-all text-sm text-[#68715a]">
                ต้องการลบผู้เล่น ID {playerId} ออกจากระบบหรือไม่?
              </p>
            </div>
            <div className="flex justify-end gap-3 px-5 py-4">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeletePending}
                className="h-10 rounded-md border border-[#cfd8bc] px-4 text-sm font-semibold text-[#314a2c] transition-colors hover:bg-[#f1f5e9] disabled:cursor-not-allowed disabled:opacity-60"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeletePending}
                className="h-10 rounded-md bg-[#8c3f25] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#71301b] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeletePending ? "กำลังลบ" : "ลบผู้เล่น"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
