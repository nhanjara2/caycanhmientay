CREATE TABLE `order_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`status` text NOT NULL,
	`note` text,
	`actor` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `order_events_order_idx` ON `order_events` (`order_id`);--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`product_slug` text NOT NULL,
	`option_idx` integer NOT NULL,
	`name` text NOT NULL,
	`label` text NOT NULL,
	`unit` text NOT NULL,
	`icon` text NOT NULL,
	`ship` text NOT NULL,
	`price` integer NOT NULL,
	`old_price` integer,
	`qty` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `order_items_order_idx` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`user_id` integer,
	`status` text DEFAULT 'pending' NOT NULL,
	`customer_name` text NOT NULL,
	`phone` text NOT NULL,
	`delivery` text NOT NULL,
	`address` text,
	`slot` text,
	`note` text,
	`payment_method` text NOT NULL,
	`paid` integer DEFAULT false NOT NULL,
	`original` integer NOT NULL,
	`subtotal` integer NOT NULL,
	`plant_ship` integer NOT NULL,
	`supply_ship` integer NOT NULL,
	`total` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_code_idx` ON `orders` (`code`);--> statement-breakpoint
CREATE INDEX `orders_user_idx` ON `orders` (`user_id`);--> statement-breakpoint
CREATE INDEX `orders_status_idx` ON `orders` (`status`);--> statement-breakpoint
CREATE TABLE `otp_codes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`phone` text NOT NULL,
	`code_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`consumed_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `otp_phone_idx` ON `otp_codes` (`phone`,`created_at`);--> statement-breakpoint
CREATE TABLE `product_options` (
	`product_slug` text NOT NULL,
	`idx` integer NOT NULL,
	`label` text NOT NULL,
	`price` integer NOT NULL,
	`old_price` integer,
	`stock` integer DEFAULT 100 NOT NULL,
	PRIMARY KEY(`product_slug`, `idx`),
	FOREIGN KEY (`product_slug`) REFERENCES `products`(`slug`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `products` (
	`slug` text PRIMARY KEY NOT NULL,
	`sku` text NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`sub` text NOT NULL,
	`icon` text NOT NULL,
	`origin` text NOT NULL,
	`ship` text NOT NULL,
	`pesticide` integer DEFAULT false NOT NULL,
	`unit` text NOT NULL,
	`spec` text NOT NULL,
	`lead` text NOT NULL,
	`specs` text NOT NULL,
	`keywords` text DEFAULT '[]' NOT NULL,
	`rating_x10` integer DEFAULT 0 NOT NULL,
	`reviews` integer DEFAULT 0 NOT NULL,
	`sold` integer DEFAULT 0 NOT NULL,
	`flash_sold` integer,
	`flash_total` integer,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_sku_unique` ON `products` (`sku`);--> statement-breakpoint
CREATE INDEX `products_cat_idx` ON `products` (`category`,`sub`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`phone` text NOT NULL,
	`name` text,
	`email` text,
	`role` text DEFAULT 'customer' NOT NULL,
	`points` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_phone_unique` ON `users` (`phone`);