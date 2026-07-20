"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

type LoginResponse = {
  code: number;
  data?: {
    fid?: number;
    nickname?: string;
    kid?: number;
    stove_lv?: number;
    stove_lv_content?: number;
    avatar_image?: string;
    total_recharge_amount?: number;
  };
  msg?: string;
  err_code?: string;
};

function cleanNickname(nickname: string | undefined) {
  return nickname?.replace(/\u2800/g, "").trim() || null;
}

async function fetchGameProfile(playerId: string) {
  const loginUrl = process.env.KINGSHOT_LOGIN_URL;

  if (!loginUrl) {
    return null;
  }

  const response = await fetch(loginUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fid: Number(playerId),
      player_id: playerId,
    }),
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

export async function addGameAccount(formData: FormData) {
  const playerId = String(formData.get("playerId") ?? "")
    .replace(/\D/g, "")
    .trim();

  if (!playerId) {
    return;
  }

  const profile = await fetchGameProfile(playerId);
  const profilePlayerId = profile?.fid ? String(profile.fid) : playerId;
  const now = new Date();

  await prisma.game_accounts.upsert({
    where: {
      player_id: profilePlayerId,
    },
    create: {
      player_id: profilePlayerId,
      nickname: cleanNickname(profile?.nickname),
      server_id: profile?.kid ? String(profile.kid) : null,
      kid: profile?.kid ?? null,
      stove_lv: profile?.stove_lv ?? null,
      stove_lv_content: profile?.stove_lv_content ?? null,
      avatar_image: profile?.avatar_image ?? null,
      total_recharge_amount: profile?.total_recharge_amount ?? null,
      updated_at: now,
    },
    update: {
      nickname: profile ? cleanNickname(profile.nickname) : undefined,
      server_id: profile?.kid ? String(profile.kid) : undefined,
      kid: profile?.kid ?? undefined,
      stove_lv: profile?.stove_lv ?? undefined,
      stove_lv_content: profile?.stove_lv_content ?? undefined,
      avatar_image: profile?.avatar_image ?? undefined,
      total_recharge_amount: profile?.total_recharge_amount ?? undefined,
      updated_at: now,
    },
  });

  revalidatePath("/");
}
