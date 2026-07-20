import Image from "next/image";
import { AddPlayerModal } from "@/app/add-player-modal";
import { StatusToggle } from "@/app/status-toggle";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const avatars = [
  "/avatars/player-archer.svg",
  "/avatars/player-tactician.svg",
  "/avatars/player-crown.svg",
];

function getSafeImageUrl(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export default async function Home() {
  const accounts = await prisma.game_accounts.findMany({
    orderBy: {
      created_at: "desc",
    },
    select: {
      id: true,
      player_id: true,
      nickname: true,
      server_id: true,
      is_active: true,
      kid: true,
      stove_lv: true,
      stove_lv_content: true,
      avatar_image: true,
      total_recharge_amount: true,
    },
  });

  const players = accounts.map((account, index) => ({
    id: account.player_id,
    name: account.nickname?.trim() || "ไม่ระบุชื่อ",
    server: account.server_id?.trim() || (account.kid ? String(account.kid) : "-"),
    isActive: account.is_active,
    avatar: account.avatar_image?.trim() || avatars[index % avatars.length],
    stoveLevel: account.stove_lv,
    stoveLvContent: getSafeImageUrl(account.stove_lv_content),
    recharge: account.total_recharge_amount,
  }));

  const activeCount = players.filter((player) => player.isActive).length;
  const serverCount = new Set(
    players
      .map((player) => player.server)
      .filter((server) => server !== "-"),
  ).size;

  return (
    <main className="min-h-screen bg-[#f7f8f3] text-[#161814]">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-8 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-5 border-b border-[#d9ddcf] pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-[#5e6b44]">
              Kingshot Accounts
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-[#171a12] sm:text-4xl">
              รายชื่อผู้เล่น
            </h1>
          </div>
            <AddPlayerModal />
          </div>
          <div className="grid grid-cols-3 gap-3 text-center sm:min-w-80">
            <div className="border-l border-[#d9ddcf] px-4">
              <p className="text-2xl font-semibold">{players.length}</p>
              <p className="text-xs font-medium uppercase text-[#68715a]">
                Users
              </p>
            </div>
            <div className="border-l border-[#d9ddcf] px-4">
              <p className="text-2xl font-semibold">{activeCount}</p>
              <p className="text-xs font-medium uppercase text-[#68715a]">
                Active
              </p>
            </div>
            <div className="border-l border-[#d9ddcf] px-4">
              <p className="text-2xl font-semibold">{serverCount}</p>
              <p className="text-xs font-medium uppercase text-[#68715a]">
                Servers
              </p>
            </div>
          </div>
        </header>

        <div className="overflow-hidden rounded-lg border border-[#d9ddcf] bg-white shadow-sm">
          <div className="grid grid-cols-[88px_1fr] gap-4 border-b border-[#e5e8df] bg-[#eef1e8] px-4 py-3 text-xs font-semibold uppercase text-[#667055] sm:grid-cols-[104px_1.2fr_1fr_120px_120px]">
            <span>รูป</span>
            <span>ชื่อจากเกม</span>
            <span className="hidden sm:block">User ID</span>
            <span className="hidden sm:block">เตา</span>
            <span className="hidden sm:block">สถานะ</span>
          </div>

          {players.length > 0 ? (
            <div className="divide-y divide-[#edf0e8]">
              {players.map((player) => (
              <article
                className="grid grid-cols-[88px_1fr] items-center gap-4 px-4 py-4 transition-colors hover:bg-[#fafbf7] sm:grid-cols-[104px_1.2fr_1fr_120px_120px]"
                key={player.id}
              >
                <Image
                  src={player.avatar}
                  alt={`รูปโปรไฟล์ของ ${player.name}`}
                  width={64}
                  height={64}
                  className="h-16 w-16 rounded-md border border-[#d8ddcf] bg-[#f3f5ed]"
                  priority
                />
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold text-[#171a12]">
                    {player.name}
                  </h2>
                  <p className="mt-1 text-sm text-[#68715a]">
                    Server {player.server}
                  </p>
                  <p className="mt-2 break-all font-mono text-xs text-[#4d5740] sm:hidden">
                    {player.id}
                  </p>
                </div>
                <p className="hidden break-all font-mono text-sm text-[#384030] sm:block">
                  {player.id}
                </p>
                <div className="hidden items-center gap-2 text-sm font-medium text-[#384030] sm:flex">
                  <span>{player.stoveLevel ? `Lv. ${player.stoveLevel}` : "-"}</span>
                  {player.stoveLvContent ? (
                    <Image
                      src={player.stoveLvContent}
                      alt={`เมืองเลเวล ${player.stoveLevel ?? ""}`}
                      width={24}
                      height={24}
                      className="h-6 w-6 object-contain"
                    />
                  ) : null}
                </div>
                <div className="hidden items-center gap-3 sm:flex">
                  <StatusToggle
                    playerId={player.id}
                    isActive={player.isActive}
                  />
                  <span className="text-sm font-medium text-[#455431]">
                    {player.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </article>
              ))}
            </div>
          ) : (
            <div className="px-4 py-12 text-center">
              <p className="text-lg font-semibold text-[#171a12]">
                ยังไม่มีข้อมูลผู้เล่น
              </p>
              <p className="mt-2 text-sm text-[#68715a]">
                เมื่อมีข้อมูลในตาราง game_accounts รายชื่อจะแสดงที่หน้านี้
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
