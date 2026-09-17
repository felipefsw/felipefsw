-- CreateEnum
CREATE TYPE "papel_painel" AS ENUM ('admin_rede', 'gestor', 'gerente', 'equipe', 'auditor', 'cd');

-- CreateEnum
CREATE TYPE "funcao_empregado" AS ENUM ('producao', 'atendimento', 'lider_producao', 'gerente', 'diarista', 'entregador');

-- CreateEnum
CREATE TYPE "regime_empregado" AS ENUM ('6x1', '5x2', 'diarista');

-- CreateEnum
CREATE TYPE "unidade_ingrediente" AS ENUM ('kg', 'bola', 'un');

-- CreateEnum
CREATE TYPE "tamanho_receita" AS ENUM ('G', 'P', 'broto');

-- CreateEnum
CREATE TYPE "categoria_receita" AS ENUM ('salgada', 'doce', 'borda');

-- CreateEnum
CREATE TYPE "status_upload" AS ENUM ('recebido', 'processado', 'alerta', 'rejeitado');

-- CreateEnum
CREATE TYPE "tipo_pedido" AS ENUM ('D', 'B');

-- CreateEnum
CREATE TYPE "tipo_item_vendido" AS ENUM ('produto', 'metade', 'borda', 'bebida', 'outro');

-- CreateEnum
CREATE TYPE "status_presenca" AS ENUM ('P', 'A', 'F', 'T', 'O', 'S');

-- CreateEnum
CREATE TYPE "origem_presenca" AS ENUM ('ponto', 'gerente');

-- CreateEnum
CREATE TYPE "status_cmv" AS ENUM ('ok', 'bloco', 'pendente');

-- CreateEnum
CREATE TYPE "nome_checklist" AS ENUM ('Abertura', 'Pico', 'Fechamento');

-- CreateEnum
CREATE TYPE "status_semana" AS ENUM ('aberta', 'fechada', 'aprovada', 'paga');

-- CreateEnum
CREATE TYPE "tipo_auditoria" AS ENUM ('nutricao', 'rede');

-- AlterTable
ALTER TABLE "_GestorLojas" ADD CONSTRAINT "_GestorLojas_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_GestorLojas_AB_unique";

-- CreateTable
CREATE TABLE "brands" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stores" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "brand_id" UUID,
    "name" TEXT NOT NULL,
    "short_name" TEXT,
    "cnpj" TEXT,
    "address" TEXT,
    "city" TEXT,
    "open_time" TIME(0),
    "close_time" TIME(0),
    "tz" TEXT NOT NULL DEFAULT 'America/Fortaleza',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "loja_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "avatar_url" TEXT,
    "email" TEXT NOT NULL,
    "senha" TEXT,
    "token_senha" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberships" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "role" "papel_painel" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "store_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "role" "funcao_empregado" NOT NULL,
    "regime" "regime_empregado" NOT NULL,
    "shift_pref" TEXT,
    "admission_date" DATE,
    "monthly_cost" DECIMAL(14,2),
    "daily_rate" DECIMAL(14,2),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shifts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "store_id" UUID,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "start_time" TIME(0) NOT NULL,
    "end_time" TIME(0) NOT NULL,
    "break_start" TIME(0),
    "break_end" TIME(0),
    "paid_hours" DECIMAL(6,2) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "params" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "store_id" UUID,
    "key" TEXT NOT NULL,
    "value_num" DECIMAL(14,4),
    "value_text" TEXT,
    "valid_from" DATE NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "params_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredients" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" "unidade_ingrediente" NOT NULL,
    "pack_label" TEXT,
    "pack_size" DECIMAL(12,3),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cd_prices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ingredient_id" UUID NOT NULL,
    "price" DECIMAL(14,4) NOT NULL,
    "valid_from" DATE NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "cd_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "store_id" UUID,
    "product_name" TEXT NOT NULL,
    "size" "tamanho_receita" NOT NULL,
    "category" "categoria_receita" NOT NULL,
    "valid_from" DATE NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "recipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "recipe_id" UUID NOT NULL,
    "ingredient_id" UUID NOT NULL,
    "grams" DECIMAL(12,3) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "recipe_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_aliases" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "alias" TEXT NOT NULL,
    "recipe_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "product_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uploads" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "store_id" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "file_path" TEXT,
    "sha256" TEXT NOT NULL,
    "status" "status_upload" NOT NULL DEFAULT 'recebido',
    "summary" JSONB,
    "extracted" JSONB,
    "error" TEXT,
    "period_start" DATE,
    "period_end" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "store_id" UUID NOT NULL,
    "external_id" TEXT NOT NULL,
    "sold_at" TIMESTAMPTZ(6) NOT NULL,
    "ops_date" DATE NOT NULL,
    "channel" TEXT,
    "order_type" "tipo_pedido",
    "items_value" DECIMAL(14,2),
    "delivery_fee" DECIMAL(14,2),
    "surcharge" DECIMAL(14,2),
    "discount" DECIMAL(14,2),
    "total" DECIMAL(14,2),
    "courier_pay" DECIMAL(14,2),
    "courier_name" TEXT,
    "district" TEXT,
    "cancelled" BOOLEAN NOT NULL DEFAULT false,
    "upload_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items_sold" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "store_id" UUID NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "product_name" TEXT NOT NULL,
    "option_name" TEXT,
    "qty" INTEGER NOT NULL,
    "value" DECIMAL(14,2),
    "kind" "tipo_item_vendido" NOT NULL,
    "recipe_id" UUID,
    "upload_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "items_sold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_close" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "store_id" UUID NOT NULL,
    "ops_date" DATE NOT NULL,
    "total_faturado" DECIMAL(14,2) NOT NULL,
    "qty_orders" INTEGER NOT NULL,
    "source" TEXT,
    "upload_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "daily_close_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_hours" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "store_id" UUID NOT NULL,
    "ops_date" DATE NOT NULL,
    "hour" INTEGER NOT NULL,
    "items" INTEGER NOT NULL,
    "avg_sec" DECIMAL(10,2),
    "max_sec" DECIMAL(10,2),
    "upload_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "production_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "status_times" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "store_id" UUID NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "status" TEXT NOT NULL,
    "n" INTEGER NOT NULL,
    "avg_sec" DECIMAL(10,2),
    "max_sec" DECIMAL(10,2),
    "upload_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "status_times_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courier_settlements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "store_id" UUID NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "courier_name" TEXT NOT NULL,
    "fleet" TEXT,
    "deliveries" INTEGER NOT NULL,
    "fee" DECIMAL(14,2),
    "days" INTEGER,
    "value_delivered" DECIMAL(14,2),
    "upload_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "courier_settlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "store_id" UUID NOT NULL,
    "external_id" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "district" TEXT,
    "lifetime_orders" INTEGER,
    "lifetime_value" DECIMAL(14,2),
    "last_order" DATE,
    "upload_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ifood_orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "store_id" UUID NOT NULL,
    "ifood_id" TEXT NOT NULL,
    "ordered_at" TIMESTAMPTZ(6) NOT NULL,
    "ops_date" DATE NOT NULL,
    "status" TEXT NOT NULL,
    "items" DECIMAL(14,2),
    "paid" DECIMAL(14,2),
    "delivery_fee" DECIMAL(14,2),
    "incentive_ifood" DECIMAL(14,2),
    "incentive_store" DECIMAL(14,2),
    "service_fee" DECIMAL(14,2),
    "fees" DECIMAL(14,2),
    "net" DECIMAL(14,2),
    "payment" TEXT,
    "upload_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "ifood_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ifood_metrics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "store_id" UUID NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "visits" INTEGER,
    "item_views" INTEGER,
    "cart" INTEGER,
    "completed" INTEGER,
    "conversion" DECIMAL(7,3),
    "new_customers" INTEGER,
    "ads_spend" DECIMAL(14,2),
    "ads_visits" INTEGER,
    "ads_orders" INTEGER,
    "ads_sales" DECIMAL(14,2),
    "promo_store" DECIMAL(14,2),
    "promo_ifood" DECIMAL(14,2),
    "rating" DECIMAL(4,2),
    "cancel_pct" DECIMAL(7,3),
    "calls_pct" DECIMAL(7,3),
    "source" TEXT,
    "upload_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "ifood_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "store_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "ops_date" DATE NOT NULL,
    "status" "status_presenca" NOT NULL,
    "minutes_late" INTEGER,
    "source" "origem_presenca" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_counts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "store_id" UUID NOT NULL,
    "count_date" DATE NOT NULL,
    "counted_at" TIMESTAMPTZ(6),
    "ingredient_id" UUID NOT NULL,
    "qty" DECIMAL(12,3) NOT NULL,
    "unit" TEXT,
    "note" TEXT,
    "photo_path" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "stock_counts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cd_deliveries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "store_id" UUID NOT NULL,
    "delivered_at" TIMESTAMPTZ(6) NOT NULL,
    "cd_order_no" INTEGER,
    "ingredient_id" UUID NOT NULL,
    "qty" DECIMAL(12,3) NOT NULL,
    "unit" TEXT,
    "unit_price" DECIMAL(14,4),
    "upload_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "cd_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internal_consumption" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "store_id" UUID NOT NULL,
    "ops_date" DATE NOT NULL,
    "recipe_id" UUID NOT NULL,
    "qty" DECIMAL(12,3) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "internal_consumption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cmv_daily" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "store_id" UUID NOT NULL,
    "ops_date" DATE NOT NULL,
    "total_faturado" DECIMAL(14,2),
    "consumption_value" DECIMAL(14,2),
    "cmv_real_pct" DECIMAL(7,3),
    "cmv_theo_pct" DECIMAL(7,3),
    "block_group" INTEGER,
    "status" "status_cmv" NOT NULL,
    "details" JSONB,
    "params_version" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "cmv_daily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cmv_item_daily" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "store_id" UUID NOT NULL,
    "ops_date" DATE NOT NULL,
    "ingredient_id" UUID NOT NULL,
    "initial" DECIMAL(12,3),
    "received" DECIMAL(12,3),
    "final" DECIMAL(12,3),
    "consumed" DECIMAL(12,3),
    "theo" DECIMAL(12,3),
    "deviation_pct" DECIMAL(7,3),
    "value" DECIMAL(14,2),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "cmv_item_daily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "week_targets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "store_id" UUID NOT NULL,
    "week_start" DATE NOT NULL,
    "target_revenue" DECIMAL(14,2),
    "target_pizzas" INTEGER,
    "target_cmv" DECIMAL(7,3),
    "target_rating" DECIMAL(4,2),
    "message" TEXT,
    "set_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "week_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "week_indicators" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "store_id" UUID NOT NULL,
    "week_start" DATE NOT NULL,
    "revenue" DECIMAL(14,2),
    "orders" INTEGER,
    "pizzas" INTEGER,
    "ticket" DECIMAL(14,2),
    "cancel_pct" DECIMAL(7,3),
    "counter_pct" DECIMAL(7,3),
    "prod_time_avg" DECIMAL(7,3),
    "cmv_pct" DECIMAL(7,3),
    "rating" DECIMAL(4,2),
    "calls_pct" DECIMAL(7,3),
    "nutrition_pct" DECIMAL(7,3),
    "gramatura_ok" BOOLEAN,
    "source" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "week_indicators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "store_id" UUID,
    "name" "nome_checklist" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "checklist_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "template_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "reference_photo_path" TEXT,
    "requires_photo" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_marks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "store_id" UUID NOT NULL,
    "ops_date" DATE NOT NULL,
    "item_id" UUID NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "done_at" TIMESTAMPTZ(6),
    "done_by" UUID,
    "evidence_path" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "checklist_marks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "week_settlements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "store_id" UUID NOT NULL,
    "week_start" DATE NOT NULL,
    "status" "status_semana" NOT NULL DEFAULT 'aberta',
    "gates" JSONB,
    "team_prizes" JSONB,
    "hit_targets" INTEGER,
    "measured_targets" INTEGER,
    "total_payout" DECIMAL(14,2),
    "closed_at" TIMESTAMPTZ(6),
    "approved_by" UUID,
    "paid_at" TIMESTAMPTZ(6),
    "params_version" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "week_settlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payouts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "settlement_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "eligible" BOOLEAN NOT NULL DEFAULT false,
    "reasons" TEXT[],
    "presence" DECIMAL(14,2),
    "cmv" DECIMAL(14,2),
    "pizzas" DECIMAL(14,2),
    "quality" DECIMAL(14,2),
    "excellence" DECIMAL(14,2),
    "streak" DECIMAL(14,2),
    "total" DECIMAL(14,2),
    "streak_weeks" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leader_month" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "store_id" UUID NOT NULL,
    "month" DATE NOT NULL,
    "employee_id" UUID NOT NULL,
    "blocks" JSONB,
    "score" DECIMAL(7,3),
    "accelerator" BOOLEAN NOT NULL DEFAULT false,
    "prize" DECIMAL(14,2),
    "commission" DECIMAL(14,2),
    "gates" JSONB,
    "total" DECIMAL(14,2),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "leader_month_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manager_month" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "store_id" UUID NOT NULL,
    "month" DATE NOT NULL,
    "employee_id" UUID NOT NULL,
    "blocks" JSONB,
    "score" DECIMAL(7,3),
    "accelerator" BOOLEAN NOT NULL DEFAULT false,
    "prize" DECIMAL(14,2),
    "bonus110" DECIMAL(14,2),
    "commission" DECIMAL(14,2),
    "gates" JSONB,
    "total" DECIMAL(14,2),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "manager_month_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disputes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "settlement_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'aberta',
    "resolved_by" UUID,
    "resolution" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audits" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "store_id" UUID NOT NULL,
    "audit_date" DATE NOT NULL,
    "kind" "tipo_auditoria" NOT NULL,
    "score" DECIMAL(7,3),
    "blocks" JSONB,
    "photos" TEXT[],
    "auditor_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weighings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "store_id" UUID NOT NULL,
    "audit_id" UUID,
    "recipe_id" UUID NOT NULL,
    "expected_g" DECIMAL(12,3) NOT NULL,
    "measured_g" DECIMAL(12,3) NOT NULL,
    "ok" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "weighings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gamification_rules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "valid_from" DATE NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "gamification_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gamification_points" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "store_id" UUID NOT NULL,
    "week_start" DATE NOT NULL,
    "employee_id" UUID,
    "key" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "detail" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "gamification_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "store_id" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "payload" JSONB,
    "sent_at" TIMESTAMPTZ(6),
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_analyses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "store_id" UUID NOT NULL,
    "module" TEXT NOT NULL,
    "period_start" DATE,
    "period_end" DATE,
    "prompt_hash" TEXT,
    "text" TEXT NOT NULL,
    "model" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "ai_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holidays" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "date" DATE NOT NULL,
    "name" TEXT NOT NULL,
    "behaves_like" TEXT NOT NULL DEFAULT 'Sáb',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "holidays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tv_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "store_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "tv_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stores_loja_id_key" ON "stores"("loja_id");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_token_senha_key" ON "profiles"("token_senha");

-- CreateIndex
CREATE INDEX "memberships_store_id_idx" ON "memberships"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_user_id_store_id_key" ON "memberships"("user_id", "store_id");

-- CreateIndex
CREATE INDEX "employees_store_id_idx" ON "employees"("store_id");

-- CreateIndex
CREATE INDEX "shifts_store_id_idx" ON "shifts"("store_id");

-- CreateIndex
CREATE INDEX "params_key_idx" ON "params"("key");

-- CreateIndex
CREATE UNIQUE INDEX "params_store_id_key_valid_from_key" ON "params"("store_id", "key", "valid_from");

-- CreateIndex
CREATE UNIQUE INDEX "ingredients_code_key" ON "ingredients"("code");

-- CreateIndex
CREATE UNIQUE INDEX "cd_prices_ingredient_id_valid_from_key" ON "cd_prices"("ingredient_id", "valid_from");

-- CreateIndex
CREATE INDEX "recipes_store_id_idx" ON "recipes"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_items_recipe_id_ingredient_id_key" ON "recipe_items"("recipe_id", "ingredient_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_aliases_alias_key" ON "product_aliases"("alias");

-- CreateIndex
CREATE INDEX "product_aliases_recipe_id_idx" ON "product_aliases"("recipe_id");

-- CreateIndex
CREATE UNIQUE INDEX "uploads_sha256_key" ON "uploads"("sha256");

-- CreateIndex
CREATE INDEX "uploads_store_id_kind_idx" ON "uploads"("store_id", "kind");

-- CreateIndex
CREATE INDEX "orders_store_id_ops_date_idx" ON "orders"("store_id", "ops_date");

-- CreateIndex
CREATE INDEX "orders_store_id_sold_at_idx" ON "orders"("store_id", "sold_at");

-- CreateIndex
CREATE UNIQUE INDEX "orders_store_id_external_id_sold_at_key" ON "orders"("store_id", "external_id", "sold_at");

-- CreateIndex
CREATE INDEX "items_sold_store_id_period_start_period_end_idx" ON "items_sold"("store_id", "period_start", "period_end");

-- CreateIndex
CREATE UNIQUE INDEX "daily_close_store_id_ops_date_key" ON "daily_close"("store_id", "ops_date");

-- CreateIndex
CREATE INDEX "production_hours_store_id_ops_date_idx" ON "production_hours"("store_id", "ops_date");

-- CreateIndex
CREATE UNIQUE INDEX "production_hours_store_id_ops_date_hour_key" ON "production_hours"("store_id", "ops_date", "hour");

-- CreateIndex
CREATE UNIQUE INDEX "status_times_store_id_period_start_period_end_status_key" ON "status_times"("store_id", "period_start", "period_end", "status");

-- CreateIndex
CREATE UNIQUE INDEX "courier_settlements_store_id_period_start_period_end_courie_key" ON "courier_settlements"("store_id", "period_start", "period_end", "courier_name");

-- CreateIndex
CREATE INDEX "customers_store_id_last_order_idx" ON "customers"("store_id", "last_order");

-- CreateIndex
CREATE UNIQUE INDEX "customers_store_id_external_id_key" ON "customers"("store_id", "external_id");

-- CreateIndex
CREATE UNIQUE INDEX "ifood_orders_ifood_id_key" ON "ifood_orders"("ifood_id");

-- CreateIndex
CREATE INDEX "ifood_orders_store_id_ops_date_idx" ON "ifood_orders"("store_id", "ops_date");

-- CreateIndex
CREATE UNIQUE INDEX "ifood_metrics_store_id_period_start_period_end_source_key" ON "ifood_metrics"("store_id", "period_start", "period_end", "source");

-- CreateIndex
CREATE INDEX "attendance_store_id_ops_date_idx" ON "attendance"("store_id", "ops_date");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_store_id_employee_id_ops_date_key" ON "attendance"("store_id", "employee_id", "ops_date");

-- CreateIndex
CREATE INDEX "stock_counts_store_id_count_date_idx" ON "stock_counts"("store_id", "count_date");

-- CreateIndex
CREATE UNIQUE INDEX "stock_counts_store_id_count_date_ingredient_id_key" ON "stock_counts"("store_id", "count_date", "ingredient_id");

-- CreateIndex
CREATE INDEX "cd_deliveries_store_id_delivered_at_idx" ON "cd_deliveries"("store_id", "delivered_at");

-- CreateIndex
CREATE INDEX "cd_deliveries_store_id_cd_order_no_idx" ON "cd_deliveries"("store_id", "cd_order_no");

-- CreateIndex
CREATE UNIQUE INDEX "internal_consumption_store_id_ops_date_recipe_id_key" ON "internal_consumption"("store_id", "ops_date", "recipe_id");

-- CreateIndex
CREATE UNIQUE INDEX "cmv_daily_store_id_ops_date_key" ON "cmv_daily"("store_id", "ops_date");

-- CreateIndex
CREATE INDEX "cmv_item_daily_store_id_ops_date_idx" ON "cmv_item_daily"("store_id", "ops_date");

-- CreateIndex
CREATE UNIQUE INDEX "cmv_item_daily_store_id_ops_date_ingredient_id_key" ON "cmv_item_daily"("store_id", "ops_date", "ingredient_id");

-- CreateIndex
CREATE UNIQUE INDEX "week_targets_store_id_week_start_key" ON "week_targets"("store_id", "week_start");

-- CreateIndex
CREATE UNIQUE INDEX "week_indicators_store_id_week_start_key" ON "week_indicators"("store_id", "week_start");

-- CreateIndex
CREATE UNIQUE INDEX "checklist_templates_store_id_name_key" ON "checklist_templates"("store_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "checklist_items_template_id_position_key" ON "checklist_items"("template_id", "position");

-- CreateIndex
CREATE INDEX "checklist_marks_store_id_ops_date_idx" ON "checklist_marks"("store_id", "ops_date");

-- CreateIndex
CREATE UNIQUE INDEX "checklist_marks_store_id_ops_date_item_id_key" ON "checklist_marks"("store_id", "ops_date", "item_id");

-- CreateIndex
CREATE UNIQUE INDEX "week_settlements_store_id_week_start_key" ON "week_settlements"("store_id", "week_start");

-- CreateIndex
CREATE UNIQUE INDEX "payouts_settlement_id_employee_id_key" ON "payouts"("settlement_id", "employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "leader_month_store_id_month_employee_id_key" ON "leader_month"("store_id", "month", "employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "manager_month_store_id_month_employee_id_key" ON "manager_month"("store_id", "month", "employee_id");

-- CreateIndex
CREATE INDEX "disputes_settlement_id_idx" ON "disputes"("settlement_id");

-- CreateIndex
CREATE INDEX "audits_store_id_audit_date_idx" ON "audits"("store_id", "audit_date");

-- CreateIndex
CREATE INDEX "weighings_store_id_idx" ON "weighings"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "gamification_rules_key_valid_from_key" ON "gamification_rules"("key", "valid_from");

-- CreateIndex
CREATE INDEX "gamification_points_store_id_week_start_idx" ON "gamification_points"("store_id", "week_start");

-- CreateIndex
CREATE INDEX "alerts_store_id_kind_idx" ON "alerts"("store_id", "kind");

-- CreateIndex
CREATE INDEX "ai_analyses_store_id_module_idx" ON "ai_analyses"("store_id", "module");

-- CreateIndex
CREATE UNIQUE INDEX "holidays_date_key" ON "holidays"("date");

-- CreateIndex
CREATE UNIQUE INDEX "tv_tokens_token_key" ON "tv_tokens"("token");

-- CreateIndex
CREATE INDEX "tv_tokens_store_id_idx" ON "tv_tokens"("store_id");

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "stores_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "stores_loja_id_fkey" FOREIGN KEY ("loja_id") REFERENCES "Loja"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "params" ADD CONSTRAINT "params_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cd_prices" ADD CONSTRAINT "cd_prices_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_aliases" ADD CONSTRAINT "product_aliases_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "uploads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_sold" ADD CONSTRAINT "items_sold_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_sold" ADD CONSTRAINT "items_sold_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_sold" ADD CONSTRAINT "items_sold_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "uploads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_close" ADD CONSTRAINT "daily_close_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_close" ADD CONSTRAINT "daily_close_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "uploads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_hours" ADD CONSTRAINT "production_hours_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_hours" ADD CONSTRAINT "production_hours_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "uploads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_times" ADD CONSTRAINT "status_times_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_times" ADD CONSTRAINT "status_times_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "uploads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courier_settlements" ADD CONSTRAINT "courier_settlements_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courier_settlements" ADD CONSTRAINT "courier_settlements_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "uploads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "uploads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ifood_orders" ADD CONSTRAINT "ifood_orders_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ifood_orders" ADD CONSTRAINT "ifood_orders_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "uploads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ifood_metrics" ADD CONSTRAINT "ifood_metrics_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ifood_metrics" ADD CONSTRAINT "ifood_metrics_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "uploads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_counts" ADD CONSTRAINT "stock_counts_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_counts" ADD CONSTRAINT "stock_counts_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cd_deliveries" ADD CONSTRAINT "cd_deliveries_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cd_deliveries" ADD CONSTRAINT "cd_deliveries_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cd_deliveries" ADD CONSTRAINT "cd_deliveries_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "uploads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_consumption" ADD CONSTRAINT "internal_consumption_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_consumption" ADD CONSTRAINT "internal_consumption_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmv_daily" ADD CONSTRAINT "cmv_daily_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmv_item_daily" ADD CONSTRAINT "cmv_item_daily_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmv_item_daily" ADD CONSTRAINT "cmv_item_daily_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "week_targets" ADD CONSTRAINT "week_targets_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "week_indicators" ADD CONSTRAINT "week_indicators_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_templates" ADD CONSTRAINT "checklist_templates_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "checklist_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_marks" ADD CONSTRAINT "checklist_marks_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_marks" ADD CONSTRAINT "checklist_marks_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "checklist_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "week_settlements" ADD CONSTRAINT "week_settlements_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_settlement_id_fkey" FOREIGN KEY ("settlement_id") REFERENCES "week_settlements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leader_month" ADD CONSTRAINT "leader_month_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leader_month" ADD CONSTRAINT "leader_month_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manager_month" ADD CONSTRAINT "manager_month_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manager_month" ADD CONSTRAINT "manager_month_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_settlement_id_fkey" FOREIGN KEY ("settlement_id") REFERENCES "week_settlements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audits" ADD CONSTRAINT "audits_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weighings" ADD CONSTRAINT "weighings_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weighings" ADD CONSTRAINT "weighings_audit_id_fkey" FOREIGN KEY ("audit_id") REFERENCES "audits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weighings" ADD CONSTRAINT "weighings_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gamification_points" ADD CONSTRAINT "gamification_points_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gamification_points" ADD CONSTRAINT "gamification_points_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_analyses" ADD CONSTRAINT "ai_analyses_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tv_tokens" ADD CONSTRAINT "tv_tokens_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
