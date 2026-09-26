CREATE TABLE `notifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`kind` text NOT NULL,
	`text` text NOT NULL,
	`href` text,
	`read_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `notifications_user_idx` ON `notifications` (`user_id`,`id`);--> statement-breakpoint
CREATE TABLE `outbound_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`channel` text NOT NULL,
	`to` text NOT NULL,
	`subject` text NOT NULL,
	`body` text NOT NULL,
	`status` text NOT NULL,
	`error` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `outbound_created_idx` ON `outbound_messages` (`created_at`);--> statement-breakpoint
CREATE TABLE `stock_lots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`store_id` integer NOT NULL,
	`product_slug` text NOT NULL,
	`option_idx` integer NOT NULL,
	`lot_code` text,
	`expiry` text,
	`qty` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `stock_lots_product_idx` ON `stock_lots` (`product_slug`,`option_idx`);--> statement-breakpoint
CREATE INDEX `stock_lots_store_idx` ON `stock_lots` (`store_id`);--> statement-breakpoint
CREATE TABLE `stores` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`address` text NOT NULL,
	`lat` real NOT NULL,
	`lng` real NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	`active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `stores_code_unique` ON `stores` (`code`);--> statement-breakpoint
ALTER TABLE `addresses` ADD `lat` real;--> statement-breakpoint
ALTER TABLE `addresses` ADD `lng` real;--> statement-breakpoint
ALTER TABLE `orders` ADD `kind` text DEFAULT 'sale' NOT NULL;--> statement-breakpoint
ALTER TABLE `stock_moves` ADD `store_id` integer;--> statement-breakpoint
ALTER TABLE `stock_moves` ADD `lot_id` integer;--> statement-breakpoint
ALTER TABLE `warranty_requests` ADD `replacement_order_id` integer REFERENCES orders(id);--> statement-breakpoint
ALTER TABLE `warranty_requests` ADD `refund_amount` integer;--> statement-breakpoint
ALTER TABLE `warranty_requests` ADD `refund_status` text;--> statement-breakpoint
ALTER TABLE `warranty_requests` ADD `refund_ref` text;--> statement-breakpoint
ALTER TABLE `warranty_requests` ADD `refunded_by` text;--> statement-breakpoint
ALTER TABLE `warranty_requests` ADD `refunded_at` integer;--> statement-breakpoint
INSERT INTO `stores` (`code`, `name`, `address`, `lat`, `lng`, `is_default`) VALUES
  ('Q7', 'Vườn ươm Quận 7', '169 Phạm Hữu Lầu, Phường Tân Mỹ, TP. Hồ Chí Minh', 10.7162, 106.7338, 1),
  ('NVL', 'Cửa hàng Nguyễn Văn Linh', '1487 Nguyễn Văn Linh, Phường Tân Hưng, TP. Hồ Chí Minh', 10.7291, 106.7047, 0),
  ('TD', 'Cửa hàng Thảo Điền', '25 Quốc Hương, Phường An Khánh, TP. Hồ Chí Minh', 10.8036, 106.7327, 0);--> statement-breakpoint
INSERT INTO `stock_lots` (`store_id`, `product_slug`, `option_idx`, `qty`)
  SELECT (SELECT `id` FROM `stores` WHERE `code` = 'Q7'), `product_slug`, `idx`, `stock` FROM `product_options` WHERE `stock` > 0;--> statement-breakpoint
UPDATE `stock_moves` SET `store_id` = (SELECT `id` FROM `stores` WHERE `code` = 'Q7');
