-- CreateTable
CREATE TABLE "game_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "player_id" VARCHAR(100) NOT NULL,
    "nickname" VARCHAR(100),
    "server_id" VARCHAR(100),
    "redeem_token" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_redeemed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gift_code_redemptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "gift_code_id" UUID NOT NULL,
    "game_account_id" UUID NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'pending',
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "response_message" TEXT,
    "response_data" JSONB,
    "queued_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gift_code_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gift_code_sources" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "url" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_fetched_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gift_code_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gift_codes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(100) NOT NULL,
    "source_id" UUID,
    "status" VARCHAR(20) NOT NULL DEFAULT 'unknown',
    "reward_description" TEXT,
    "published_at" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6),
    "first_seen_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gift_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "game_accounts_player_id_unique" ON "game_accounts"("player_id");

-- CreateIndex
CREATE INDEX "idx_game_accounts_active" ON "game_accounts"("is_active");

-- CreateIndex
CREATE INDEX "idx_redemptions_account" ON "gift_code_redemptions"("game_account_id");

-- CreateIndex
CREATE INDEX "idx_redemptions_code" ON "gift_code_redemptions"("gift_code_id");

-- CreateIndex
CREATE INDEX "idx_redemptions_status" ON "gift_code_redemptions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "gift_code_redemptions_unique" ON "gift_code_redemptions"("gift_code_id", "game_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "gift_code_sources_url_unique" ON "gift_code_sources"("url");

-- CreateIndex
CREATE UNIQUE INDEX "gift_codes_code_unique" ON "gift_codes"("code");

-- CreateIndex
CREATE INDEX "idx_gift_codes_status" ON "gift_codes"("status");

-- AddForeignKey
ALTER TABLE "gift_code_redemptions" ADD CONSTRAINT "gift_code_redemptions_game_account_id_fkey" FOREIGN KEY ("game_account_id") REFERENCES "game_accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "gift_code_redemptions" ADD CONSTRAINT "gift_code_redemptions_gift_code_id_fkey" FOREIGN KEY ("gift_code_id") REFERENCES "gift_codes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "gift_codes" ADD CONSTRAINT "gift_codes_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "gift_code_sources"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
