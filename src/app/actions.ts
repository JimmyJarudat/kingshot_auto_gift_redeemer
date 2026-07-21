"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type GameAccountProfile = {
  playerId: string;
  nickname: string | null;
  kid: number | null;
  stoveLv: number | null;
  stoveLvContent: string | null;
  avatarImage: string | null;
  totalRechargeAmount: number | null;
};

type GiftCodeResponse = {
  code?: number;
  data?: {
    err_code?: number | string;
  };
  msg?: string;
  err_code?: number | string;
};

type PlayerApiResponse = {
  code?: number;
  data?: {
    fid?: number | string;
    nickname?: string | null;
    kid?: number | string | null;
    stove_lv?: number | string | null;
    stove_lv_content?: string | number | null;
    avatar_image?: string | null;
    total_recharge_amount?: number | string | null;
  };
  msg?: string;
  err_code?: number | string;
};

function normalizePlayerId(value: FormDataEntryValue | string | null) {
  return String(value ?? "")
    .replace(/\D/g, "")
    .trim();
}

function normalizeImageUrl(value: string | number | null | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function signParams(params: Record<string, string>) {
  const secretKey = process.env.SECRET_KEY;

  if (!secretKey) {
    throw new Error("SECRET_KEY is not set");
  }

  const raw = Object.keys(params)
    .sort()
    .map((key) => `${key}=${encodeURIComponent(params[key])}`)
    .join("&");

  return createHash("md5").update(raw + secretKey, "utf8").digest("hex");
}

async function redeemGiftCode(playerId: string, kingdomId: string, giftCode: string) {
  const redeemParams = {
    fid: playerId,
    kid: kingdomId,
    cdk: giftCode,
    time: String(Math.floor(Date.now() / 1000)),
  };
  const sign = signParams(redeemParams);
  const body = new URLSearchParams({
    sign,
    ...redeemParams,
  });

  const response = await fetch("https://kingshot-giftcode.centurygame.com/api/gift_code", {
    method: "POST",
    headers: {
      accept: "application/json, text/plain, */*",
      "content-type": "application/x-www-form-urlencoded",
      origin: "https://ks-giftcode.centurygame.com",
      referer: "https://ks-giftcode.centurygame.com/",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/150.0 Safari/537.36",
    },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Gift delivery request failed");
  }

  return (await response.json()) as GiftCodeResponse;
}

async function fetchPlayerProfile(playerId: string) {
  const playerParams = {
    fid: playerId,
    time: String(Date.now()),
  };
  const sign = signParams(playerParams);
  const body = new URLSearchParams({
    sign,
    ...playerParams,
  });

  const response = await fetch("https://kingshot-giftcode.centurygame.com/api/player", {
    method: "POST",
    headers: {
      accept: "application/json, text/plain, */*",
      "content-type": "application/x-www-form-urlencoded",
      origin: "https://ks-giftcode.centurygame.com",
      referer: "https://ks-giftcode.centurygame.com/",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/150.0 Safari/537.36",
    },
    body,
    cache: "no-store",
  });

  const text = await response.text();
  let payload: PlayerApiResponse | string;

  try {
    payload = JSON.parse(text) as PlayerApiResponse;
  } catch {
    payload = text;
  }

  console.log("[add-player:/api/player]", {
    ok: response.ok,
    status: response.status,
    playerId,
    payload,
  });

  if (!response.ok || typeof payload === "string" || Number(payload.code) !== 0) {
    throw new Error("Failed to login game account");
  }

  return payload;
}

function mapRedeemStatus(payload: GiftCodeResponse) {
  const code = Number(payload.code ?? -1);
  const errCode = Number(payload.err_code ?? payload.data?.err_code ?? -1);
  const message = payload.msg?.trim().toUpperCase();

  if (code === 0 && errCode === 20000) {
    return "success";
  }

  if (errCode === 40008) {
    return "success";
  }

  if (message === "RECEIVED." || message === "RECEIVED") {
    return "success";
  }

  if ([40001, 40003, 40007].includes(errCode)) {
    return "already_redeemed";
  }

  if (errCode === 40002) {
    return "expired";
  }

  return "failed";
}

export async function searchGameAccount(
  playerIdInput: string,
): Promise<GameAccountProfile> {
  const playerId = normalizePlayerId(playerIdInput);

  if (!playerId) {
    throw new Error("Player ID is required");
  }

  const payload = await fetchPlayerProfile(playerId);
  const data = payload.data;

  if (!data) {
    throw new Error("Player profile was not found");
  }

  return {
    playerId: String(data.fid ?? playerId),
    nickname: data.nickname ?? null,
    kid: data.kid == null ? null : Number(data.kid),
    stoveLv: data.stove_lv == null ? null : Number(data.stove_lv),
    stoveLvContent: normalizeImageUrl(data.stove_lv_content),
    avatarImage: normalizeImageUrl(data.avatar_image),
    totalRechargeAmount:
      data.total_recharge_amount == null ? null : Number(data.total_recharge_amount),
  };
}

export async function importGameAccount(profile: GameAccountProfile) {
  const playerId = normalizePlayerId(profile.playerId);

  if (!playerId) {
    throw new Error("Player ID is required");
  }

  const now = new Date();

  await prisma.game_accounts.upsert({
    where: {
      player_id: playerId,
    },
    create: {
      player_id: playerId,
      nickname: profile.nickname,
      server_id: profile.kid ? String(profile.kid) : null,
      kid: profile.kid,
      stove_lv: profile.stoveLv,
      stove_lv_content: profile.stoveLvContent,
      avatar_image: profile.avatarImage,
      total_recharge_amount: profile.totalRechargeAmount,
      updated_at: now,
    },
    update: {
      nickname: profile.nickname,
      server_id: profile.kid ? String(profile.kid) : null,
      kid: profile.kid,
      stove_lv: profile.stoveLv,
      stove_lv_content: profile.stoveLvContent,
      avatar_image: profile.avatarImage,
      total_recharge_amount: profile.totalRechargeAmount,
      updated_at: now,
    },
  });

  revalidatePath("/");
}

export async function updateGameAccountStatus(playerIdInput: string, isActive: boolean) {
  const playerId = normalizePlayerId(playerIdInput);

  if (!playerId) {
    throw new Error("Player ID is required");
  }

  await prisma.game_accounts.update({
    where: {
      player_id: playerId,
    },
    data: {
      is_active: isActive,
      updated_at: new Date(),
    },
  });

  revalidatePath("/");
}

export async function syncGameAccount(playerIdInput: string) {
  normalizePlayerId(playerIdInput);
  throw new Error("Profile sync is currently unavailable after the Kingshot redeem update.");
}

export async function deleteGameAccount(playerIdInput: string) {
  const playerId = normalizePlayerId(playerIdInput);

  if (!playerId) {
    throw new Error("Player ID is required");
  }

  await prisma.game_accounts.delete({
    where: {
      player_id: playerId,
    },
  });

  revalidatePath("/");
}

export async function refreshGiftCodes() {
  try {
    const response = await fetch("https://n8n.jarudat.com/webhook/refresh-gift-code", {
      method: "GET",
      cache: "no-store",
    });

    revalidatePath("/");

    return {
      ok: response.ok,
      status: response.status,
    };
  } catch {
    revalidatePath("/");

    return {
      ok: false,
      status: 0,
    };
  }
}

export async function sendGiftCodeToAllPlayers() {
  try {
    const response = await fetch("https://n8n.jarudat.com/webhook/sent-all", {
      method: "GET",
      cache: "no-store",
    });

    revalidatePath("/");

    return {
      ok: response.ok,
      status: response.status,
    };
  } catch {
    revalidatePath("/");

    return {
      ok: false,
      status: 0,
    };
  }
}

export async function sendLatestGiftCodeToPlayer(playerIdInput: string) {
  const playerId = normalizePlayerId(playerIdInput);

  if (!playerId) {
    throw new Error("Player ID is required");
  }

  const [account, latestGiftCode] = await Promise.all([
    prisma.game_accounts.findUnique({
      where: {
        player_id: playerId,
      },
      select: {
        id: true,
        is_active: true,
        server_id: true,
        kid: true,
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
      },
    }),
  ]);

  if (!account) {
    throw new Error("Player was not found");
  }

  if (!account.is_active) {
    throw new Error("Player is inactive");
  }

  const kingdomId = account.server_id?.trim() || (account.kid ? String(account.kid) : "");

  if (!kingdomId) {
    throw new Error(`Missing Kingdom/server_id for player ${playerId}`);
  }

  if (!latestGiftCode) {
    throw new Error("No gift code is available");
  }

  if (latestGiftCode.status === "disabled") {
    throw new Error("Latest gift code is disabled");
  }

  const existingRedemption = await prisma.gift_code_redemptions.findUnique({
    where: {
      gift_code_id_game_account_id: {
        gift_code_id: latestGiftCode.id,
        game_account_id: account.id,
      },
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (
    existingRedemption?.status === "success" ||
    existingRedemption?.status === "already_redeemed"
  ) {
    revalidatePath("/");
    return {
      status: existingRedemption.status,
    };
  }

  if (existingRedemption?.status === "processing") {
    throw new Error("This gift is already being sent");
  }

  const now = new Date();
  const redemption = existingRedemption
    ? await prisma.gift_code_redemptions.update({
        where: {
          id: existingRedemption.id,
        },
        data: {
          status: "processing",
          attempt_count: {
            increment: 1,
          },
          response_message: null,
          response_data: undefined,
          processed_at: null,
          queued_at: now,
          updated_at: now,
        },
        select: {
          id: true,
        },
      })
    : await prisma.gift_code_redemptions.create({
        data: {
          gift_code_id: latestGiftCode.id,
          game_account_id: account.id,
          status: "processing",
          attempt_count: 1,
          queued_at: now,
          updated_at: now,
        },
        select: {
          id: true,
        },
      });

  try {
    const payload = await redeemGiftCode(playerId, kingdomId, latestGiftCode.code);
    const status = mapRedeemStatus(payload);
    const processedAt = new Date();

    await prisma.gift_code_redemptions.update({
      where: {
        id: redemption.id,
      },
      data: {
        status,
        response_message: payload.msg ?? "Gift delivery completed",
        response_data: payload,
        processed_at: processedAt,
        updated_at: processedAt,
      },
    });

    if (status === "success" || status === "already_redeemed") {
      await prisma.game_accounts.update({
        where: {
          player_id: playerId,
        },
        data: {
          last_redeemed_at: processedAt,
          updated_at: processedAt,
        },
      });
    }

    revalidatePath("/");
    return {
      status,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gift delivery failed";
    const processedAt = new Date();

    await prisma.gift_code_redemptions.update({
      where: {
        id: redemption.id,
      },
      data: {
        status: "failed",
        response_message: message,
        response_data: {
          message,
        },
        processed_at: processedAt,
        updated_at: processedAt,
      },
    });

    revalidatePath("/");
    throw error;
  }
}
