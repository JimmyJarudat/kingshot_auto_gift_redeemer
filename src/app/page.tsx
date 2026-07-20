import Image from "next/image";
import { AddPlayerModal } from "@/app/add-player-modal";
import { CopyButton } from "@/app/copy-button";
import { StatusToggle } from "@/app/status-toggle";
import { RowActions } from "@/app/sync-button";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const avatars = [
  "/avatars/player-archer.svg",
  "/avatars/player-tactician.svg",
  "/avatars/player-crown.svg",
];

const redemptionLabels: Record<string, string> = {
  success: "Delivered",
  already_redeemed: "Already Claimed",
  pending: "Waiting",
  processing: "Sending",
  failed: "Failed",
  expired: "Expired",
};

const redemptionStyles: Record<string, string> = {
  success: "border-[#9eb66d] bg-[#f1f7e8] text-[#4d642d]",
  already_redeemed: "border-[#caa35a] bg-[#fff8df] text-[#7b5d1e]",
  pending: "border-[#d8ddcf] bg-[#f7f8f3] text-[#68715a]",
  processing: "border-[#9db7c7] bg-[#eef7fb] text-[#315c73]",
  failed: "border-[#e3c8bd] bg-[#fff5f0] text-[#8c3f25]",
  expired: "border-[#d0c7bd] bg-[#f7f2ed] text-[#725d4a]",
  not_sent: "border-[#d8ddcf] bg-white text-[#68715a]",
};

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
  const [accounts, latestGiftCode] = await Promise.all([
    prisma.game_accounts.findMany({
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
    }),
    prisma.gift_codes.findFirst({
      orderBy: {
        first_seen_at: "desc",
      },
      select: {
        id: true,
        code: true,
        status: true,
        reward_description: true,
        gift_code_redemptions: {
          select: {
            game_account_id: true,
            status: true,
          },
        },
      },
    }),
  ]);

  const latestRedemptionsByAccount = new Map(
    latestGiftCode?.gift_code_redemptions.map((redemption) => [
      redemption.game_account_id,
      redemption.status,
    ]) ?? [],
  );

  const featuredGiftCode = latestGiftCode
    ? {
        code: latestGiftCode.code,
        status: latestGiftCode.status,
        reward: latestGiftCode.reward_description,
      }
    : null;

  const statusStyles: Record<string, string> = {
    active: "border-[#9eb66d] bg-[#f1f7e8] text-[#4d642d]",
    expired: "border-[#e3c8bd] bg-[#fff5f0] text-[#8c3f25]",
    unknown: "border-[#d8ddcf] bg-[#f7f8f3] text-[#68715a]",
  };

  const getGiftStatusClass = (status: string) =>
    statusStyles[status.toLowerCase()] ??
    "border-[#d8ddcf] bg-[#f7f8f3] text-[#68715a]";

  const players = accounts.map((account, index) => ({
    id: account.player_id,
    name: account.nickname?.trim() || "Unnamed player",
    server: account.server_id?.trim() || (account.kid ? String(account.kid) : "-"),
    isActive: account.is_active,
    avatar: account.avatar_image?.trim() || avatars[index % avatars.length],
    stoveLevel: account.stove_lv,
    stoveLvContent: getSafeImageUrl(account.stove_lv_content),
    recharge: account.total_recharge_amount,
    latestGiftStatus:
      latestRedemptionsByAccount.get(account.id)?.toLowerCase() ?? "not_sent",
  }));

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#10130f] text-[#161814]">
      <img
        aria-hidden="true"
        src="/images.jpg"
        alt=""
        className="pointer-events-none fixed inset-0 h-full w-full object-cover opacity-55"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-white/30"
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

        <section className="overflow-hidden rounded-lg border border-[#caa35a] bg-[#fff8df]/95 shadow-lg shadow-black/10 backdrop-blur-[1px]">
          {featuredGiftCode ? (
            <div className="relative grid gap-5 px-5 py-5 sm:grid-cols-[1fr_auto] sm:items-center">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,#d5a94855,transparent_60%)]"
              />
              <div className="relative min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-xs font-semibold uppercase text-[#7b5d1e]">
                    Latest Gift Code
                  </p>
                  <span
                    className={`inline-flex rounded-md border px-3 py-1 text-xs font-semibold uppercase ${getGiftStatusClass(
                      featuredGiftCode.status,
                    )}`}
                  >
                    {featuredGiftCode.status}
                  </span>
                </div>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <p className="min-w-0 break-all font-mono text-3xl font-semibold text-[#171a12] sm:text-4xl">
                    {featuredGiftCode.code}
                  </p>
                  <CopyButton value={featuredGiftCode.code} />
                </div>
                {featuredGiftCode.reward ? (
                  <p className="mt-2 text-sm text-[#665633]">
                    {featuredGiftCode.reward}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                className="relative inline-flex h-12 w-full items-center justify-center gap-2 rounded-md border border-[#b98a32] bg-[#171a12] px-5 text-sm font-semibold text-[#fff8df] shadow-md transition hover:bg-[#2b2f22] focus:outline-none focus:ring-2 focus:ring-[#caa35a] focus:ring-offset-2 sm:w-auto"
                aria-label="Send latest gift code to all players"
              >
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
                Send Gift
              </button>
            </div>
          ) : (
            <div className="px-5 py-5">
              <p className="text-xs font-semibold uppercase text-[#7b5d1e]">
                Latest Gift Code
              </p>
              <p className="mt-2 text-2xl font-semibold text-[#171a12]">
                No gift codes yet
              </p>
              <p className="mt-1 text-sm text-[#665633]">
                New codes collected by the automation will be featured here.
              </p>
            </div>
          )}
        </section>

        <div className="overflow-hidden rounded-lg border border-[#d9ddcf] bg-white/95 shadow-sm backdrop-blur-[1px]">
          <div className="grid grid-cols-[88px_1fr] gap-4 border-b border-[#e5e8df] bg-[#eef1e8] px-4 py-3 text-xs font-semibold uppercase text-[#667055] sm:grid-cols-[88px_1.15fr_0.95fr_110px_150px_120px_88px]">
            <span>Avatar</span>
            <span>In-game name</span>
            <span className="hidden sm:block">User ID</span>
            <span className="hidden sm:block">Stove Level</span>
            <span className="hidden sm:block">Latest Gift</span>
            <span className="hidden sm:block">Status</span>
            <span className="hidden sm:block">Action</span>
          </div>

          {players.length > 0 ? (
            <div className="divide-y divide-[#edf0e8]">
              {players.map((player) => (
              <article
                className="grid grid-cols-[88px_1fr] items-center gap-4 px-4 py-4 transition-colors hover:bg-[#fafbf7] sm:grid-cols-[88px_1.15fr_0.95fr_110px_150px_120px_88px]"
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
                  <div className="mt-3 sm:hidden">
                    <span
                      className={`inline-flex rounded-md border px-3 py-1 text-xs font-semibold ${redemptionStyles[player.latestGiftStatus] ?? redemptionStyles.not_sent}`}
                    >
                      {redemptionLabels[player.latestGiftStatus] ?? "Not Sent"}
                    </span>
                  </div>
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
                <div className="hidden sm:block">
                  <span
                    className={`inline-flex rounded-md border px-3 py-1 text-xs font-semibold ${redemptionStyles[player.latestGiftStatus] ?? redemptionStyles.not_sent}`}
                  >
                    {redemptionLabels[player.latestGiftStatus] ?? "Not Sent"}
                  </span>
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
