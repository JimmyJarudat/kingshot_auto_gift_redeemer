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

type LoginResponse = {
  code: number;
  data?: {
    fid?: number;
    nickname?: string;
    kid?: number;
    stove_lv?: number;
    stove_lv_content?: string | number;
    avatar_image?: string;
    total_recharge_amount?: number;
  };
  msg?: string;
  err_code?: string;
};

function cleanNickname(nickname: string | undefined) {
  return nickname?.replace(/\u2800/g, "").trim() || null;
}

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
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return createHash("md5").update(raw + secretKey, "utf8").digest("hex");
}

async function fetchGameProfile(playerId: string) {
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

  if (!response.ok) {
    throw new Error("Failed to login game account");
  }

  const payload = (await response.json()) as LoginResponse;

  if (payload.code !== 0 || !payload.data) {
    throw new Error(payload.msg || "Game login failed");
  }

  return payload.data;
}

function mapLoginDataToProfile(
  profile: NonNullable<LoginResponse["data"]>,
  fallbackPlayerId: string,
) {
  return {
    playerId: profile.fid ? String(profile.fid) : fallbackPlayerId,
    nickname: cleanNickname(profile.nickname),
    kid: profile.kid ?? null,
    stoveLv: profile.stove_lv ?? null,
    stoveLvContent: normalizeImageUrl(profile.stove_lv_content),
    avatarImage: normalizeImageUrl(profile.avatar_image),
    totalRechargeAmount: profile.total_recharge_amount ?? null,
  } satisfies GameAccountProfile;
}

export async function searchGameAccount(playerIdInput: string) {
  const playerId = normalizePlayerId(playerIdInput);

  if (!playerId) {
    throw new Error("Player ID is required");
  }

  const profile = await fetchGameProfile(playerId);

  return mapLoginDataToProfile(profile, playerId);
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
  const playerId = normalizePlayerId(playerIdInput);

  if (!playerId) {
    throw new Error("Player ID is required");
  }

  const loginData = await fetchGameProfile(playerId);
  const profile = mapLoginDataToProfile(loginData, playerId);

  await prisma.game_accounts.update({
    where: {
      player_id: playerId,
    },
    data: {
      player_id: profile.playerId,
      nickname: profile.nickname,
      server_id: profile.kid ? String(profile.kid) : null,
      kid: profile.kid,
      stove_lv: profile.stoveLv,
      stove_lv_content: profile.stoveLvContent,
      avatar_image: profile.avatarImage,
      total_recharge_amount: profile.totalRechargeAmount,
      updated_at: new Date(),
    },
  });

  revalidatePath("/");
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
