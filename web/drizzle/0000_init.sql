CREATE TABLE "addresses" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"street" text NOT NULL,
	"area" text NOT NULL,
	"kind" text DEFAULT 'home' NOT NULL,
	"conditions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"lat" double precision,
	"lng" double precision,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"kind" text NOT NULL,
	"text" text NOT NULL,
	"href" text,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"status" text NOT NULL,
	"note" text,
	"actor" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"product_slug" text NOT NULL,
	"option_idx" integer NOT NULL,
	"name" text NOT NULL,
	"label" text NOT NULL,
	"unit" text NOT NULL,
	"icon" text NOT NULL,
	"ship" text NOT NULL,
	"price" integer NOT NULL,
	"old_price" integer,
	"qty" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"kind" text DEFAULT 'sale' NOT NULL,
	"user_id" integer,
	"status" text DEFAULT 'pending' NOT NULL,
	"customer_name" text NOT NULL,
	"phone" text NOT NULL,
	"delivery" text NOT NULL,
	"address" text,
	"slot" text,
	"note" text,
	"payment_method" text NOT NULL,
	"paid" boolean DEFAULT false NOT NULL,
	"original" integer NOT NULL,
	"subtotal" integer NOT NULL,
	"plant_ship" integer NOT NULL,
	"supply_ship" integer NOT NULL,
	"total" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "otp_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"phone" text NOT NULL,
	"code_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outbound_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"channel" text NOT NULL,
	"to" text NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"status" text NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_options" (
	"product_slug" text NOT NULL,
	"idx" integer NOT NULL,
	"label" text NOT NULL,
	"price" integer NOT NULL,
	"old_price" integer,
	"stock" integer DEFAULT 100 NOT NULL,
	CONSTRAINT "product_options_product_slug_idx_pk" PRIMARY KEY("product_slug","idx")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"slug" text PRIMARY KEY NOT NULL,
	"sku" text NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"sub" text NOT NULL,
	"icon" text NOT NULL,
	"origin" text NOT NULL,
	"ship" text NOT NULL,
	"pesticide" boolean DEFAULT false NOT NULL,
	"unit" text NOT NULL,
	"spec" text NOT NULL,
	"lead" text NOT NULL,
	"specs" jsonb NOT NULL,
	"keywords" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"rating_x10" integer DEFAULT 0 NOT NULL,
	"reviews" integer DEFAULT 0 NOT NULL,
	"sold" integer DEFAULT 0 NOT NULL,
	"flash_sold" integer,
	"flash_total" integer,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_lots" (
	"id" serial PRIMARY KEY NOT NULL,
	"store_id" integer NOT NULL,
	"product_slug" text NOT NULL,
	"option_idx" integer NOT NULL,
	"lot_code" text,
	"expiry" text,
	"qty" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_moves" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_slug" text NOT NULL,
	"option_idx" integer NOT NULL,
	"store_id" integer,
	"lot_id" integer,
	"delta" integer NOT NULL,
	"after" integer NOT NULL,
	"reason" text NOT NULL,
	"note" text,
	"actor" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stores" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "stores_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"phone" text NOT NULL,
	"name" text,
	"email" text,
	"role" text DEFAULT 'customer' NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "warranty_photos" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" integer NOT NULL,
	"file" text NOT NULL,
	"mime" text NOT NULL,
	"data" "bytea",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "warranty_photos_file_unique" UNIQUE("file")
);
--> statement-breakpoint
CREATE TABLE "warranty_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"order_item_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"symptoms" jsonb NOT NULL,
	"description" text,
	"placement" text,
	"watering" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"resolution" text,
	"cause" text,
	"engineer_note" text,
	"decided_by" text,
	"decided_at" timestamp with time zone,
	"replacement_order_id" integer,
	"refund_amount" integer,
	"refund_status" text,
	"refund_ref" text,
	"refunded_by" text,
	"refunded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outbound_messages" ADD CONSTRAINT "outbound_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_options" ADD CONSTRAINT "product_options_product_slug_products_slug_fk" FOREIGN KEY ("product_slug") REFERENCES "public"."products"("slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_lots" ADD CONSTRAINT "stock_lots_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warranty_photos" ADD CONSTRAINT "warranty_photos_request_id_warranty_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."warranty_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warranty_requests" ADD CONSTRAINT "warranty_requests_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warranty_requests" ADD CONSTRAINT "warranty_requests_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warranty_requests" ADD CONSTRAINT "warranty_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warranty_requests" ADD CONSTRAINT "warranty_requests_replacement_order_id_orders_id_fk" FOREIGN KEY ("replacement_order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "addresses_user_idx" ON "addresses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id","id");--> statement-breakpoint
CREATE INDEX "order_events_order_idx" ON "order_events" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_items_order_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_code_idx" ON "orders" USING btree ("code");--> statement-breakpoint
CREATE INDEX "orders_user_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "otp_phone_idx" ON "otp_codes" USING btree ("phone","created_at");--> statement-breakpoint
CREATE INDEX "outbound_created_idx" ON "outbound_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "products_cat_idx" ON "products" USING btree ("category","sub");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "stock_lots_product_idx" ON "stock_lots" USING btree ("product_slug","option_idx");--> statement-breakpoint
CREATE INDEX "stock_lots_store_idx" ON "stock_lots" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "stock_moves_product_idx" ON "stock_moves" USING btree ("product_slug","option_idx");--> statement-breakpoint
CREATE INDEX "warranty_user_idx" ON "warranty_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "warranty_status_idx" ON "warranty_requests" USING btree ("status");--> statement-breakpoint
-- Supabase: khóa API công khai (anon/authenticated); server kết nối bằng user postgres nên không bị ảnh hưởng.
ALTER TABLE "addresses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "order_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "order_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "otp_codes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "outbound_messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "product_options" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "stock_lots" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "stock_moves" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "stores" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "warranty_photos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "warranty_requests" ENABLE ROW LEVEL SECURITY;
