import Image from "next/image";
import { AddPlayerModal } from "@/app/add-player-modal";
import { CopyButton } from "@/app/copy-button";
import { RefreshGiftCodesButton } from "@/app/refresh-gift-codes-button";
import { SendGiftAllButton } from "@/app/send-gift-all-button";
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
  pending: "Queued",
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

function normalizeRedemptionStatus(status: string, responseMessage: string | null) {
  const message = responseMessage?.trim().toUpperCase();

  if (message === "RECEIVED." || message === "RECEIVED") {
    return "already_redeemed";
  }

  return status.toLowerCase();
}

function getResponseErrCode(responseData: unknown) {
  if (!responseData || typeof responseData !== "object") {
    return null;
  }

  const data = responseData as {
    err_code?: unknown;
    data?: {
      err_code?: unknown;
    };
  };
  const errCode = data.err_code ?? data.data?.err_code;

  if (typeof errCode === "number") {
    return errCode;
  }

  if (typeof errCode === "string") {
    const parsed = Number(errCode);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeRedemptionStatusFromResponse(
  status: string,
  responseMessage: string | null,
  responseData: unknown,
) {
  const errCode = getResponseErrCode(responseData);

  if (errCode === 40008) {
    return "already_redeemed";
  }

  return normalizeRedemptionStatus(status, responseMessage);
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
      where: {
        status: "active",
      },
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
            response_message: true,
            response_data: true,
          },
        },
      },
    }),
  ]);

  const latestRedemptionsByAccount = new Map(
    latestGiftCode?.gift_code_redemptions.map((redemption) => [
      redemption.game_account_id,
      normalizeRedemptionStatusFromResponse(
        redemption.status,
        redemption.response_message,
        redemption.response_data,
      ),
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
                KON Gift Redeemer
              </h1>
              <p className="mt-1 inline-flex max-w-full truncate rounded bg-[#171a12]/90 px-2 py-1 text-xs font-semibold uppercase text-[#fff8df] shadow-sm ring-1 ring-[#caa35a]/60">
                KILLERSofNIGHT Alliance
              </p>
            </div>
          </div>
          <div>
            <AddPlayerModal />
          </div>
        </header>

        <div className="rounded-lg border border-[#caa35a]/70 bg-[#171a12]/90 px-4 py-3 shadow-sm ring-1 ring-white/10 sm:hidden">
          <h1 className="text-xl font-semibold text-[#fff8df]">
            KON Gift Redeemer
          </h1>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[#d7bd78]">
            KILLERSofNIGHT Alliance
          </p>
        </div>

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
              <div className="relative flex w-full flex-col gap-3 sm:w-44">
                <RefreshGiftCodesButton />
                <SendGiftAllButton />
              </div>
            </div>
          ) : (
            <div className="px-5 py-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase text-[#7b5d1e]">
                  Latest Gift Code
                </p>
                <RefreshGiftCodesButton />
              </div>
              <p className="mt-2 text-2xl font-semibold text-[#171a12]">
                No gift codes yet
              </p>
              <p className="mt-1 text-sm text-[#665633]">
                New codes collected by the automation will be featured here.
              </p>
            </div>
          )}
        </section>

        <div className="overflow-hidden rounded-lg border border-[#d9ddcf] bg-white/90 shadow-sm backdrop-blur-[1px]">
          <div className="hidden gap-4 border-b border-[#e5e8df] bg-[#eef1e8] px-4 py-3 text-xs font-semibold uppercase text-[#667055] sm:grid sm:grid-cols-[88px_1.1fr_0.9fr_105px_145px_115px_132px]">
            <span>Avatar</span>
            <span>In-game name</span>
            <span>User ID</span>
            <span>Stove Level</span>
            <span>Latest Gift</span>
            <span>Status</span>
            <span>Action</span>
          </div>

          {players.length > 0 ? (
            <div className="space-y-3 bg-[#eef1e8]/70 p-3 sm:space-y-0 sm:divide-y sm:divide-[#edf0e8] sm:bg-transparent sm:p-0">
              {players.map((player) => (
              <article
                className="grid gap-3 rounded-lg border border-[#d9ddcf] bg-white px-3 py-3 shadow-sm transition-colors hover:bg-[#fafbf7] sm:rounded-none sm:border-0 sm:bg-transparent sm:px-4 sm:py-4 sm:shadow-none sm:grid-cols-[88px_1.1fr_0.9fr_105px_145px_115px_132px] sm:items-center"
                key={player.id}
              >
                <div className="grid grid-cols-[68px_1fr] gap-3 sm:contents">
                  <Image
                    src={player.avatar}
                    alt={`${player.name} profile avatar`}
                    width={64}
                    height={64}
                    className="h-16 w-16 rounded-md border border-[#d8ddcf] bg-[#f3f5ed]"
                    priority
                  />
                  <div className="grid min-w-0 grid-cols-[1fr_auto] gap-x-3 gap-y-2 sm:block">
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-semibold text-[#171a12]">
                        {player.name}
                      </h2>
                      <p className="mt-1 text-sm text-[#68715a]">
                        Server {player.server}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 self-start rounded-md border px-2.5 py-1 text-xs font-semibold sm:hidden ${redemptionStyles[player.latestGiftStatus] ?? redemptionStyles.not_sent}`}
                    >
                      {redemptionLabels[player.latestGiftStatus] ?? "Not Sent"}
                    </span>
                    <p className="min-w-0 break-all font-mono text-xs text-[#4d5740] sm:hidden">
                      {player.id}
                    </p>
                    <div className="flex items-end justify-end gap-2 self-end justify-self-end sm:hidden">
                      <div className="flex flex-col items-end gap-1">
                        <StatusToggle
                          playerId={player.id}
                          isActive={player.isActive}
                          compact
                        />
                        <span className="whitespace-nowrap text-[10px] font-medium text-[#68715a]">
                          Bot {player.isActive ? "on" : "off"}
                        </span>
                      </div>
                      <RowActions
                        playerId={player.id}
                        latestGiftStatus={player.latestGiftStatus}
                        compact
                      />
                    </div>
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
                  <RowActions
                    playerId={player.id}
                    latestGiftStatus={player.latestGiftStatus}
                  />
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
