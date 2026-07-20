import Image from "next/image";
import { AddPlayerModal } from "@/app/add-player-modal";
import { StatusToggle } from "@/app/status-toggle";
import { RowActions } from "@/app/sync-button";
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
    name: account.nickname?.trim() || "Unnamed player",
    server: account.server_id?.trim() || (account.kid ? String(account.kid) : "-"),
    isActive: account.is_active,
    avatar: account.avatar_image?.trim() || avatars[index % avatars.length],
    stoveLevel: account.stove_lv,
    stoveLvContent: getSafeImageUrl(account.stove_lv_content),
    recharge: account.total_recharge_amount,
  }));

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f8f3] text-[#161814]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
        style={{
          backgroundImage: "url('https://kingshot.gg/images/bg_hero.jpg')",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[#f7f8f3]/80"
      />
      <section className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-8 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between gap-4 border-b border-[#d9ddcf] pb-6">
          <div className="flex min-w-0 items-center gap-4">
            <Image
              src="https://ks-giftcode.centurygame.com/img/logo.6037a257.png"
              alt="Kingshot"
              width={192}
              height={64}
              className="h-14 w-auto object-contain"
              priority
            />
            <div className="hidden min-w-0 sm:block">
              <h1 className="truncate text-2xl font-semibold text-[#171a12]">
                Kingshot Auto Gift Redeemer
              </h1>
            </div>
          </div>
          <AddPlayerModal />
        </header>

        <div className="overflow-hidden rounded-lg border border-[#d9ddcf] bg-white shadow-sm">
          <div className="grid grid-cols-[88px_1fr] gap-4 border-b border-[#e5e8df] bg-[#eef1e8] px-4 py-3 text-xs font-semibold uppercase text-[#667055] sm:grid-cols-[104px_1.2fr_1fr_120px_140px_96px]">
            <span>Avatar</span>
            <span>In-game name</span>
            <span className="hidden sm:block">User ID</span>
            <span className="hidden sm:block">Stove Level</span>
            <span className="hidden sm:block">Status</span>
            <span className="hidden sm:block">Action</span>
          </div>

          {players.length > 0 ? (
            <div className="divide-y divide-[#edf0e8]">
              {players.map((player) => (
              <article
                className="grid grid-cols-[88px_1fr] items-center gap-4 px-4 py-4 transition-colors hover:bg-[#fafbf7] sm:grid-cols-[104px_1.2fr_1fr_120px_140px_96px]"
                key={player.id}
              >
                <Image
                  src={player.avatar}
                  alt={`${player.name} profile avatar`}
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
                      alt={`Furnace level ${player.stoveLevel ?? ""}`}
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
                <div className="hidden sm:block">
                  <RowActions playerId={player.id} />
                </div>
              </article>
              ))}
            </div>
          ) : (
            <div className="px-4 py-12 text-center">
              <p className="text-lg font-semibold text-[#171a12]">
                No players yet
              </p>
              <p className="mt-2 text-sm text-[#68715a]">
                Imported game accounts will appear here.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
